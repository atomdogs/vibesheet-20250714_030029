import pLimit from 'p-limit';
import logger from 'your-logger';
import { getAllUsersWithTokens, fetchPriorityPosts, type UserWithTokens } from 'your-module';
import notificationService from 'your-notification-module';

const POLL_INTERVAL_MS = Number(process.env.LINKEDIN_PRIORITY_POST_POLL_INTERVAL_MS) || 300_000;
const CONCURRENCY_LIMIT = Number(process.env.LINKEDIN_PRIORITY_POST_POLL_CONCURRENCY) || 5;

let isPolling = false;
let intervalHandle: NodeJS.Timeout | null = null;

async function pollPriorityPosts(): Promise<void> {
  logger.info('LinkedInPriorityPostPoller: starting poll');
  const users: UserWithTokens[] = await getAllUsersWithTokens();
  const limit = pLimit(CONCURRENCY_LIMIT);
  const tasks = users.map(user => limit(async () => {
    try {
      const newPosts = await fetchPriorityPosts(user.tokens);
      if (newPosts?.length) {
        await notificationService.notify(user, newPosts);
        logger.info(`LinkedInPriorityPostPoller: notified user ${user.id} of ${newPosts.length} new posts`);
      }
    } catch (err) {
      logger.error(`LinkedInPriorityPostPoller: error processing user ${user.id}`, err);
    }
  }));
  await Promise.all(tasks);
  logger.info('LinkedInPriorityPostPoller: poll complete');
}

function scheduledPoll(): void {
  if (isPolling) {
    logger.warn('LinkedInPriorityPostPoller: poll already in progress, skipping this interval');
    return;
  }
  isPolling = true;
  pollPriorityPosts()
    .catch(err => logger.error('LinkedInPriorityPostPoller: unexpected error', err))
    .finally(() => { isPolling = false; });
}

export function startLinkedInPriorityPostPoller(): NodeJS.Timeout {
  if (intervalHandle) {
    throw new Error('LinkedInPriorityPostPoller: already started');
  }
  scheduledPoll();
  intervalHandle = setInterval(scheduledPoll, POLL_INTERVAL_MS);
  logger.info('LinkedInPriorityPostPoller: started');
  return intervalHandle;
}

export function stopLinkedInPriorityPostPoller(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('LinkedInPriorityPostPoller: stopped');
  }
}