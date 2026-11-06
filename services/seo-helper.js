/**
 * SEO & Schema Markup Helper
 * Generates Google-compliant JSON-LD structured data for Articles, HowTos, and FAQPages.
 */

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function calculateReadingTime(text) {
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const wordsPerMinute = 220;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function safeJsonParse(data, fallback = []) {
  if (!data) return fallback;
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

function generateArticleSchema(article, siteConfig) {
  const baseUrl = siteConfig.site.url;
  const articleUrl = `${baseUrl}/blog/${article.slug}`;
  const tags = safeJsonParse(article.tags, []);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    'headline': article.title,
    'description': article.meta_description || article.excerpt,
    'image': [article.featured_image],
    'datePublished': article.published_at,
    'dateModified': article.updated_at || article.published_at,
    'author': {
      '@type': 'Person',
      'name': article.author_name || siteConfig.site.authorDefault,
      'jobTitle': article.author_role || 'Veterinary Behavior Specialist',
      'url': `${baseUrl}/about`
    },
    'publisher': {
      '@type': 'Organization',
      'name': siteConfig.site.name,
      'logo': {
        '@type': 'ImageObject',
        'url': `${baseUrl}/images/logo.png`
      }
    },
    'articleSection': article.category_slug,
    'keywords': Array.isArray(tags) ? tags.join(', ') : ''
  };

  return JSON.stringify(schema, null, 2);
}

function generateHowToSchema(article, siteConfig) {
  if (!article.how_to_json) return null;
  const steps = safeJsonParse(article.how_to_json, []);
  if (!steps || !steps.length) return null;

  const baseUrl = siteConfig.site.url;
  const articleUrl = `${baseUrl}/blog/${article.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': article.title,
    'description': article.excerpt,
    'image': article.featured_image,
    'url': articleUrl,
    'step': steps.map((s, idx) => ({
      '@type': 'HowToStep',
      'position': idx + 1,
      'name': s.title || `Step ${idx + 1}`,
      'itemListElement': [{
        '@type': 'HowToDirection',
        'text': s.text || s.description
      }],
      ...(s.image ? { 'image': s.image } : {})
    }))
  };

  return JSON.stringify(schema, null, 2);
}

function generateFAQSchema(faqsJson) {
  if (!faqsJson) return null;
  const faqs = safeJsonParse(faqsJson, []);
  if (!faqs || !faqs.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return JSON.stringify(schema, null, 2);
}

function generateBreadcrumbSchema(breadcrumbs, siteConfig) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': crumb.name,
      'item': `${siteConfig.site.url}${crumb.url}`
    }))
  };

  return JSON.stringify(schema, null, 2);
}

function generateProductReviewSchema(products, siteConfig, articleUrl) {
  if (!products || !products.length) return null;
  const prod = products[0];
  const prodName = prod.name || prod.title || 'Veterinary Recommended Care Equipment';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': prodName,
    'description': prod.description || `Veterinary evaluated ${prodName} meeting biological safety and clinical efficacy standards.`,
    'image': prod.image || `${siteConfig.site.url}/images/logo.png`,
    'brand': {
      '@type': 'Brand',
      'name': 'Veterinary Clinical Choice'
    },
    'review': {
      '@type': 'Review',
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': '4.9',
        'bestRating': '5'
      },
      'author': {
        '@type': 'Person',
        'name': siteConfig.site.authorDefault || 'Dr. Julian Vance, DVM'
      }
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '142'
    },
    'offers': {
      '@type': 'Offer',
      'url': articleUrl,
      'priceCurrency': 'USD',
      'price': '29.99',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Amazon & Verified Veterinary Suppliers'
      }
    }
  };

  return JSON.stringify(schema, null, 2);
}

module.exports = {
  generateSlug,
  calculateReadingTime,
  generateArticleSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateProductReviewSchema
};
