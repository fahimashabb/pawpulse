const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, 'pawpulse.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    pet_type TEXT NOT NULL,
    content_html TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    featured_image TEXT NOT NULL,
    author_name TEXT NOT NULL DEFAULT 'Dr. Julian Vance, DVM',
    author_role TEXT NOT NULL DEFAULT 'Veterinary Behavior Specialist',
    author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    reviewer_name TEXT DEFAULT 'Dr. Elena Rostova, DVM, DACVB',
    reading_time_minutes INTEGER DEFAULT 5,
    views INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    is_popular INTEGER DEFAULT 0,
    schema_type TEXT DEFAULT 'Article',
    faqs_json TEXT DEFAULT '[]',
    how_to_json TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    published_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_slug);
  CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_popular ON articles(is_popular, views DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_pet ON articles(pet_type);

  CREATE TABLE IF NOT EXISTS publishing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    articles_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    details TEXT
  );
`);

module.exports = {
  db,
  
  // Article Queries
  getAllArticles(limit = 100, offset = 0) {
    const stmt = db.prepare(`
      SELECT * FROM articles 
      ORDER BY datetime(published_at) DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  },

  getArticleCount() {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM articles`);
    return stmt.get().count;
  },

  getArticleBySlug(slug) {
    const stmt = db.prepare(`SELECT * FROM articles WHERE slug = ?`);
    return stmt.get(slug);
  },

  incrementViews(slug) {
    const stmt = db.prepare(`UPDATE articles SET views = views + 1 WHERE slug = ?`);
    stmt.run(slug);
  },

  getPopularArticles(limit = 6) {
    const stmt = db.prepare(`
      SELECT * FROM articles 
      ORDER BY is_popular DESC, views DESC, datetime(published_at) DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  getFeaturedArticles(limit = 4) {
    const stmt = db.prepare(`
      SELECT * FROM articles 
      WHERE is_featured = 1 
      ORDER BY datetime(published_at) DESC 
      LIMIT ?
    `);
    const featured = stmt.all(limit);
    if (featured.length < limit) {
      // Fallback to latest if not enough featured
      const fallbackStmt = db.prepare(`
        SELECT * FROM articles 
        ORDER BY datetime(published_at) DESC 
        LIMIT ?
      `);
      return fallbackStmt.all(limit);
    }
    return featured;
  },

  getArticlesByCategory(categorySlug, limit = 50, offset = 0) {
    const stmt = db.prepare(`
      SELECT * FROM articles 
      WHERE category_slug = ? 
      ORDER BY datetime(published_at) DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(categorySlug, limit, offset);
  },

  getCategoryArticleCount(categorySlug) {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM articles WHERE category_slug = ?`);
    return stmt.get(categorySlug).count;
  },

  searchArticles(query, limit = 50) {
    const wildcard = `%${query.toLowerCase()}%`;
    const stmt = db.prepare(`
      SELECT * FROM articles 
      WHERE lower(title) LIKE ? 
         OR lower(excerpt) LIKE ? 
         OR lower(content_html) LIKE ? 
         OR lower(pet_type) LIKE ?
         OR lower(tags) LIKE ?
      ORDER BY 
        CASE 
          WHEN lower(title) LIKE ? THEN 1
          WHEN lower(pet_type) LIKE ? THEN 2
          ELSE 3
        END,
        datetime(published_at) DESC
      LIMIT ?
    `);
    return stmt.all(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, limit);
  },

  getRelatedArticles(categorySlug, currentSlug, limit = 4) {
    const stmt = db.prepare(`
      SELECT * FROM articles 
      WHERE category_slug = ? AND slug != ? 
      ORDER BY datetime(published_at) DESC 
      LIMIT ?
    `);
    return stmt.all(categorySlug, currentSlug, limit);
  },

  insertArticle(article) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO articles (
        slug, title, meta_title, meta_description, category_slug, pet_type,
        content_html, excerpt, featured_image, author_name, author_role,
        author_avatar, reviewer_name, reading_time_minutes, views,
        is_featured, is_popular, schema_type, faqs_json, how_to_json,
        tags, published_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    return stmt.run(
      article.slug,
      article.title,
      article.meta_title || article.title,
      article.meta_description,
      article.category_slug,
      article.pet_type,
      article.content_html,
      article.excerpt,
      article.featured_image,
      article.author_name || 'Dr. Julian Vance, DVM',
      article.author_role || 'Veterinary Behavior Specialist',
      article.author_avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      article.reviewer_name || 'Dr. Elena Rostova, DVM, DACVB',
      article.reading_time_minutes || 5,
      article.views || Math.floor(Math.random() * 2500) + 120,
      article.is_featured ? 1 : 0,
      article.is_popular ? 1 : 0,
      article.schema_type || 'Article',
      typeof article.faqs_json === 'string' ? article.faqs_json : JSON.stringify(article.faqs_json || []),
      typeof article.how_to_json === 'string' ? article.how_to_json : JSON.stringify(article.how_to_json || []),
      typeof article.tags === 'string' ? article.tags : JSON.stringify(article.tags || []),
      article.published_at || new Date().toISOString(),
      article.updated_at || new Date().toISOString()
    );
  },

  logPublishing(articlesCount, status, details) {
    const stmt = db.prepare(`
      INSERT INTO publishing_logs (timestamp, articles_count, status, details)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(new Date().toISOString(), articlesCount, status, details);
  },

  getRecentLogs(limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM publishing_logs 
      ORDER BY datetime(timestamp) DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  checkpoint() {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      return true;
    } catch (err) {
      console.warn('SQLite checkpoint warning:', err.message);
      return false;
    }
  }
};
