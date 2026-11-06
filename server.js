const express = require('express');
const path = require('node:path');
const config = require('./config.json');
const db = require('./database/db');
const seoHelper = require('./services/seo-helper');
const scheduler = require('./services/scheduler');
const { generateAndPublishSingleArticle, publishBatch } = require('./services/article-generator');

const app = express();
const PORT = process.env.PORT || 4000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global locals for templates
app.use((req, res, next) => {
  res.locals.config = config;
  res.locals.categories = config.categories;
  res.locals.baseUrl = process.env.NODE_ENV === 'production' && !process.env.CUSTOM_DOMAIN ? (config.site.baseUrl || '') : '';
  res.locals.currentPath = req.path;
  res.locals.formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  next();
});

// Start scheduler if configured
if (config.automation.enabled) {
  scheduler.startScheduler();
}

// -------------------------------------------------------------
// ROUTES
// -------------------------------------------------------------

// 1. Homepage
app.get('/', (req, res) => {
  const featured = db.getFeaturedArticles(5);
  const heroMain = featured[0] || null;
  const heroSub = featured.slice(1, 5);
  
  const recentArticles = db.getAllArticles(12, 0);
  const popularArticles = db.getPopularArticles(6);
  const totalArticles = db.getArticleCount();

  res.render('index', {
    title: `${config.site.name} — ${config.site.tagline}`,
    metaDescription: config.site.description,
    heroMain,
    heroSub,
    recentArticles,
    popularArticles,
    totalArticles,
    pageType: 'website'
  });
});

// 2. Single Article Page (High SEO, Schema, HowTo, FAQs, Ads)
app.get('/blog/:slug', (req, res) => {
  const slug = req.params.slug;
  const article = db.getArticleBySlug(slug);

  if (!article) {
    return res.status(404).render('404', {
      title: 'Article Not Found — PawPulse',
      metaDescription: 'The requested pet care guide could not be located.'
    });
  }

  // Increment views
  db.incrementViews(slug);

  const category = config.categories.find(c => c.slug === article.category_slug) || {
    name: article.category_slug,
    slug: article.category_slug,
    icon: '🐾'
  };

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: category.name, url: `/category/${category.slug}` },
    { name: article.title, url: `/blog/${article.slug}` }
  ];

  // Generate Schemas
  const articleSchema = seoHelper.generateArticleSchema(article, config);
  const howToSchema = seoHelper.generateHowToSchema(article, config);
  const faqSchema = seoHelper.generateFAQSchema(article.faqs_json);
  const breadcrumbSchema = seoHelper.generateBreadcrumbSchema(breadcrumbs, config);
  const productSchema = seoHelper.generateProductReviewSchema([
    { name: `${article.pet_type} Clinical Care & Wellness Kit`, description: article.meta_description, image: article.featured_image }
  ], config, `${config.site.url}/blog/${article.slug}`);

  const relatedArticles = db.getRelatedArticles(article.category_slug, article.slug, 3);
  const popularArticles = db.getPopularArticles(5);

  res.render('article', {
    title: `${article.title} — ${config.site.name}`,
    metaDescription: article.meta_description,
    article,
    category,
    breadcrumbs,
    articleSchema,
    howToSchema,
    faqSchema,
    breadcrumbSchema,
    productSchema,
    relatedArticles,
    popularArticles,
    pageType: 'article'
  });
});

// 3. Category Archive Page
app.get('/category/:slug', (req, res) => {
  const categorySlug = req.params.slug;
  const category = config.categories.find(c => c.slug === categorySlug);

  if (!category) {
    return res.status(404).render('404', {
      title: 'Category Not Found — PawPulse',
      metaDescription: 'The requested pet care category could not be found.'
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const articles = db.getArticlesByCategory(categorySlug, limit, offset);
  const totalCount = db.getCategoryArticleCount(categorySlug);
  const totalPages = Math.ceil(totalCount / limit);
  const popularArticles = db.getPopularArticles(6);

  res.render('category', {
    title: `${category.name} Care & Behavioral Guides — ${config.site.name}`,
    metaDescription: category.description,
    category,
    articles,
    currentPage: page,
    totalPages,
    totalCount,
    popularArticles,
    pageType: 'collection'
  });
});

// 4. Popular & Trending Page
app.get('/popular', (req, res) => {
  const popularArticles = db.getPopularArticles(24);
  const sidebarPopular = popularArticles.slice(0, 6);

  res.render('popular', {
    title: `Most Popular Pet Guides & Behavioral Insights — ${config.site.name}`,
    metaDescription: 'Discover our top-ranked, most read, and shared veterinary pet care guides.',
    popularArticles,
    sidebarPopular,
    pageType: 'collection'
  });
});

// 5. Search Page
app.get('/search', (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  let results = [];
  
  if (query.length > 0) {
    results = db.searchArticles(query, 30);
  }

  const popularArticles = db.getPopularArticles(6);

  res.render('search', {
    title: query ? `Search results for "${query}" — ${config.site.name}` : `Search Pet Guides — ${config.site.name}`,
    metaDescription: `Search hundreds of veterinary-backed guides on dogs, cats, reptiles, birds, snakes, and small pets.`,
    query,
    results,
    popularArticles,
    pageType: 'website'
  });
});

// 6. About & Editorial Standards (Crucial for AdSense / E-E-A-T approval)
app.get('/about', (req, res) => {
  const popularArticles = db.getPopularArticles(5);
  res.render('about', {
    title: `Editorial Guidelines & Veterinary Review Board — ${config.site.name}`,
    metaDescription: 'Meet our veterinary editorial team, board-certified contributors, and read our clinical accuracy and affiliate disclosure guidelines.',
    popularArticles,
    pageType: 'website'
  });
});

// 6b. Privacy Policy (Mandatory for AdSense / CCPA / GDPR approval)
app.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: `Privacy Policy & Cookie Disclosures — ${config.site.name}`,
    metaDescription: `Read ${config.site.name}'s comprehensive privacy policy, Google AdSense DART cookie disclosures, and GDPR/CCPA data rights.`,
    pageType: 'website'
  });
});

// 6c. Terms of Service & Medical Disclaimer
app.get('/terms', (req, res) => {
  res.render('terms', {
    title: `Terms of Service & Clinical Disclaimer — ${config.site.name}`,
    metaDescription: `${config.site.name} Terms of Service, veterinary medical disclaimers, affiliate disclosures, and intellectual property terms.`,
    pageType: 'website'
  });
});

// 6d. Contact Page
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: `Contact Editorial & Press Desk — ${config.site.name}`,
    metaDescription: `Contact ${config.site.name} editorial staff, veterinarians, press relations, and advertising partnership representatives.`,
    pageType: 'website'
  });
});

// 6e. Affiliate Disclosures & Commercial Partner Hub (Mandatory for FTC / Google / Affiliate networks)
app.get('/affiliates', (req, res) => {
  res.render('affiliates', {
    title: `Affiliate Disclosures & Commercial Partner Directory — ${config.site.name}`,
    metaDescription: 'Explore PawPulse registered affiliate partnerships with Amazon, Chewy, Lemonade, Embark, Petco, and veterinary telehealth services.',
    pageType: 'website'
  });
});

// 6f. Clinical Reviews & Equipment Buying Guides Hub (High-Intent Affiliate Money-Maker)
app.get('/reviews', (req, res) => {
  res.render('reviews', {
    title: `Best Veterinary Pet Gear & Equipment Buying Guides (2026) — ${config.site.name}`,
    metaDescription: 'Comprehensive clinical reviews, comparison matrices, and veterinary testing for pet health insurance, orthopedic beds, cat fountains, and reptile lighting.',
    pageType: 'website'
  });
});

// 6g. Interactive Pet Health & Diet Tools Hub
app.get('/tools', (req, res) => {
  res.render('tools', {
    title: `Interactive Pet Health & Care Calculators — ${config.site.name}`,
    metaDescription: 'Free veterinary calculators: Pet insurance rate estimator, WSAVA daily calorie formula, and reptile UVB Ferguson zone calculator.',
    pageType: 'website'
  });
});

// 6h. Tool 1: Pet Insurance Rate & Coverage Calculator
app.get('/tools/pet-insurance-calculator', (req, res) => {
  res.render('tool-insurance', {
    title: `Pet Health Insurance Cost & Rate Estimator (2026) — ${config.site.name}`,
    metaDescription: 'Calculate estimated monthly pet insurance premiums with 90% veterinary reimbursement for dogs and cats.',
    pageType: 'website'
  });
});

// 6i. Tool 2: Pet Calorie & Daily Portion Calculator
app.get('/tools/pet-calorie-calculator', (req, res) => {
  res.render('tool-calories', {
    title: `Veterinary Daily Calorie & Feeding Calculator — ${config.site.name}`,
    metaDescription: 'Calculate scientifically calibrated RER and DER daily calorie intake and feeding portion sizes for dogs and cats.',
    pageType: 'website'
  });
});

// 6j. Tool 3: Reptile UVB Ferguson Zone Calculator
app.get('/tools/reptile-uvb-calculator', (req, res) => {
  res.render('tool-uvb', {
    title: `Reptile UVB Ferguson Zone & Lamp Distance Calculator — ${config.site.name}`,
    metaDescription: 'Determine exact UV Index (UVI), Ferguson Zones, and T5 HO linear tube mounting distances for bearded dragons, geckos, and chameleons.',
    pageType: 'website'
  });
});

// IndexNow Verification Token
app.get('/7a9c8f1e4b2d6a3c9e8f0b1a2c3d4e5f.txt', (req, res) => {
  res.type('text/plain').send('7a9c8f1e4b2d6a3c9e8f0b1a2c3d4e5f\n');
});

// Newsletter Lead Capture API
app.post('/api/v1/subscribe', (req, res) => {
  const { email, pet_type, petType } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email address required.' });
  }
  const result = db.addSubscriber(email, pet_type || petType || 'all');
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.redirect('/?subscribed=1');
  }
  res.json({ success: true, message: 'Subscribed successfully! Check inbox for Veterinary Emergency Cheatsheet.' });
});

// 7. Dynamic Sitemap.xml (Auto-generated for search engines)
app.get('/sitemap.xml', (req, res) => {
  const articles = db.getAllArticles(2000, 0);
  const baseUrl = config.site.url;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static core pages
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/reviews</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/tools</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/tools/pet-insurance-calculator</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/tools/pet-calorie-calculator</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/tools/reptile-uvb-calculator</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/popular</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/affiliates</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/privacy</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/terms</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/contact</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

  // Categories
  config.categories.forEach(cat => {
    xml += `  <url>\n    <loc>${baseUrl}/category/${cat.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  });

  // Articles
  articles.forEach(art => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/blog/${art.slug}</loc>\n`;
    xml += `    <lastmod>${(art.updated_at || art.published_at).split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${art.is_popular ? '0.9' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// 8. Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(
`User-agent: *
Allow: /
Disallow: /admin/

User-agent: Googlebot
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${config.site.url}/sitemap.xml
`
  );
});

// 8b. Ads.txt for AdSense & Exchange Verification
app.get('/ads.txt', (req, res) => {
  res.type('text/plain');
  const pubId = (config.monetization.adsenseClientId || 'pub-0000000000000000').replace('ca-', '');
  res.send(
`# PawPulse Authorized Digital Sellers (ads.txt)
google.com, ${pubId}, DIRECT, f08c47fec0942fa0
`
  );
});

// 9. Dynamic RSS Feed (rss.xml)
app.get('/rss.xml', (req, res) => {
  const articles = db.getAllArticles(50, 0);
  const baseUrl = config.site.url;

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>${config.site.name}</title>\n`;
  rss += `    <link>${baseUrl}</link>\n`;
  rss += `    <description>${config.site.description}</description>\n`;
  rss += `    <language>en-us</language>\n`;
  rss += `    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />\n`;

  articles.forEach(art => {
    rss += `    <item>\n`;
    rss += `      <title><![CDATA[${art.title}]]></title>\n`;
    rss += `      <link>${baseUrl}/blog/${art.slug}</link>\n`;
    rss += `      <guid>${baseUrl}/blog/${art.slug}</guid>\n`;
    rss += `      <pubDate>${new Date(art.published_at).toUTCString()}</pubDate>\n`;
    rss += `      <description><![CDATA[${art.excerpt}]]></description>\n`;
    rss += `      <author>${art.author_name}</author>\n`;
    rss += `    </item>\n`;
  });

  rss += `  </channel>\n`;
  rss += `</rss>`;

  res.header('Content-Type', 'application/xml');
  res.send(rss);
});

// 9b. JSON Feed v1.1 Specification (RFC/v1.1)
app.get(['/feed.json', '/api/v1/feed.json'], (req, res) => {
  const articles = db.getAllArticles(50, 0);
  const baseUrl = config.site.url;

  const jsonFeed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: config.site.name,
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    description: config.site.description,
    icon: `${baseUrl}/favicon.ico`,
    favicon: `${baseUrl}/favicon.ico`,
    authors: [
      {
        name: config.site.authorDefault,
        url: `${baseUrl}/about`
      }
    ],
    items: articles.map(art => ({
      id: `${baseUrl}/blog/${art.slug}`,
      url: `${baseUrl}/blog/${art.slug}`,
      title: art.title,
      summary: art.excerpt,
      image: art.featured_image,
      date_published: new Date(art.published_at).toISOString(),
      date_modified: new Date(art.updated_at || art.published_at).toISOString(),
      author: {
        name: art.author_name
      },
      tags: (() => {
        try {
          return JSON.parse(art.tags);
        } catch {
          return [art.category_slug, art.pet_type];
        }
      })()
    }))
  };

  res.header('Content-Type', 'application/feed+json; charset=utf-8');
  res.json(jsonFeed);
});

// 9c. Compact Search Index API (Fast autocomplete & GitHub Pages parity)
app.get('/api/search-index.json', (req, res) => {
  const searchIndex = db.getSearchIndex();
  res.header('Cache-Control', 'public, max-age=300');
  res.json(searchIndex);
});

// =============================================================
// REST API v1 ENDPOINTS
// =============================================================

// GET /api/v1/articles - Paginated article archive
app.get('/api/v1/articles', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const category = req.query.category ? req.query.category.trim() : null;

  let articles = [];
  let total = 0;

  if (category) {
    articles = db.getArticlesByCategory(category, limit, offset);
    total = db.getCategoryArticleCount(category);
  } else {
    articles = db.getAllArticles(limit, offset);
    total = db.getArticleCount();
  }

  res.json({
    success: true,
    count: articles.length,
    total,
    limit,
    offset,
    articles: articles.map(a => ({
      slug: a.slug,
      title: a.title,
      meta_description: a.meta_description,
      category_slug: a.category_slug,
      pet_type: a.pet_type,
      featured_image: a.featured_image,
      author_name: a.author_name,
      reading_time_minutes: a.reading_time_minutes,
      views: a.views,
      published_at: a.published_at
    }))
  });
});

// GET /api/v1/articles/:slug - Complete single article with parsed schemas
app.get('/api/v1/articles/:slug', (req, res) => {
  const article = db.getArticleBySlug(req.params.slug);
  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  let faqs = [];
  let howTo = [];
  let tags = [];
  try { faqs = JSON.parse(article.faqs_json); } catch {}
  try { howTo = JSON.parse(article.how_to_json); } catch {}
  try { tags = JSON.parse(article.tags); } catch {}

  res.json({
    success: true,
    article: {
      ...article,
      faqs,
      how_to: howTo,
      tags
    }
  });
});

// GET /api/v1/search - JSON search API
app.get('/api/v1/search', (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (!query) {
    return res.json({ success: true, query: '', count: 0, results: [] });
  }

  const results = db.searchArticles(query, limit);
  res.json({
    success: true,
    query,
    count: results.length,
    results: results.map(r => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      pet_type: r.pet_type,
      category_slug: r.category_slug,
      featured_image: r.featured_image,
      reading_time_minutes: r.reading_time_minutes,
      published_at: r.published_at
    }))
  });
});

// GET /api/v1/stats - Realtime platform metrics
app.get('/api/v1/stats', (req, res) => {
  const totalArticles = db.getArticleCount();
  const categoryCounts = config.categories.map(c => ({
    name: c.name,
    slug: c.slug,
    count: db.getCategoryArticleCount(c.slug)
  }));
  const schedulerStatus = scheduler.getSchedulerStatus();

  res.json({
    success: true,
    platform: config.site.name,
    totalArticles,
    categories: categoryCounts,
    scheduler: schedulerStatus,
    integrations: {
      gemini: {
        enabled: config.integrations?.gemini?.enabled || false,
        model: config.integrations?.gemini?.model || 'gemini-3.5-flash-lite',
        active: !!process.env.GEMINI_API_KEY
      },
      monetization: {
        adsenseEnabled: config.monetization.enabled,
        clientId: config.monetization.adsenseClientId
      }
    }
  });
});

// POST /api/v1/generate - On-demand AI article generation
app.post('/api/v1/generate', async (req, res) => {
  try {
    const { prompt, species, useGemini } = req.body;
    const article = await generateAndPublishSingleArticle(prompt || null, {
      speciesName: species || null,
      useGemini: useGemini !== false
    });
    db.checkpoint();
    res.json({
      success: true,
      article: {
        slug: article.slug,
        title: article.title,
        url: `${config.site.url}/blog/${article.slug}`,
        localUrl: `/blog/${article.slug}`,
        pet_type: article.pet_type,
        category: article.category_slug,
        published_at: article.published_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Admin Automation Dashboard
app.get('/admin/automation', (req, res) => {
  const status = scheduler.getSchedulerStatus();
  const logs = db.getRecentLogs(15);
  const categoryCounts = config.categories.map(c => ({
    name: c.name,
    slug: c.slug,
    count: db.getCategoryArticleCount(c.slug)
  }));

  res.render('admin', {
    title: `Publishing Automation & Ad Control — ${config.site.name}`,
    metaDescription: 'Manage 50-post daily automated publishing pipeline and ad configurations.',
    status,
    logs,
    categoryCounts,
    flash: req.query.msg || null
  });
});

// Admin Action: Trigger Batch of 50 Articles
app.post('/admin/automation/publish-batch', async (req, res) => {
  try {
    const count = parseInt(req.body.count, 10) || 50;
    const published = await publishBatch(count);
    db.checkpoint();
    res.redirect(`/admin/automation?msg=Successfully+published+batch+of+${published.length}+articles!`);
  } catch (err) {
    res.redirect(`/admin/automation?msg=Error+publishing+batch:+${encodeURIComponent(err.message)}`);
  }
});

// Admin Action: Toggle Scheduler
app.post('/admin/automation/toggle-scheduler', (req, res) => {
  const status = scheduler.getSchedulerStatus();
  if (status.isRunning) {
    scheduler.stopScheduler();
    res.redirect('/admin/automation?msg=Automated+scheduler+paused.');
  } else {
    scheduler.startScheduler();
    res.redirect('/admin/automation?msg=Automated+daily+scheduler+resumed.');
  }
});

// Admin Action: Publish Custom Single Article
app.post('/admin/automation/publish-custom', async (req, res) => {
  try {
    const { prompt, species, useGemini } = req.body;
    const article = await generateAndPublishSingleArticle(prompt, {
      speciesName: species || null,
      useGemini: useGemini === '1' || useGemini === 'true' || useGemini === true
    });
    db.checkpoint();
    res.redirect(`/blog/${article.slug}`);
  } catch (err) {
    res.redirect(`/admin/automation?msg=Error:+${encodeURIComponent(err.message)}`);
  }
});

// Admin Action: Save Affiliate IDs & Monetization Settings
app.post('/admin/automation/save-affiliates', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!currentConfig.monetization) currentConfig.monetization = {};
    if (!currentConfig.monetization.affiliates) currentConfig.monetization.affiliates = {};

    const {
      amazonTag,
      chewyPartnerId,
      lemonadePartnerId,
      embarkPartnerId,
      petcoPartnerId,
      justanswerPartnerId,
      adsenseClientId,
      demoMode
    } = req.body;

    if (amazonTag) {
      currentConfig.monetization.affiliateTag = amazonTag.trim();
      if (currentConfig.monetization.affiliates.amazon) {
        currentConfig.monetization.affiliates.amazon.tag = amazonTag.trim();
        currentConfig.monetization.affiliates.amazon.status = 'Active (Configured)';
      }
    }
    if (chewyPartnerId && currentConfig.monetization.affiliates.chewy) {
      currentConfig.monetization.affiliates.chewy.partnerId = chewyPartnerId.trim();
      currentConfig.monetization.affiliates.chewy.status = 'Active (Configured)';
    }
    if (lemonadePartnerId && currentConfig.monetization.affiliates.lemonade) {
      currentConfig.monetization.affiliates.lemonade.partnerId = lemonadePartnerId.trim();
      currentConfig.monetization.affiliates.lemonade.status = 'Active (Configured)';
    }
    if (embarkPartnerId && currentConfig.monetization.affiliates.embark) {
      currentConfig.monetization.affiliates.embark.partnerId = embarkPartnerId.trim();
      currentConfig.monetization.affiliates.embark.status = 'Active (Configured)';
    }
    if (petcoPartnerId && currentConfig.monetization.affiliates.petco) {
      currentConfig.monetization.affiliates.petco.partnerId = petcoPartnerId.trim();
      currentConfig.monetization.affiliates.petco.status = 'Active (Configured)';
    }
    if (justanswerPartnerId && currentConfig.monetization.affiliates.justanswer) {
      currentConfig.monetization.affiliates.justanswer.partnerId = justanswerPartnerId.trim();
      currentConfig.monetization.affiliates.justanswer.status = 'Active (Configured)';
    }
    if (adsenseClientId) {
      currentConfig.monetization.adsenseClientId = adsenseClientId.trim();
    }
    currentConfig.monetization.demoMode = (demoMode === '1' || demoMode === 'true' || demoMode === true || demoMode === 'on');

    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');
    res.redirect('/admin/automation?msg=Affiliate+tracking+IDs+and+monetization+settings+successfully+saved!');
  } catch (err) {
    res.redirect(`/admin/automation?msg=Error+saving+affiliate+settings:+${encodeURIComponent(err.message)}`);
  }
});

// Server Listen
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` PawPulse Pet Magazine & Content Automation Server Active!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Sitemap: http://localhost:${PORT}/sitemap.xml`);
  console.log(` RSS Feed: http://localhost:${PORT}/rss.xml`);
  console.log(` Admin Automation: http://localhost:${PORT}/admin/automation`);
  console.log(` Total Articles Live: ${db.getArticleCount()}`);
  console.log(`================================================================`);
});
