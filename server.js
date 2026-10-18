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

// 7. Dynamic Sitemap.xml (Auto-generated for search engines)
app.get('/sitemap.xml', (req, res) => {
  const articles = db.getAllArticles(2000, 0);
  const baseUrl = config.site.url;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static core pages
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/popular</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

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
    const prompt = req.body.prompt;
    const article = await generateAndPublishSingleArticle(prompt);
    res.redirect(`/blog/${article.slug}`);
  } catch (err) {
    res.redirect(`/admin/automation?msg=Error:+${encodeURIComponent(err.message)}`);
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
