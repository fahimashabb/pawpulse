/**
 * Automated Publishing Scheduler
 * Schedules 50 posts per day (approx 1 post every 28.8 minutes)
 * Can be triggered on demand or run as background interval.
 */

const { generateAndPublishSingleArticle, publishBatch } = require('./article-generator');
const { getArticleCount, checkpoint } = require('../database/db');
const config = require('../config.json');

let intervalId = null;
let isRunning = false;
let publishedToday = 0;
let lastPublishedTime = null;

function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  console.log(`[Scheduler] Daily 200-post automated publishing engine started (every ~${config.automation.intervalMinutes || 7} mins).`);

  // Interval in milliseconds (config.automation.intervalMinutes, default 7 minutes for 200/day)
  const intervalMs = (config.automation.intervalMinutes || 7) * 60 * 1000;

  intervalId = setInterval(async () => {
    try {
      console.log('[Scheduler] Firing scheduled post publication...');
      const article = await generateAndPublishSingleArticle();
      publishedToday++;
      lastPublishedTime = new Date().toISOString();
      try {
        checkpoint();
      } catch (cpErr) {
        console.warn('[Scheduler] Checkpoint non-fatal notice:', cpErr.message);
      }
      console.log(`[Scheduler] Live Published: "${article.title}" | Total Today: ${publishedToday}`);
    } catch (err) {
      console.error('[Scheduler] Error during scheduled publishing:', err);
    }
  }, intervalMs);
}

function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  console.log('[Scheduler] Publishing engine stopped.');
}

function getSchedulerStatus() {
  return {
    isRunning,
    intervalMinutes: config.automation.intervalMinutes || 7,
    targetPostsPerDay: config.automation.postsPerDay || 200,
    publishedToday,
    lastPublishedTime,
    totalArticlesInDb: getArticleCount()
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  publishBatchNow: publishBatch
};
