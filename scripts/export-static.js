/**
 * Static Site Exporter for GitHub Pages
 * Renders all 260+ articles, categories, sitemap, and assets into static HTML in /dist
 */

const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const config = require('../config.json');
const db = require('../database/db');
const seoHelper = require('../services/seo-helper');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const VIEWS_DIR = path.join(__dirname, '..', 'views');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDirSync(src, dest) {
  ensureDirSync(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function renderTemplate(viewName, data) {
  const filePath = path.join(VIEWS_DIR, `${viewName}.ejs`);
  const fullData = {
    ...data,
    config,
    categories: config.categories,
    formatDate,
    currentPath: data.currentPath || '/'
  };
  return await ejs.renderFile(filePath, fullData, { views: [VIEWS_DIR] });
}

async function exportStaticSite() {
  console.log('--- Starting PawPulse Static Site Export for GitHub Pages ---');
  const startTime = Date.now();

  // Clean / prepare dist folder
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  ensureDirSync(DIST_DIR);

  // 1. Copy Public Assets (CSS, JS, ads.txt, robots.txt, etc.)
  if (fs.existsSync(PUBLIC_DIR)) {
    copyDirSync(PUBLIC_DIR, DIST_DIR);
    console.log('✓ Copied static assets (CSS, JS, ads.txt) to /dist');
  }

  // Ensure ads.txt exists in dist root
  const pubId = (config.monetization.adsenseClientId || 'pub-0000000000000000').replace('ca-', '');
  fs.writeFileSync(path.join(DIST_DIR, 'ads.txt'), `# PawPulse Authorized Digital Sellers (ads.txt)\ngoogle.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
  
  // Ensure .nojekyll exists so GitHub Pages serves all assets and folders properly
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');

  let fileCount = 0;

  // 2. Render Homepage (index.html)
  const featured = db.getFeaturedArticles(5);
  const heroMain = featured[0] || null;
  const heroSub = featured.slice(1, 5);
  const recentArticles = db.getAllArticles(12, 0);
  const popularArticles = db.getPopularArticles(6);
  const totalArticles = db.getArticleCount();

  const homeHtml = await renderTemplate('index', {
    title: `${config.site.name} — ${config.site.tagline}`,
    metaDescription: config.site.description,
    heroMain,
    heroSub,
    recentArticles,
    popularArticles,
    totalArticles,
    pageType: 'website',
    currentPath: '/'
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml);
  fileCount++;

  // 3. Render Most Popular Page (/popular/index.html)
  const popArticlesAll = db.getPopularArticles(24);
  const popHtml = await renderTemplate('popular', {
    title: `Most Popular Pet Guides & Behavioral Insights — ${config.site.name}`,
    metaDescription: 'Discover our top-ranked, most read, and shared veterinary pet care guides.',
    popularArticles: popArticlesAll,
    pageType: 'collection',
    currentPath: '/popular'
  });
  ensureDirSync(path.join(DIST_DIR, 'popular'));
  fs.writeFileSync(path.join(DIST_DIR, 'popular', 'index.html'), popHtml);
  fileCount++;

  // 4. Render About & Editorial Page (/about/index.html)
  const aboutHtml = await renderTemplate('about', {
    title: `Editorial Guidelines & Veterinary Review Board — ${config.site.name}`,
    metaDescription: 'Meet our veterinary editorial team, board-certified contributors, and read our clinical accuracy and affiliate disclosure guidelines.',
    popularArticles,
    pageType: 'website',
    currentPath: '/about'
  });
  ensureDirSync(path.join(DIST_DIR, 'about'));
  fs.writeFileSync(path.join(DIST_DIR, 'about', 'index.html'), aboutHtml);
  fileCount++;

  // 5. Render Search Page (/search/index.html)
  const searchHtml = await renderTemplate('search', {
    title: `Search Pet Guides — ${config.site.name}`,
    metaDescription: `Search hundreds of veterinary-backed guides on dogs, cats, reptiles, birds, snakes, and small pets.`,
    query: '',
    results: [],
    popularArticles,
    pageType: 'website',
    currentPath: '/search'
  });
  ensureDirSync(path.join(DIST_DIR, 'search'));
  fs.writeFileSync(path.join(DIST_DIR, 'search', 'index.html'), searchHtml);
  fileCount++;

  // 6. Render 404 Page (404.html for GitHub Pages error handling)
  const notFoundHtml = await renderTemplate('404', {
    title: 'Page Not Found — PawPulse',
    metaDescription: 'The requested pet care guide could not be located.',
    currentPath: '/404'
  });
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), notFoundHtml);
  fileCount++;

  // 7. Render All Category Archives (/category/<slug>/index.html)
  for (const cat of config.categories) {
    const articles = db.getArticlesByCategory(cat.slug, 50, 0);
    const totalCount = db.getCategoryArticleCount(cat.slug);
    const catHtml = await renderTemplate('category', {
      title: `${cat.name} Care & Behavioral Guides — ${config.site.name}`,
      metaDescription: cat.description,
      category: cat,
      articles,
      currentPage: 1,
      totalPages: 1,
      totalCount,
      popularArticles,
      pageType: 'collection',
      currentPath: `/category/${cat.slug}`
    });
    ensureDirSync(path.join(DIST_DIR, 'category', cat.slug));
    fs.writeFileSync(path.join(DIST_DIR, 'category', cat.slug, 'index.html'), catHtml);
    fileCount++;
  }
  console.log(`✓ Rendered all ${config.categories.length} category hubs`);

  // 8. Render All 260+ Blog Articles (/blog/<slug>/index.html)
  const allArticles = db.getAllArticles(2000, 0);
  for (const art of allArticles) {
    const cat = config.categories.find(c => c.slug === art.category_slug) || {
      name: art.category_slug,
      slug: art.category_slug,
      icon: '🐾'
    };

    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: cat.name, url: `/category/${cat.slug}` },
      { name: art.title, url: `/blog/${art.slug}` }
    ];

    const articleSchema = seoHelper.generateArticleSchema(art, config);
    const howToSchema = seoHelper.generateHowToSchema(art, config);
    const faqSchema = seoHelper.generateFAQSchema(art.faqs_json);
    const breadcrumbSchema = seoHelper.generateBreadcrumbSchema(breadcrumbs, config);
    const relatedArticles = db.getRelatedArticles(art.category_slug, art.slug, 3);

    const artHtml = await renderTemplate('article', {
      title: `${art.title} — ${config.site.name}`,
      metaDescription: art.meta_description,
      article: art,
      category: cat,
      breadcrumbs,
      articleSchema,
      howToSchema,
      faqSchema,
      breadcrumbSchema,
      relatedArticles,
      popularArticles,
      pageType: 'article',
      currentPath: `/blog/${art.slug}`
    });

    ensureDirSync(path.join(DIST_DIR, 'blog', art.slug));
    fs.writeFileSync(path.join(DIST_DIR, 'blog', art.slug, 'index.html'), artHtml);
    fileCount++;
  }
  console.log(`✓ Rendered ${allArticles.length} individual article pages with schemas & ad slots`);

  // 9. Generate Sitemap.xml in /dist
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemapXml += `  <url><loc>${config.site.url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/popular</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
  for (const cat of config.categories) {
    sitemapXml += `  <url><loc>${config.site.url}/category/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  }
  for (const art of allArticles) {
    sitemapXml += `  <url><loc>${config.site.url}/blog/${art.slug}</loc><lastmod>${(art.updated_at || art.published_at).split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>${art.is_popular ? '0.9' : '0.8'}</priority></url>\n`;
  }
  sitemapXml += `</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

  // 10. Generate Robots.txt in /dist
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${config.site.url}/sitemap.xml\n`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);

  // 11. Generate RSS.xml in /dist
  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n`;
  rssXml += `  <title>${config.site.name}</title>\n  <link>${config.site.url}</link>\n  <description>${config.site.description}</description>\n  <language>en-us</language>\n`;
  for (const art of allArticles.slice(0, 50)) {
    rssXml += `  <item>\n    <title><![CDATA[${art.title}]]></title>\n    <link>${config.site.url}/blog/${art.slug}</link>\n    <guid>${config.site.url}/blog/${art.slug}</guid>\n    <pubDate>${new Date(art.published_at).toUTCString()}</pubDate>\n    <description><![CDATA[${art.excerpt}]]></description>\n  </item>\n`;
  }
  rssXml += `</channel>\n</rss>`;
  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rssXml);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`================================================================`);
  console.log(` Static Export Successful! Total ${fileCount} pages generated.`);
  console.log(` Output Folder: ${DIST_DIR}`);
  console.log(` Duration: ${duration}s`);
  console.log(` Ready for GitHub Pages Deployment!`);
  console.log(`================================================================`);
}

if (require.main === module) {
  exportStaticSite().catch(err => {
    console.error('Fatal error during static export:', err);
    process.exit(1);
  });
}

module.exports = { exportStaticSite };
