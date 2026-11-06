/**
 * PawPulse Affiliate & Commercial Partner Link Resolver
 * Strictly compliant with FTC 16 CFR Part 255 & Google Search Guidelines (rel="sponsored nofollow").
 * Automatically maps species categories and medical equipment to tracked partner URLs.
 */

const fs = require('fs');
const path = require('path');

function getConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return require('../config.json');
  }
}

/**
 * Builds an Amazon search link pre-tagged with the site's Associate tracking ID.
 */
function getAmazonSearchUrl(query, tag = null) {
  const config = getConfig();
  const affiliateTag = tag || (config.monetization && config.monetization.affiliateTag) || 'pawpulse-20';
  const cleanQuery = encodeURIComponent(String(query).replace(/[^\w\s-]/g, '').trim());
  return `https://www.amazon.com/s?k=${cleanQuery}&tag=${affiliateTag}`;
}

/**
 * Builds a Chewy product or category search link.
 */
function getChewySearchUrl(query) {
  const config = getConfig();
  const partnerId = (config.monetization && config.monetization.affiliates && config.monetization.affiliates.chewy && config.monetization.affiliates.chewy.partnerId) || 'pawpulse';
  const cleanQuery = encodeURIComponent(String(query).replace(/[^\w\s-]/g, '').trim());
  return `https://www.chewy.com/s?query=${cleanQuery}&utm_source=partnerize&utm_medium=affiliate&utm_campaign=${partnerId}`;
}

/**
 * Builds a Lemonade Pet Insurance quote link.
 */
function getPetInsuranceUrl(petType = 'pet') {
  const config = getConfig();
  const partnerId = (config.monetization && config.monetization.affiliates && config.monetization.affiliates.lemonade && config.monetization.affiliates.lemonade.partnerId) || 'pawpulse_pet';
  return `https://www.lemonade.com/pet?utm_source=impact&utm_medium=affiliate&utm_campaign=${partnerId}`;
}

/**
 * Builds an Embark Dog DNA kit link.
 */
function getEmbarkDnaUrl() {
  const config = getConfig();
  const partnerId = (config.monetization && config.monetization.affiliates && config.monetization.affiliates.embark && config.monetization.affiliates.embark.partnerId) || 'pawpulse';
  return `https://embarkvet.com/products/dog-dna-tests/breed-health-kit/?utm_source=impact&utm_medium=affiliate&utm_campaign=${partnerId}`;
}

/**
 * Builds a JustAnswer 24/7 veterinary telehealth consultation link.
 */
function getJustAnswerVetUrl() {
  const config = getConfig();
  const partnerId = (config.monetization && config.monetization.affiliates && config.monetization.affiliates.justanswer && config.monetization.affiliates.justanswer.partnerId) || 'pawpulse';
  return `https://www.justanswer.com/sip/veterinary?r=${partnerId}`;
}

/**
 * Builds a Petco supplies or habitat search link.
 */
function getPetcoSearchUrl(query) {
  const config = getConfig();
  const partnerId = (config.monetization && config.monetization.affiliates && config.monetization.affiliates.petco && config.monetization.affiliates.petco.partnerId) || 'pawpulse';
  const cleanQuery = encodeURIComponent(String(query).replace(/[^\w\s-]/g, '').trim());
  return `https://www.petco.com/shop/en/petcostore/search?query=${cleanQuery}&cm_mmc=AFF-_-CJ-_-pawpulse-_-cj_${partnerId}`;
}

/**
 * Resolves comprehensive multi-store affiliate destinations for any product.
 * Returns primary and alternative vendor links with strict FTC attributes.
 */
function resolveProductAffiliate(productName, category = 'dogs', type = 'action') {
  const amazonUrl = getAmazonSearchUrl(productName);

  let secondary = {
    name: 'Chewy',
    label: 'Check Chewy Availability',
    url: getChewySearchUrl(productName),
    badge: 'Chewy Pharmacy & Care'
  };

  // Contextual smart routing based on species or clinical context
  if (category === 'reptiles' || category === 'snakes' || category === 'aquatics') {
    secondary = {
      name: 'Petco Terrarium & Aquatics',
      label: 'Inspect at Petco',
      url: getPetcoSearchUrl(productName),
      badge: 'Certified Habitat Supplier'
    };
  } else if (type === 'pathology' || type === 'medical') {
    secondary = {
      name: 'JustAnswer Vet',
      label: 'Ask an Online Vet 24/7 ($5)',
      url: getJustAnswerVetUrl(),
      badge: 'Instant Telehealth Triage'
    };
  } else if (type === 'behavior' && category === 'dogs') {
    secondary = {
      name: 'Embark Canine DNA',
      label: 'Analyze Genetic Breed Traits',
      url: getEmbarkDnaUrl(),
      badge: 'Cornell University Partner'
    };
  }

  return {
    productName,
    primary: {
      name: 'Amazon',
      label: 'Check Current Price on Amazon \u2192',
      url: amazonUrl,
      badge: 'In Stock & Verified Specs'
    },
    secondary,
    rel: 'sponsored nofollow noopener',
    target: '_blank'
  };
}

/**
 * Returns complete catalog of affiliate partner networks with application links,
 * requirements, and status.
 */
function getAffiliateCatalog() {
  const config = getConfig();
  const affiliates = (config.monetization && config.monetization.affiliates) || {};
  return Object.values(affiliates);
}

module.exports = {
  getAmazonSearchUrl,
  getChewySearchUrl,
  getPetInsuranceUrl,
  getEmbarkDnaUrl,
  getJustAnswerVetUrl,
  getPetcoSearchUrl,
  resolveProductAffiliate,
  getAffiliateCatalog
};
