const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const backupPath = path.join(__dirname, '..', 'database', 'articles_backup.json');
const targetDbPath = path.join(__dirname, '..', 'database', 'pawpulse_clean.db');

const { articles, logs } = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

if (fs.existsSync(targetDbPath)) {
  fs.unlinkSync(targetDbPath);
}

const newDb = new DatabaseSync(targetDbPath);

newDb.exec(`
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

const insertStmt = newDb.prepare(`
  INSERT INTO articles (
    id, slug, title, meta_title, meta_description, category_slug, pet_type,
    content_html, excerpt, featured_image, author_name, author_role,
    author_avatar, reviewer_name, reading_time_minutes, views,
    is_featured, is_popular, schema_type, faqs_json, how_to_json,
    tags, published_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const a of articles) {
  insertStmt.run(
    a.id, a.slug, a.title, a.meta_title, a.meta_description, a.category_slug, a.pet_type,
    a.content_html, a.excerpt, a.featured_image, a.author_name, a.author_role,
    a.author_avatar, a.reviewer_name, a.reading_time_minutes, a.views,
    a.is_featured, a.is_popular, a.schema_type, a.faqs_json, a.how_to_json,
    a.tags, a.published_at, a.updated_at
  );
}

const logStmt = newDb.prepare(`
  INSERT INTO publishing_logs (id, timestamp, articles_count, status, details)
  VALUES (?, ?, ?, ?, ?)
`);

for (const l of logs) {
  logStmt.run(l.id, l.timestamp, l.articles_count, l.status, l.details);
}

// Checkpoint clean database
newDb.exec('PRAGMA wal_checkpoint(TRUNCATE);');

const check = newDb.prepare('PRAGMA integrity_check').all();
console.log('Integrity check on clean DB:', check);
console.log('Clean DB total articles:', newDb.prepare('SELECT count(*) as c FROM articles').get());
