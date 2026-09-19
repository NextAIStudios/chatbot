/**
 * ingest.js
 * ----------------------------------------------------------------------------
 * Turns a business's own website (and, where available, its own APIs/feeds)
 * into a normalized knowledge store: Pages -> Chunks -> Embeddings, plus a
 * detected archetype and evidence-gated capability flags.
 *
 * Design rules this file enforces (from the bug history that produced it):
 *   1. Only ever fetches the ONE domain the business owner registered.
 *      Never accepts an arbitrary URL from a request body (SSRF guard).
 *   2. A capability (checkout, appointment_booking, pricing_display, ...) is
 *      only ever set to `true` when real evidence was found. Absence of
 *      evidence -> false. Nothing here ever fabricates a default.
 *   3. Prefers structured data (product feeds, JSON-LD, real APIs) over raw
 *      HTML scraping, because structured data is stable, current, and legal
 *      to poll frequently; HTML scraping is the fallback of last resort.
 * ----------------------------------------------------------------------------
 */

import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Types (JSDoc only -- no build step assumed)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Page
 * @property {string} url
 * @property {string} title
 * @property {'product'|'policy'|'overview'|'support'|'service'} contentType
 * @property {string} text
 * @property {Object} [structuredData]  // price, sku, in_stock, category_path, etc.
 * @property {string} crawledAt
 * @property {1|2|3} sourceTier
 */

/**
 * @typedef {Object} Chunk
 * @property {string} id
 * @property {string} pageUrl
 * @property {'product'|'policy'|'overview'|'support'|'service'} contentType
 * @property {string} text
 * @property {number[]} [embedding]     // filled in by embedFn
 */

/**
 * @typedef {Object} Capabilities
 * @property {{enabled:boolean, evidenceUrl:?string, reason:string}} checkout
 * @property {{enabled:boolean, evidenceUrl:?string, reason:string}} pricingDisplay
 * @property {{enabled:boolean, evidenceUrl:?string, reason:string}} catalogBrowsing
 * @property {{enabled:boolean, evidenceUrl:?string, reason:string}} appointmentBooking
 */

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Ingest a single business's own site. This is the only function callers
 * should invoke -- everything else in this file is a private helper.
 *
 * @param {Object} opts
 * @param {string} opts.domainUrl        The business's OWN url, as they entered it.
 * @param {number} [opts.pageBudget=200] Max pages to crawl for tier 2/3.
 * @param {Function} [opts.fetchImpl]    Injectable fetch (for tests). Defaults to global fetch.
 * @returns {Promise<{pages: Page[], archetype: string, archetypeConfidence: number,
 *                     archetypeSignals: string[], capabilities: Capabilities}>}
 */
export async function ingestSite({ domainUrl, pageBudget = 200, fetchImpl = fetch }) {
  const origin = normalizeOrigin(domainUrl);

  const tier1 = await tryStructuredFeeds(origin, fetchImpl);
  const homepage = await safeFetchText(origin, fetchImpl);
  const jsonLd = homepage ? extractJsonLd(homepage) : [];

  const archetypeResult = classifyArchetype({ origin, jsonLd, homepage });

  let pages;
  if (tier1.found) {
    // Tier 1: structured product feed. One Page per SKU, refresh-friendly.
    pages = tier1.products.map(p => productToPage(p, origin));
  } else {
    // Tier 2/3: crawl. JSON-LD-aware if present, plain HTML extraction otherwise.
    pages = await crawlSite(origin, { pageBudget, fetchImpl });
  }

  const capabilities = deriveCapabilities({ origin, pages, tier1, jsonLd });

  return {
    pages,
    archetype: archetypeResult.archetype,
    archetypeConfidence: archetypeResult.confidence,
    archetypeSignals: archetypeResult.signals,
    capabilities,
  };
}

// ---------------------------------------------------------------------------
// Tier 0: origin safety
// ---------------------------------------------------------------------------

function normalizeOrigin(domainUrl) {
  const withScheme = /^https?:\/\//i.test(domainUrl) ? domainUrl : `https://${domainUrl}`;
  const u = new URL(withScheme);
  return `${u.protocol}//${u.host}`;
}

/** Refuse to fetch anything outside the registered origin. SSRF guard. */
function assertSameOrigin(url, origin) {
  const u = new URL(url, origin);
  if (`${u.protocol}//${u.host}` !== origin) {
    throw new Error(`Refusing cross-origin fetch: ${url} is not part of ${origin}`);
  }
  return u.toString();
}

async function safeFetchText(url, fetchImpl, timeoutMs = 8000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetchImpl(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'BotlyBot/1.0 (+https://botly.example/bot-info)' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tier 1: structured feeds (preferred -- stable, legal, cheap to refresh)
// ---------------------------------------------------------------------------

async function tryStructuredFeeds(origin, fetchImpl) {
  // Shopify-style storefront JSON
  const shopify = await safeFetchText(assertSameOrigin('/products.json', origin), fetchImpl);
  if (shopify) {
    try {
      const parsed = JSON.parse(shopify);
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        return {
          found: true,
          source: 'shopify_products_json',
          products: parsed.products.map(p => ({
            name: p.title,
            price: p.variants?.[0]?.price ? Number(p.variants[0].price) : null,
            currency: p.variants?.[0]?.price ? null : null, // Shopify's JSON doesn't include currency; resolve from shop config if needed
            inStock: p.variants?.some(v => v.available) ?? null,
            url: `${origin}/products/${p.handle}`,
            sku: p.variants?.[0]?.sku || null,
            category: p.product_type || null,
          })),
        };
      }
    } catch {
      /* not shopify, fall through */
    }
  }

  // Generic Google Merchant-style XML feed at a conventional path
  const feed = await safeFetchText(assertSameOrigin('/feed.xml', origin), fetchImpl)
    || await safeFetchText(assertSameOrigin('/sitemap-products.xml', origin), fetchImpl);
  if (feed && feed.includes('<g:id>')) {
    return { found: true, source: 'merchant_xml_feed', products: parseMerchantFeed(feed, origin) };
  }

  return { found: false };
}

function parseMerchantFeed(xml, origin) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const products = [];
  $('item').each((_, el) => {
    const $el = $(el);
    const priceRaw = $el.find('g\\:price, price').first().text();
    const priceNum = parseFloat(priceRaw.replace(/[^\d.]/g, '')) || null;
    products.push({
      name: $el.find('title').first().text().trim(),
      price: priceNum,
      currency: (priceRaw.match(/[A-Z]{3}/) || [null])[0],
      inStock: /in[_ ]stock/i.test($el.find('g\\:availability, availability').first().text()),
      url: $el.find('link').first().text().trim() || origin,
      sku: $el.find('g\\:id, id').first().text().trim() || null,
      category: $el.find('g\\:product_type, product_type').first().text().trim() || null,
    });
  });
  return products;
}

function productToPage(p, origin) {
  const priceText = p.price != null ? `${p.currency || ''} ${p.price}`.trim() : 'price not published';
  return {
    url: p.url || origin,
    title: p.name,
    contentType: 'product',
    text: `${p.name}. Price: ${priceText}. ${p.inStock === false ? 'Currently out of stock.' : ''} Category: ${p.category || 'uncategorized'}.`,
    structuredData: { price: p.price, currency: p.currency, sku: p.sku, inStock: p.inStock, category: p.category },
    crawledAt: new Date().toISOString(),
    sourceTier: 1,
  };
}

// ---------------------------------------------------------------------------
// Tier 2/3: crawl the business's own site (only ever this origin)
// ---------------------------------------------------------------------------

const PRIORITY_HINTS = ['service', 'product', 'catalog', 'pricing', 'faq', 'contact', 'about', 'policy', 'shop'];

async function crawlSite(origin, { pageBudget, fetchImpl }) {
  const pages = [];
  const visited = new Set();
  const queue = [origin];

  while (queue.length && pages.length < pageBudget) {
    const url = queue.shift();
    const norm = url.split('#')[0].replace(/\/$/, '');
    if (visited.has(norm)) continue;
    visited.add(norm);

    let safeUrl;
    try {
      safeUrl = assertSameOrigin(url, origin);
    } catch {
      continue; // never follow off-origin links
    }

    const html = await safeFetchText(safeUrl, fetchImpl);
    if (!html) continue;

    const page = extractPage(html, safeUrl);
    if (page) pages.push(page);

    const $ = cheerio.load(html);
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      try {
        const abs = assertSameOrigin(href, origin);
        const p = new URL(abs).pathname.toLowerCase();
        if (PRIORITY_HINTS.some(h => p.includes(h))) links.unshift(abs);
        else links.push(abs);
      } catch { /* off-origin, skip */ }
    });
    for (const l of links) if (!visited.has(l.split('#')[0].replace(/\/$/, ''))) queue.push(l);
  }

  return pages;
}

function extractPage(html, url) {
  const $ = cheerio.load(html);
  $('script, style, noscript, nav, footer, svg').remove();

  const title = $('title').first().text().trim() || $('h1').first().text().trim() || url;
  const metaDesc = $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || '';

  const bodyParagraphs = $('main, article, body')
    .first()
    .find('p, li')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(t => t.length > 20);

  const text = (metaDesc ? metaDesc + '. ' : '') + bodyParagraphs.join(' ');
  if (text.trim().length < 30) return null; // not enough real content to be worth indexing

  return {
    url,
    title,
    contentType: classifyContentType(url, title, text),
    text,
    structuredData: extractInlineProductSignals($),
    crawledAt: new Date().toISOString(),
    sourceTier: 2,
  };
}

function classifyContentType(url, title, text) {
  const combined = `${url} ${title} ${text.slice(0, 300)}`.toLowerCase();
  if (/\b(price|pricing|cost|fee|package|plan|checkout|billing|rate)\b/.test(combined)) return 'policy';
  if (/\b(return|refund|warranty|shipping|delivery|terms|privacy|disclaimer)\b/.test(combined)) return 'policy';
  if (/\b(contact|support|help|faq|hours|location|phone)\b/.test(combined)) return 'support';
  if (/\b(product|catalog|shop|buy|price|sku)\b/.test(combined) && /\d/.test(combined)) return 'product';
  if (/\b(service|services|solution|solutions|practice|offering)\b/.test(combined)) return 'service';
  return 'overview';
}

/** Best-effort: pull Schema.org Product/Offer markup if the page happens to have it. */
function extractInlineProductSignals($) {
  const ld = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { ld.push(JSON.parse($(el).contents().text())); } catch { /* ignore malformed */ }
  });
  const product = ld.flat().find(x => x && (x['@type'] === 'Product' || x['@type'] === 'Offer'));
  if (!product) return null;
  return {
    price: product.offers?.price ?? product.price ?? null,
    currency: product.offers?.priceCurrency ?? null,
    sku: product.sku ?? null,
    inStock: product.offers?.availability?.includes('InStock') ?? null,
  };
}

function extractJsonLd(html) {
  const $ = cheerio.load(html);
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { out.push(JSON.parse($(el).contents().text())); } catch { /* ignore */ }
  });
  return out.flat();
}

// ---------------------------------------------------------------------------
// Archetype classification (drives which tools/capabilities a bot may use)
// ---------------------------------------------------------------------------

const ARCHETYPE_RULES = [
  { archetype: 'legal', jsonLdTypes: ['LegalService', 'Attorney'], keywords: ['advocate', 'law firm', 'legal', 'attorney', 'chambers'] },
  { archetype: 'medical', jsonLdTypes: ['MedicalBusiness', 'Physician', 'Dentist'], keywords: ['clinic', 'hospital', 'doctor', 'medical', 'dental'] },
  { archetype: 'ecommerce', jsonLdTypes: ['Product', 'Store', 'OnlineStore'], keywords: ['shop', 'store', 'catalog', 'cart', 'checkout'] },
  { archetype: 'restaurant', jsonLdTypes: ['Restaurant', 'FoodEstablishment'], keywords: ['menu', 'reservation', 'restaurant', 'cafe'] },
  { archetype: 'real_estate', jsonLdTypes: ['RealEstateAgent'], keywords: ['listing', 'property', 'realtor', 'lettings'] },
  { archetype: 'education', jsonLdTypes: ['EducationalOrganization'], keywords: ['course', 'enroll', 'academy', 'school', 'training'] },
];

function classifyArchetype({ origin, jsonLd, homepage }) {
  const signals = [];
  const scores = {};
  const lowerHome = (homepage || '').toLowerCase();
  const jsonLdTypes = jsonLd.map(x => x && x['@type']).filter(Boolean).flat();

  for (const rule of ARCHETYPE_RULES) {
    let score = 0;
    for (const t of rule.jsonLdTypes) {
      if (jsonLdTypes.includes(t)) { score += 3; signals.push(`json-ld:${t}`); }
    }
    for (const kw of rule.keywords) {
      if (lowerHome.includes(kw)) { score += 1; signals.push(`keyword:${kw}`); }
    }
    if (score > 0) scores[rule.archetype] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] < 2) {
    // Low/no confidence -> safe default, not a guess.
    return { archetype: 'generic_safe', confidence: 0, signals };
  }
  const [best, score] = ranked[0];
  return { archetype: best, confidence: Math.min(1, score / 6), signals };
}

// ---------------------------------------------------------------------------
// Capability gating -- every flag defaults false; only real evidence flips it
// ---------------------------------------------------------------------------

function deriveCapabilities({ origin, pages, tier1, jsonLd }) {
  const cap = (enabled, evidenceUrl, reason) => ({ enabled, evidenceUrl: evidenceUrl || null, reason });

  const catalogPage = pages.find(p => p.contentType === 'product');
  const pricingEvidence = pages.find(p => /\b(price|pricing|rate|fee)\b/i.test(p.title + p.text));
  const bookingEvidence = pages.find(p => /\b(book|appointment|schedule|calendly|consultation)\b/i.test(p.title + p.text));

  return {
    catalogBrowsing: tier1.found
      ? cap(true, origin, 'structured product feed found')
      : catalogPage
        ? cap(true, catalogPage.url, 'product content detected on crawled page')
        : cap(false, null, 'no product feed or product pages found'),

    pricingDisplay: pricingEvidence
      ? cap(true, pricingEvidence.url, 'published pricing content found')
      : cap(false, null, 'no pricing page or price markup found'),

    // Checkout is NEVER auto-enabled from a crawl or scrape, under any
    // evidence. It requires the business owner to explicitly register a
    // verified payment credential (till number, gateway account, etc.)
    // through a separate, human-confirmed flow. This is intentional and
    // must not be "improved" by inferring it from a page mentioning M-Pesa.
    checkout: cap(false, null, 'checkout requires an explicitly verified payment credential; never inferred from crawled content'),

    appointmentBooking: bookingEvidence
      ? cap(true, bookingEvidence.url, 'booking/consultation content or widget detected')
      : cap(false, null, 'no booking evidence found'),
  };
}
