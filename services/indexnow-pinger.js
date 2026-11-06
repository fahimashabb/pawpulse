/**
 * Modern Search Engine Indexing & IndexNow Protocol
 * Submits new articles directly to the global IndexNow API (Bing, Yandex, Seznam, Naver)
 * for immediate indexing within hours.
 */

const https = require('https');
const config = require('../config.json');

const INDEXNOW_KEY = '7a9c8f1e4b2d6a3c9e8f0b1a2c3d4e5f';

/**
 * Submits URL list to IndexNow API
 */
async function submitToIndexNow(urlList = []) {
  if (!urlList || !urlList.length) return null;

  const payload = JSON.stringify({
    host: 'fahimashabb.github.io',
    key: INDEXNOW_KEY,
    keyLocation: `${config.site.url}/${INDEXNOW_KEY}.txt`,
    urlList: urlList.slice(0, 100)
  });

  return new Promise((resolve) => {
    try {
      const req = https.request('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
          'Connection': 'close'
        },
        timeout: 8000
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          console.log(`[IndexNow] Submission response: HTTP ${res.statusCode} for ${urlList.length} URLs.`);
          resolve({ status: res.statusCode, body });
        });
      });

      req.on('error', (err) => {
        // Non-fatal network notice
        resolve({ status: 'notice', message: err.message });
      });

      req.write(payload);
      req.end();
    } catch (err) {
      resolve({ status: 'notice', message: err.message });
    }
  });
}

module.exports = {
  INDEXNOW_KEY,
  submitToIndexNow
};
