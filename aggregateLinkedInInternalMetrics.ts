import { PrismaClient } from '@prisma/client';
import LinkedInApi from 'your-linkedin-api-client';
import { subHours, startOfDay, addDays } from 'date-fns';
import pMap from 'p-map';

const prisma = new PrismaClient();
const linkedInApi = new LinkedInApi();
const CONCURRENCY = 5;

async function aggregateLinkedInInternalMetrics(): Promise<void> {
  const since = subHours(new Date(), 24);

  const posts = await prisma.post.findMany({
    where: {
      linkedInId: { not: null },
      createdAt: { gte: since },
    },
    select: {
      id: true,
      linkedInId: true,
    },
  });

  await pMap(
    posts,
    async (post) => {
      try {
        const metrics = await linkedInApi.fetchPostMetrics(post.linkedInId!);
        if (!metrics) {
          console.warn(`No metrics returned for post ${post.id}`);
          return;
        }
        const now = new Date();
        const dayStart = startOfDay(now);
        const nextDayStart = addDays(dayStart, 1);
        const existing = await prisma.analytics.findFirst({
          where: {
            postId: post.id,
            fetchedAt: { gte: dayStart, lt: nextDayStart },
          },
        });
        if (existing) {
          console.log(`Metrics for post ${post.id} already recorded for today`);
          return;
        }
        await prisma.analytics.create({
          data: {
            postId: post.id,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            engagementRate: metrics.engagementRate,
            fetchedAt: now,
          },
        });
        console.log(`Inserted metrics for post ${post.id}`);
      } catch (error) {
        console.error(`Error fetching/inserting metrics for post ${post.id}`, error);
      }
    },
    { concurrency: CONCURRENCY }
  );
}

if (require.main === module) {
  ;(async () => {
    try {
      await aggregateLinkedInInternalMetrics();
    } catch (err) {
      console.error('Failed to aggregate LinkedIn metrics', err);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}

export default aggregateLinkedInInternalMetrics;