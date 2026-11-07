/**
 * PawPulse Full-Spectrum Photo Deduplication & Unique Allocation Pipeline
 * Replaces every single duplicate and identical photo across all 730+ articles
 * with guaranteed unique, unmatched, authentic species photography.
 * Ensures 100% of articles have a unique featured image AND a unique in-article figure.
 */

const { db, checkpoint } = require('../database/db');
const { initPhotoManager, getUniquePhoto, clearAllUsed } = require('../services/photo-manager');

async function deduplicateAllPhotos() {
  console.log('[Deduplicator] Initializing photo manager and resetting usage records...');
  initPhotoManager(db);
  clearAllUsed(db);

  const articles = db.prepare('SELECT id, slug, title, category_slug, pet_type, featured_image, content_html FROM articles ORDER BY id ASC').all();
  console.log(`[Deduplicator] Found ${articles.length} articles to process.`);

  const updateStmt = db.prepare(`
    UPDATE articles
    SET featured_image = ?, content_html = ?, updated_at = ?
    WHERE id = ?
  `);

  db.exec('BEGIN TRANSACTION;');

  let updatedCount = 0;
  const now = new Date().toISOString();

  for (const art of articles) {
    const category = art.category_slug || 'cats';
    const petType = art.pet_type || 'Companion Animal';

    // 1. Assign brand-new, unmatched featured image
    const newFeatured = getUniquePhoto(db, category, art.slug, 'featured');

    // 2. Assign brand-new, unmatched secondary image for in-article figure
    const newSecondary = getUniquePhoto(db, category, art.slug, 'secondary');

    // 3. Update or inject secondary photo figure in content_html
    let updatedHtml = art.content_html;
    const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/i;

    if (imgRegex.test(updatedHtml)) {
      // Replace existing secondary image
      updatedHtml = updatedHtml.replace(imgRegex, (match, prefix, oldSrc, suffix) => {
        return `<img ${prefix}src="${newSecondary}"${suffix}>`;
      });
    } else {
      // Inject figure before 2nd <h2> or before the product box or at midway
      const figureHtml = `
    <figure class="my-8 rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-xs">
      <img src="${newSecondary}" alt="${petType} clinical observation and observational baseline" class="w-full h-72 sm:h-96 object-cover" loading="lazy" />
      <figcaption class="p-3 bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-500 dark:text-stone-400 italic text-center">
        Clinical Figure 1: Natural anatomical posture and observational baseline for ${petType}.
      </figcaption>
    </figure>
      `;

      // Find second <h2> or product box
      const secondH2Index = updatedHtml.indexOf('<h2', updatedHtml.indexOf('<h2') + 3);
      if (secondH2Index !== -1) {
        updatedHtml = updatedHtml.slice(0, secondH2Index) + figureHtml + '\n' + updatedHtml.slice(secondH2Index);
      } else {
        // Fallback: append before the last closing tags
        updatedHtml = updatedHtml + '\n' + figureHtml;
      }
    }

    updateStmt.run(newFeatured, updatedHtml, now, art.id);
    updatedCount++;

    if (updatedCount % 100 === 0 || updatedCount === articles.length) {
      console.log(`[Deduplicator] Processed ${updatedCount}/${articles.length} articles...`);
    }
  }

  db.exec('COMMIT;');
  console.log('[Deduplicator] Database transaction committed. Performing WAL checkpoint and JSON backup sync...');
  checkpoint();

  // Verification Audit
  console.log('\n--- VERIFICATION AUDIT ---');
  const total = db.prepare('SELECT COUNT(*) as c FROM articles').get().c;
  const uniqueFeatured = db.prepare('SELECT COUNT(DISTINCT featured_image) as c FROM articles').get().c;

  // Extract secondary images
  const allArticles = db.prepare('SELECT featured_image, content_html FROM articles').all();
  const secondarySet = new Set();
  const featuredSet = new Set();
  const duplicateSecondaryList = [];

  for (const a of allArticles) {
    featuredSet.add(a.featured_image);
    const m = a.content_html.match(/<img\s+[^>]*?src=["']([^"']+)["']/i);
    if (m && m[1]) {
      if (secondarySet.has(m[1])) {
        duplicateSecondaryList.push(m[1]);
      }
      secondarySet.add(m[1]);
    }
  }

  // Check overlap between featured and secondary
  let overlapCount = 0;
  for (const sec of secondarySet) {
    if (featuredSet.has(sec)) {
      overlapCount++;
    }
  }

  console.log(`Total Articles in Database:      ${total}`);
  console.log(`Unique Featured Images:          ${uniqueFeatured} / ${total}`);
  console.log(`Unique In-Article Figures:       ${secondarySet.size} / ${total}`);
  console.log(`Duplicate Secondary Images:      ${duplicateSecondaryList.length}`);
  console.log(`Overlap between Featured & Fig:  ${overlapCount} (Must be 0)`);
  console.log(`Total Distinct Photos Employed:  ${featuredSet.size + secondarySet.size} / ${total * 2}`);

  if (uniqueFeatured === total && secondarySet.size === total && overlapCount === 0) {
    console.log('\n SUCCESS: 100% OF ALL BLOCKS, CARDS, AND ARTICLES HAVE UNIQUE, UNMATCHED PHOTOS!');
  } else {
    console.warn('\n Warning: Deduplication had some collisions. Check details above.');
  }
}

deduplicateAllPhotos().catch(err => {
  console.error('[Deduplicator] Error:', err);
  process.exit(1);
});
