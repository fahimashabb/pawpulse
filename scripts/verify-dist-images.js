const fs = require('node:fs');
const path = require('node:path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

function checkIndexHtml() {
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const matches = [...indexHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  
  // Filter out author avatars (which have w=150)
  const articlePhotos = matches.filter(u => !u.includes('w=150'));
  
  const counts = {};
  for (const u of articlePhotos) {
    counts[u] = (counts[u] || 0) + 1;
  }

  const dupes = Object.entries(counts).filter(e => e[1] > 1);
  console.log('Homepage Total Article Featured Photos:', articlePhotos.length);
  console.log('Homepage Unique Featured Photos:', Object.keys(counts).length);
  console.log('Homepage Duplicate Article Photos:', dupes.length);
  if (dupes.length > 0) {
    console.log('Dupe samples:', dupes);
  } else {
    console.log('✓ Homepage has 100% UNMATCHED photos in every single card and block!');
  }
}

function checkCategories() {
  const catDir = path.join(DIST_DIR, 'category');
  if (!fs.existsSync(catDir)) return;
  const entries = fs.readdirSync(catDir, { withFileTypes: true });
  for (const entry of entries) {
    let filePath = '';
    if (entry.isDirectory()) {
      filePath = path.join(catDir, entry.name, 'index.html');
    } else if (entry.name.endsWith('.html')) {
      filePath = path.join(catDir, entry.name);
    }
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
    const articlePhotos = matches.filter(u => !u.includes('w=150'));
    const counts = {};
    articlePhotos.forEach(u => counts[u] = (counts[u] || 0) + 1);
    const dupes = Object.entries(counts).filter(e => e[1] > 1);
    if (dupes.length > 0) {
      console.warn(`Category ${entry.name} has duplicates:`, dupes);
    } else {
      console.log(`✓ Category ${entry.name}: All ${articlePhotos.length} article photos are 100% unique!`);
    }
  }
}

function checkArticlePages() {
  const blogDir = path.join(DIST_DIR, 'blog');
  if (!fs.existsSync(blogDir)) return;
  const entries = fs.readdirSync(blogDir).slice(0, 30); // sample 30 articles
  let allPass = true;
  for (const slug of entries) {
    const p = path.join(blogDir, slug, 'index.html');
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
    const photos = matches.filter(u => !u.includes('w=150'));
    const counts = {};
    photos.forEach(u => counts[u] = (counts[u] || 0) + 1);
    const dupes = Object.entries(counts).filter(e => e[1] > 1);
    if (dupes.length > 0) {
      console.warn(`Article ${slug} has duplicate photos on page:`, dupes);
      allPass = false;
    }
  }
  if (allPass) {
    console.log(`✓ Sampled 30 Article Pages: Every single article page has 100% unique photos across header, figure, related cards, and sidebar!`);
  }
}

console.log('--- AUDITING DIST HTML PAGES ---');
checkIndexHtml();
checkCategories();
checkArticlePages();
