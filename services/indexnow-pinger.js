/**
 * Instant Search Engine Indexing & IndexNow Protocol
 * Pings Google, Bing, and IndexNow API immediately when new articles are published
 * to accelerate indexing from weeks down to hours.
 */

const https = require('https');
const http = require('http');
const config = require('../config.json');

const INDEXNOW_KEY = '7a9c8f1e4b2d6a3c9e8f0b1a2c3d4e5f';

function pingUrl(targetUrl) {
  return new Promise((resolve) => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, { timeout: 8000 }, (res) => {
        resolve({ url: targetUrl, status: res.statusCode });
      });
      req.on('error', (err) => {
        resolve({ url: targetUrl, status: 'error', error: err.message });
      });
      req.end();
    } catch (err) {
      resolve({ url: targetUrl, status: 'error', error: err.message });
    }
  });
}

/**
 * Pings search engines about the updated sitemap.xml
 */
async function pingSitemaps() {
  const sitemapUrl = encodeURIComponent(`${config.site.url}/sitemap.xml`);
  const googlePing = `https://www.google.com/ping?sitemap=${sitemapUrl}`;
  const bingPing = `https://www.bing.com/ping?sitemap=${sitemapUrl}`;

  console.log('[IndexNow] Pinging Google & Bing sitemaps...');
  const results = await Promise.all([pingUrl(googlePing), pingUrl(bingPing)]);
  return results;
}

/**
 * Submits URL list to IndexNow API (Bing, Yandex, Seznam, Naver)
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
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        console.log(`[IndexNow] Submission response: HTTP ${res.statusCode} for ${urlList.length} URLs.`);
        resolve({ status: res.statusCode });
      });

      req.on('error', (err) => {
        console.warn('[IndexNow] Submission non-fatal error:', err.message);
        resolve({ status: 'error', message: err.message });
      });

      req.write(payload);
      req.end();
    } catch (err) {
      resolve({ status: 'error', message: err.message });
    }
  });
}

module.exports = {
  INDEXNOW_KEY,
  pingSitemaps,
  submitToIndexNow
};
