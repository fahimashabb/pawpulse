#!/usr/bin/env node
/**
 * Daily Batch Publishing CLI Script
 * Usage: node scripts/publish-daily.js [--count=50]
 */

const { publishBatch } = require('../services/article-generator');
const { getArticleCount } = require('../database/db');

// Parse --count argument, default to 50
let count = 50;
process.argv.forEach(arg => {
  if (arg.startsWith('--count=')) {
    const val = parseInt(arg.split('=')[1], 10);
    if (!isNaN(val) && val > 0) count = val;
  }
});

console.log(`====================================================`);
console.log(` PawPulse Automated Content Pipeline (Target: ${count}) `);
console.log(`====================================================`);
console.log(`Current Article Database Count: ${getArticleCount()}`);
console.log(`Starting automated generation & publication...`);

const startTime = Date.now();

publishBatch(count)
  .then(articles => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n====================================================`);
    console.log(` Batch Complete: ${articles.length} new articles published!`);
    console.log(` Total Time Elapsed: ${duration}s`);
    console.log(` New Total Article Count: ${getArticleCount()}`);
    console.log(`====================================================\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`Fatal error during daily batch publishing:`, err);
    process.exit(1);
  });
