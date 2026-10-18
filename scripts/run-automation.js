#!/usr/bin/env node
/**
 * PawPulse Background Automation Daemon
 * Automatically publishes articles at regular intervals throughout the day.
 */

const { startScheduler, getSchedulerStatus } = require('../services/scheduler');

console.log('=====================================================');
console.log(' PawPulse Continuous Background Automation Daemon');
console.log('=====================================================');

startScheduler();

// Keep process active and log heartbeat every 10 minutes
setInterval(() => {
  const status = getSchedulerStatus();
  console.log(`[Daemon Heartbeat ${new Date().toLocaleTimeString()}] Status: Active | Published Today: ${status.publishedToday} | DB Total: ${status.totalArticlesInDb}`);
}, 10 * 60 * 1000);

process.on('SIGINT', () => {
  console.log('\nStopping PawPulse daemon gracefully...');
  process.exit(0);
});
