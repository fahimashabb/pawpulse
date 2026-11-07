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
    baseUrl: process.env.BASE_URL !== undefined ? process.env.BASE_URL : (config.site.baseUrl || ''),
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

  // 2. Render Homepage (index.html) - Zero duplicate articles across blocks
  const allPopularForPages = db.getPopularArticles(50);
  const allLatestForPages = db.getAllArticles(100, 0);

  const homeUsedSlugs = new Set();
  const heroMain = allPopularForPages[0] || allLatestForPages[0] || null;
  if (heroMain) homeUsedSlugs.add(heroMain.slug);

  const heroSub = [];
  for (const a of allPopularForPages.slice(1)) {
    if (!homeUsedSlugs.has(a.slug)) {
      heroSub.push(a);
      homeUsedSlugs.add(a.slug);
      if (heroSub.length >= 4) break;
    }
  }

  const recentArticles = [];
  for (const a of allLatestForPages) {
    if (!homeUsedSlugs.has(a.slug)) {
      recentArticles.push(a);
      homeUsedSlugs.add(a.slug);
      if (recentArticles.length >= 12) break;
    }
  }

  const popularArticles = [];
  for (const a of allPopularForPages) {
    if (!homeUsedSlugs.has(a.slug)) {
      popularArticles.push(a);
      homeUsedSlugs.add(a.slug);
      if (popularArticles.length >= 6) break;
    }
  }
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

  // 4b. Render Privacy Policy Page (/privacy/index.html) - Crucial for AdSense
  const privacyHtml = await renderTemplate('privacy', {
    title: `Privacy Policy & Cookie Disclosures — ${config.site.name}`,
    metaDescription: `Read ${config.site.name}'s comprehensive privacy policy, Google AdSense DART cookie disclosures, and GDPR/CCPA data rights.`,
    pageType: 'website',
    currentPath: '/privacy'
  });
  ensureDirSync(path.join(DIST_DIR, 'privacy'));
  fs.writeFileSync(path.join(DIST_DIR, 'privacy', 'index.html'), privacyHtml);
  fileCount++;

  // 4c. Render Terms of Service Page (/terms/index.html)
  const termsHtml = await renderTemplate('terms', {
    title: `Terms of Service & Clinical Disclaimer — ${config.site.name}`,
    metaDescription: `${config.site.name} Terms of Service, veterinary medical disclaimers, affiliate disclosures, and intellectual property terms.`,
    pageType: 'website',
    currentPath: '/terms'
  });
  ensureDirSync(path.join(DIST_DIR, 'terms'));
  fs.writeFileSync(path.join(DIST_DIR, 'terms', 'index.html'), termsHtml);
  fileCount++;

  // 4d. Render Contact Page (/contact/index.html)
  const contactHtml = await renderTemplate('contact', {
    title: `Contact Editorial & Press Desk — ${config.site.name}`,
    metaDescription: `Contact ${config.site.name} editorial staff, veterinarians, press relations, and advertising partnership representatives.`,
    pageType: 'website',
    currentPath: '/contact'
  });
  ensureDirSync(path.join(DIST_DIR, 'contact'));
  fs.writeFileSync(path.join(DIST_DIR, 'contact', 'index.html'), contactHtml);
  fileCount++;

  // 4e. Render Affiliates & Partner Directory Page (/affiliates/index.html) - Mandatory for FTC & Affiliate networks
  const affiliatesHtml = await renderTemplate('affiliates', {
    title: `Affiliate Disclosures & Commercial Partner Directory — ${config.site.name}`,
    metaDescription: 'Explore PawPulse registered affiliate partnerships with Amazon, Chewy, Lemonade, Embark, Petco, and veterinary telehealth services.',
    pageType: 'website',
    currentPath: '/affiliates'
  });
  ensureDirSync(path.join(DIST_DIR, 'affiliates'));
  fs.writeFileSync(path.join(DIST_DIR, 'affiliates', 'index.html'), affiliatesHtml);
  fileCount++;

  // 4f. Render Clinical Reviews & Buying Guides Hub (/reviews/index.html) - Top Commercial Affiliate Hub
  const reviewsHtml = await renderTemplate('reviews', {
    title: `Best Veterinary Pet Gear & Equipment Buying Guides (2026) — ${config.site.name}`,
    metaDescription: 'Comprehensive clinical reviews, comparison matrices, and veterinary testing for pet health insurance, orthopedic beds, cat fountains, and reptile lighting.',
    pageType: 'website',
    currentPath: '/reviews'
  });
  ensureDirSync(path.join(DIST_DIR, 'reviews'));
  fs.writeFileSync(path.join(DIST_DIR, 'reviews', 'index.html'), reviewsHtml);
  fileCount++;

  // 4g. Render Tools Hub (/tools/index.html)
  const toolsHtml = await renderTemplate('tools', {
    title: `Interactive Pet Health & Care Calculators — ${config.site.name}`,
    metaDescription: 'Free veterinary calculators: Pet insurance rate estimator, WSAVA daily calorie formula, and reptile UVB Ferguson zone calculator.',
    pageType: 'website',
    currentPath: '/tools'
  });
  ensureDirSync(path.join(DIST_DIR, 'tools'));
  fs.writeFileSync(path.join(DIST_DIR, 'tools', 'index.html'), toolsHtml);
  fileCount++;

  // 4h. Render Pet Insurance Calculator (/tools/pet-insurance-calculator/index.html)
  const toolInsuranceHtml = await renderTemplate('tool-insurance', {
    title: `Pet Health Insurance Cost & Rate Estimator (2026) — ${config.site.name}`,
    metaDescription: 'Calculate estimated monthly pet insurance premiums with 90% veterinary reimbursement for dogs and cats.',
    pageType: 'website',
    currentPath: '/tools/pet-insurance-calculator'
  });
  ensureDirSync(path.join(DIST_DIR, 'tools', 'pet-insurance-calculator'));
  fs.writeFileSync(path.join(DIST_DIR, 'tools', 'pet-insurance-calculator', 'index.html'), toolInsuranceHtml);
  fileCount++;

  // 4i. Render Pet Calorie Calculator (/tools/pet-calorie-calculator/index.html)
  const toolCaloriesHtml = await renderTemplate('tool-calories', {
    title: `Veterinary Daily Calorie & Feeding Calculator — ${config.site.name}`,
    metaDescription: 'Calculate scientifically calibrated RER and DER daily calorie intake and feeding portion sizes for dogs and cats.',
    pageType: 'website',
    currentPath: '/tools/pet-calorie-calculator'
  });
  ensureDirSync(path.join(DIST_DIR, 'tools', 'pet-calorie-calculator'));
  fs.writeFileSync(path.join(DIST_DIR, 'tools', 'pet-calorie-calculator', 'index.html'), toolCaloriesHtml);
  fileCount++;

  // 4j. Render Reptile UVB Calculator (/tools/reptile-uvb-calculator/index.html)
  const toolUvbHtml = await renderTemplate('tool-uvb', {
    title: `Reptile UVB Ferguson Zone & Lamp Distance Calculator — ${config.site.name}`,
    metaDescription: 'Determine exact UV Index (UVI), Ferguson Zones, and T5 HO linear tube mounting distances for bearded dragons, geckos, and chameleons.',
    pageType: 'website',
    currentPath: '/tools/reptile-uvb-calculator'
  });
  ensureDirSync(path.join(DIST_DIR, 'tools', 'reptile-uvb-calculator'));
  fs.writeFileSync(path.join(DIST_DIR, 'tools', 'reptile-uvb-calculator', 'index.html'), toolUvbHtml);
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
    const articles = db.getArticlesByCategory(cat.slug, 1000, 0);
    const totalCount = db.getCategoryArticleCount(cat.slug);
    const catPageSlugs = new Set(articles.map(a => a.slug));
    const catPopular = allPopularForPages.filter(a => !catPageSlugs.has(a.slug)).slice(0, 6);

    const catHtml = await renderTemplate('category', {
      title: `${cat.name} Care & Behavioral Guides — ${config.site.name}`,
      metaDescription: cat.description,
      category: cat,
      articles,
      currentPage: 1,
      totalPages: 1,
      totalCount,
      popularArticles: catPopular.length >= 4 ? catPopular : popularArticles,
      pageType: 'collection',
      currentPath: `/category/${cat.slug}`
    });
    ensureDirSync(path.join(DIST_DIR, 'category', cat.slug));
    fs.writeFileSync(path.join(DIST_DIR, 'category', cat.slug, 'index.html'), catHtml);
    fileCount++;
  }
  console.log(`✓ Rendered all ${config.categories.length} category hubs`);

  // 8. Render All Blog Articles (/blog/<slug>/index.html)
  const allArticles = db.getAllArticles(100000, 0);
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
    const productSchema = seoHelper.generateProductReviewSchema([
      { name: `${art.pet_type} Clinical Care & Wellness Kit`, description: art.meta_description, image: art.featured_image }
    ], config, `${config.site.url}/blog/${art.slug}`);
    const relatedArticles = db.getRelatedArticles(art.category_slug, art.slug, 3);
    const usedSlugsOnArt = new Set([art.slug, ...relatedArticles.map(r => r.slug)]);
    const artPopular = allPopularForPages.filter(p => !usedSlugsOnArt.has(p.slug)).slice(0, 6);

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
      productSchema,
      relatedArticles,
      popularArticles: artPopular.length >= 4 ? artPopular : popularArticles,
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
  sitemapXml += `  <url><loc>${config.site.url}/reviews</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/tools</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/tools/pet-insurance-calculator</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/tools/pet-calorie-calculator</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/tools/reptile-uvb-calculator</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/popular</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/affiliates</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/privacy</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
  sitemapXml += `  <url><loc>${config.site.url}/terms</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
  for (const cat of config.categories) {
    sitemapXml += `  <url><loc>${config.site.url}/category/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
  }
  for (const art of allArticles) {
    sitemapXml += `  <url><loc>${config.site.url}/blog/${art.slug}</loc><lastmod>${(art.updated_at || art.published_at).split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>${art.is_popular ? '0.9' : '0.8'}</priority></url>\n`;
  }
  sitemapXml += `</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

  // 10. Generate Robots.txt in /dist (Explicitly allowing Googlebot & AdSense Mediapartners-Google)
  const robotsTxt = `User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nSitemap: ${config.site.url}/sitemap.xml\n`;
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);

  // 11. Generate RSS.xml in /dist
  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n`;
  rssXml += `  <title>${config.site.name}</title>\n  <link>${config.site.url}</link>\n  <description>${config.site.description}</description>\n  <language>en-us</language>\n`;
  for (const art of allArticles.slice(0, 50)) {
    rssXml += `  <item>\n    <title><![CDATA[${art.title}]]></title>\n    <link>${config.site.url}/blog/${art.slug}</link>\n    <guid>${config.site.url}/blog/${art.slug}</guid>\n    <pubDate>${new Date(art.published_at).toUTCString()}</pubDate>\n    <description><![CDATA[${art.excerpt}]]></description>\n  </item>\n`;
  }
  rssXml += `</channel>\n</rss>`;
  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), rssXml);

  // 12. Static JSON APIs & Search Index (Addon Suite for GitHub Pages)
  ensureDirSync(path.join(DIST_DIR, 'api'));

  // 12a. Search Index for instant client-side autocomplete
  const searchIndex = db.getSearchIndex();
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'search-index.json'), JSON.stringify(searchIndex));

  // 12b. JSON Feed v1.1 Specification (feed.json)
  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: config.site.name,
    home_page_url: config.site.url,
    feed_url: `${config.site.url}/feed.json`,
    description: config.site.description,
    authors: [{ name: config.site.authorDefault, url: `${config.site.url}/about` }],
    items: allArticles.slice(0, 50).map(art => ({
      id: `${config.site.url}/blog/${art.slug}`,
      url: `${config.site.url}/blog/${art.slug}`,
      title: art.title,
      summary: art.excerpt,
      image: art.featured_image,
      date_published: new Date(art.published_at).toISOString(),
      author: { name: art.author_name }
    }))
  };
  fs.writeFileSync(path.join(DIST_DIR, 'feed.json'), JSON.stringify(jsonFeed, null, 2));
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'feed.json'), JSON.stringify(jsonFeed, null, 2));

  // 12c. Platform Stats API
  const categoryCounts = config.categories.map(c => ({
    name: c.name,
    slug: c.slug,
    count: db.getCategoryArticleCount(c.slug)
  }));
  const stats = {
    platform: config.site.name,
    totalArticles: allArticles.length,
    categories: categoryCounts,
    exportedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'stats.json'), JSON.stringify(stats, null, 2));

  // 12d. Articles Feed API
  fs.writeFileSync(path.join(DIST_DIR, 'api', 'articles.json'), JSON.stringify({
    count: Math.min(allArticles.length, 100),
    total: allArticles.length,
    articles: allArticles.slice(0, 100).map(a => ({
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description,
      category_slug: a.category_slug,
      pet_type: a.pet_type,
      featured_image: a.featured_image,
      author_name: a.author_name,
      reading_time_minutes: a.reading_time_minutes,
      published_at: a.published_at
    }))
  }, null, 2));
  console.log('✓ Exported static JSON APIs (search-index.json, feed.json, stats.json, articles.json)');

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
