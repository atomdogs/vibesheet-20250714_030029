import IORedis from 'ioredis';
import { Queue, QueueScheduler, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import logger from 'your-logger';
import LinkedInService from 'path-to-service';

const prisma = new PrismaClient();

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.error('Environment variable REDIS_URL is not set');
  process.exit(1);
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

connection.on('error', err => {
  logger.error(`Redis connection error: ${err.message}`);
});
connection.on('end', () => {
  logger.warn('Redis connection closed');
});

const queueName = 'postDispatch';
const queueScheduler = new QueueScheduler(queueName, { connection });
const postQueue = new Queue(queueName, { connection });

export async function schedulePost(postId: string, date: Date): Promise<Job> {
  const delay = date.getTime() - Date.now();
  if (delay < 0) throw new Error('Scheduled date must be in the future');
  return postQueue.add(
    'publish',
    { postId },
    {
      delay,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}

const worker = new Worker(queueName, { connection, concurrency: 5 });

worker.process('publish', async (job: Job) => {
  const { postId } = job.data;
  logger.info(`Processing publish job for post ${postId}`);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    const message = `Post ${postId} not found`;
    logger.error(message);
    throw new Error(message);
  }

  try {
    const account = await prisma.socialAccount.findFirst({
      where: { userId: post.authorId, provider: 'linkedin' }
    });
    if (!account) throw new Error('LinkedIn account not linked');

    let accessToken = account.accessToken;
    if (account.expiresAt && account.expiresAt < new Date()) {
      const refreshed = await LinkedInService.refreshAccessToken(account.refreshToken);
      accessToken = refreshed.accessToken;
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresAt: refreshed.expiresAt
        }
      });
    }

    await LinkedInService.publishPost({
      content: post.content,
      accessToken,
      authorUrn: account.providerAccountId
    });

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'published', publishedAt: new Date() }
    });

    logger.info(`Post ${postId} published successfully`);
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    logger.error(`Failed to publish post ${postId}: ${errorMessage}`);
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'failed', errorMessage }
    });
    throw error;
  }
});

async function shutdown() {
  logger.info('Shutting down postDispatch worker and scheduler');
  try {
    await Promise.all([
      worker.close(),
      queueScheduler.close(),
      postQueue.close(),
      connection.quit()
    ]);
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err: any) {
    logger.error(`Error during shutdown: ${err.message}`);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);