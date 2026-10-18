/**
 * Automated Publishing Scheduler
 * Schedules 50 posts per day (approx 1 post every 28.8 minutes)
 * Can be triggered on demand or run as background interval.
 */

const { generateAndPublishSingleArticle, publishBatch } = require('./article-generator');
const { getArticleCount } = require('../database/db');
const config = require('../config.json');

let intervalId = null;
let isRunning = false;
let publishedToday = 0;
let lastPublishedTime = null;

function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  console.log('[Scheduler] Daily 50-post automated publishing engine started.');

  // Interval in milliseconds (config.automation.intervalMinutes, default 28 minutes)
  const intervalMs = (config.automation.intervalMinutes || 28) * 60 * 1000;

  intervalId = setInterval(async () => {
    try {
      console.log('[Scheduler] Firing scheduled post publication...');
      const article = await generateAndPublishSingleArticle();
      publishedToday++;
      lastPublishedTime = new Date().toISOString();
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
    intervalMinutes: config.automation.intervalMinutes || 28,
    targetPostsPerDay: config.automation.postsPerDay || 50,
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
