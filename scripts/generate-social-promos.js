/**
 * PawPulse Viral Social Distribution & Immediate Traffic Accelerator
 * Generates ready-to-publish Pinterest Pins, Reddit Discussion Hooks,
 * and Twitter/X threads for the highest-intent pet care guides in the database.
 */

const dbHelper = require('../database/db');
const config = require('../config.json');

function generateSocialToolkit() {
  console.log('================================================================');
  console.log(' PAWPULSE 7-DAY TRAFFIC ACCELERATOR: VIRAL SOCIAL LAUNCHPAD');
  console.log('================================================================\n');

  const popular = dbHelper.getPopularArticles(10);
  const baseUrl = config.site.url;

  popular.forEach((art, idx) => {
    const url = `${baseUrl}/blog/${art.slug}`;
    console.log(`----------------------------------------------------------------`);
    console.log(`[POST #${idx + 1}] Target: ${art.pet_type} Guardians`);
    console.log(`Title: ${art.title}`);
    console.log(`Live Link: ${url}`);
    console.log(`Featured Image: ${art.featured_image}\n`);

    console.log(`📌 PINTEREST PIN BLUEPRINT (Fastest 24-48h Traffic):`);
    console.log(`   Board: "${art.pet_type} Care & Health"`);
    console.log(`   Pin Title: ${art.title}`);
    console.log(`   Pin Description: Are you monitoring your ${art.pet_type}'s vital signs? Learn the exact veterinary-approved clinical protocol: ${art.excerpt.slice(0, 150)}... Read the full step-by-step veterinary guide on PawPulse! #PetCare #${art.pet_type.replace(/\s+/g, '')} #VeterinaryAdvice #PetHealth`);
    console.log(`   Destination URL: ${url}\n`);

    console.log(`🔴 REDDIT POST STARTER (r/${art.category_slug === 'cats' ? 'cats' : art.category_slug === 'dogs' ? 'dogs' : art.category_slug}):`);
    console.log(`   Title: Veterinary breakdown on ${art.pet_type} - what to look for when dealing with ${art.title.toLowerCase().slice(0, 50)}`);
    console.log(`   Body:`);
    console.log(`   "Hey everyone, sharing a veterinary clinical protocol we recently reviewed regarding ${art.pet_type}.`);
    console.log(`   Key takeaways:`);
    console.log(`   • ${art.excerpt.slice(0, 160)}...`);
    console.log(`   • Crucial to check baseline vital signs before administering home remedies.`);
    console.log(`   Full detailed clinical sequence here if anyone needs the step-by-step: ${url}"\n`);
  });

  console.log('================================================================');
  console.log('✓ Social Promo Toolkit Generated! Use these to drive instant visits.');
  console.log('================================================================\n');
}

generateSocialToolkit();
