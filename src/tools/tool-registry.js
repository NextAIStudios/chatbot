/**
 * Dynamic Tool Registry
 * Exposes live query-time tools for dynamic knowledge (products, stock, orders, bookings)
 * mapped to specific business archetypes.
 */

export const ARCHETYPE_TOOLS = {
  ecommerce: ['search_products', 'get_order_status', 'check_shipping'],
  retail: ['search_products', 'get_order_status'],
  legal: ['book_consultation', 'view_practice_areas'],
  medical: ['book_appointment', 'find_doctor'],
  saas: ['search_docs', 'book_demo'],
  hospitality: ['book_table', 'view_menu'],
  general_safe: ['request_callback']
};

/**
 * Generate a working live catalog/product search URL for a company website
 */
export function buildProductSearchUrl(baseUrl, query) {
  if (!baseUrl) return '';
  var cleanBase = baseUrl.trim().replace(/\/+$/, '');
  var encodedQuery = encodeURIComponent(query.trim());

  // Known platform / marketplace patterns
  if (cleanBase.includes('jumia.co.ke') || cleanBase.includes('jumia.com')) {
    return `https://www.jumia.co.ke/catalog/?q=${encodedQuery}`;
  }
  if (cleanBase.includes('amazon.')) {
    return `${cleanBase}/s?k=${encodedQuery}`;
  }
  if (cleanBase.includes('shopify') || cleanBase.includes('myshopify')) {
    return `${cleanBase}/search?q=${encodedQuery}`;
  }

  // Generic ecommerce standard search patterns
  return `${cleanBase}/search?q=${encodedQuery}`;
}

/**
 * Infer retail/ecommerce department based on extracted product keywords
 */
export function getDepartmentHint(query = '') {
  const lower = query.toLowerCase();
  if (/\b(egg|eggs|cooking\s*oil|vegetable\s*oil|olive\s*oil|flour|sugar|rice|grocer(y|ies)|supermarket|food|snack|cereal|milk|tea|coffee|detergent|soap)\b/i.test(lower)) {
    return {
      department: 'Groceries & Supermarket',
      icon: '🛒',
      details: 'Check daily supermarket flash sales, bundle packs, and household essentials.'
    };
  }
  if (/\b(toy|toys|child|children|kid|kids|baby|toddler|lego|doll|dolls|puzzle|action\s*figure|board\s*game)\b/i.test(lower)) {
    return {
      department: 'Baby Products, Toys & Games',
      icon: '🧸',
      details: 'Browse educational toys, baby play essentials, outdoor sets, and games.'
    };
  }
  if (/\b(phone|phones|smartphone|smartphones|iphone|samsung|tecno|infinix|xiaomi|redmi|tablet|tablets|ipad)\b/i.test(lower)) {
    return {
      department: 'Phones & Tablets',
      icon: '📱',
      details: 'Browse verified official brand warranties, 4G/5G devices, and bundle accessories.'
    };
  }
  if (/\b(laptop|laptops|macbook|computer|computers|pc|hp|dell|lenovo|asus|keyboard|monitor|ssd|ram)\b/i.test(lower)) {
    return {
      department: 'Computing & Laptops',
      icon: '💻',
      details: 'Compare processor specs, SSD storage, genuine Windows/macOS, and office laptops.'
    };
  }
  if (/\b(tv|tvs|television|soundbar|speaker|speakers|audio|subwoofer|hisense|sony|vitron|smart\s*tv)\b/i.test(lower)) {
    return {
      department: 'TVs & Home Audio',
      icon: '📺',
      details: 'Explore 4K UHD screens, Android/Smart OS displays, and home theater soundbars.'
    };
  }
  if (/\b(blender|blenders|fridge|refrigerator|microwave|cooker|kettle|iron|air\s*fryer|vacuum)\b/i.test(lower)) {
    return {
      department: 'Home & Kitchen Appliances',
      icon: '🍳',
      details: 'Find energy-efficient kitchen equipment, breakfast appliances, and home devices.'
    };
  }
  if (/\b(shoe|shoes|sneaker|sneakers|dress|dresses|shirt|shirts|clothing|clothes|jacket|socks|pants|tshirt)\b/i.test(lower)) {
    return {
      department: 'Fashion & Apparel',
      icon: '👕',
      details: 'Check available size charts, seasonal styles, footwear, and apparel.'
    };
  }
  if (/\b(watch|watches|smartwatch|smartwatches|curren|casio|rolex|timepiece)\b/i.test(lower)) {
    return {
      department: 'Watches & Accessories',
      icon: '⌚',
      details: 'Explore luxury analog chronographs, fitness trackers, and smart watches.'
    };
  }
  if (/\b(beauty|lotion|cream|perfume|fragrance|cologne|makeup|skincare|hair)\b/i.test(lower)) {
    return {
      department: 'Beauty & Personal Care',
      icon: '✨',
      details: 'Discover genuine cosmetics, dermatological skincare, and fragrance collections.'
    };
  }
  return null;
}

/**
 * Category boundary filter: Detects out-of-scope inquiries (livestock, cars, real estate)
 * and returns honest, realistic merchant guidance with relevant alternatives.
 */
export function checkCategoryBoundary(query = '', companyName = 'our store') {
  const lower = query.toLowerCase().trim();

  // 1. Livestock & Live Animals (e.g. "cow", "goat", "sheep", "cattle")
  if (/\b(cow|cows|goat|goats|sheep|bull|bulls|cattle|livestock|pig|pigs|horse|horses|camel|camels|live\s*chicken)\b/i.test(lower)) {
    return {
      isOutOfScope: true,
      category: 'livestock',
      reply: `**${companyName}** does not sell live animals or livestock.\n\nHowever, we carry fresh meat cuts and dairy products in our **Supermarket** section, as well as pet food, leather accessories, and animal care supplies. Would you like to explore any of those?`,
      suggestedQuickReplies: [
        { label: '🛒 Groceries & Supermarket', payload: 'What products are available in Groceries & Supermarket?' },
        { label: '🥩 Meat & Poultry', payload: 'What fresh meat and cuts are available in the supermarket?' },
        { label: '🥛 Dairy & Eggs', payload: 'Do you have fresh milk and dairy products in stock?' },
        { label: '🐾 Pet Supplies', payload: 'What pet care and pet food products do you offer?' }
      ]
    };
  }

  // 2. Motor Vehicles & Full Automobiles (e.g. "cars", "trucks")
  if (/\b(car|cars|motor\s*vehicle|automobile|truck|trucks|motorcycle|motorcycles|suv|suvs|sedan)\b/i.test(lower)) {
    return {
      isOutOfScope: true,
      category: 'vehicles',
      reply: `**${companyName}** does not sell full motor vehicles or cars.\n\nHowever, we offer a complete range of **Automotive Accessories & Spare Parts** including car batteries, dashcams, sound systems, motor oils, and cleaning kits. Would you like to view our automotive essentials?`,
      suggestedQuickReplies: [
        { label: '🚗 Car Accessories', payload: 'What car accessories and gadgets are available?' },
        { label: '🔋 Car Batteries', payload: 'What car batteries and chargers do you have?' },
        { label: '🔊 Car Audio & Dashcams', payload: 'What car sound systems and dashcams are in stock?' }
      ]
    };
  }

  // 3. Real Estate & Land (e.g. "house", "plot", "land")
  if (/\b(house|houses|land|plot|plots|apartment|apartments|mansion|real\s*estate|rental\s*property)\b/i.test(lower)) {
    return {
      isOutOfScope: true,
      category: 'real_estate',
      reply: `**${companyName}** does not sell real estate or land.\n\nHowever, we feature a vast collection of **Home & Kitchen Appliances**, living room furniture, beddings, and interior lighting to furnish your home. What can I help you furnish today?`,
      suggestedQuickReplies: [
        { label: '🛋️ Furniture & Living', payload: 'What home and living furniture is available?' },
        { label: '🍳 Kitchen Appliances', payload: 'What kitchen appliances and cookware do you have?' },
        { label: '📺 TVs & Audio', payload: 'What smart TVs and sound systems are on offer?' }
      ]
    };
  }

  return null;
}

/**
 * Rich product catalog inventory across major consumer retail departments
 */
export const CATALOG_DATABASE = {
  beauty: [
    {
      id: 'lotion_nivea_cocoa',
      name: "Nivea Cocoa Butter Intensive Body Lotion (400ml)",
      price: 650,
      currency: 'KES',
      specs: 'Deep moisture serum, 48h hydration, for dry skin',
      rating: '⭐ 4.8 (1,240 reviews)',
      category: 'Beauty & Personal Care',
      url: 'https://www.jumia.co.ke/beauty/',
      keywords: ['lotion', 'body lotion', 'nivea', 'cocoa butter', 'moisturizer', 'dry skin', 'cream']
    },
    {
      id: 'lotion_vaseline_aloe',
      name: "Vaseline Intensive Care Aloe Soothe Body Lotion (400ml)",
      price: 580,
      currency: 'KES',
      specs: 'Pure aloe extract, non-greasy, restores dry & sensitive skin',
      rating: '⭐ 4.7 (890 reviews)',
      category: 'Beauty & Personal Care',
      url: 'https://www.jumia.co.ke/beauty/',
      keywords: ['lotion', 'vaseline', 'aloe', 'soothe', 'body lotion', 'moisturizer']
    },
    {
      id: 'lotion_cerave_moisturizing',
      name: "CeraVe Daily Moisturizing Lotion (236ml)",
      price: 2400,
      currency: 'KES',
      specs: '3 essential ceramides, hyaluronic acid, dermatologist tested',
      rating: '⭐ 4.9 (650 reviews)',
      category: 'Beauty & Personal Care',
      url: 'https://www.jumia.co.ke/beauty/',
      keywords: ['cerave', 'lotion', 'moisturizing', 'skincare', 'face lotion', 'ceramides']
    },
    {
      id: 'lotion_garnier_vitaminc',
      name: "Garnier Bright Complete Vitamin C Body Lotion (400ml)",
      price: 850,
      currency: 'KES',
      specs: 'Enriched with lemon essence, SPF 20 UVA/UVB filters',
      rating: '⭐ 4.6 (430 reviews)',
      category: 'Beauty & Personal Care',
      url: 'https://www.jumia.co.ke/beauty/',
      keywords: ['garnier', 'vitamin c', 'brightening', 'lotion', 'body lotion', 'sun protection']
    }
  ],
  groceries: [
    {
      id: 'oil_rina_3l',
      name: "Rina Pure Vegetable Cooking Oil (3 Litres)",
      price: 799,
      currency: 'KES',
      specs: 'Cholesterol free, enriched with Vitamins A & D, fortified',
      rating: '⭐ 4.8 (2,150 reviews)',
      category: 'Groceries & Supermarket',
      url: 'https://www.jumia.co.ke/groceries/',
      keywords: ['cooking oil', 'oil', 'rina', 'vegetable oil', 'supermarket', 'food', 'groceries']
    },
    {
      id: 'oil_freshfri_2l',
      name: "Fresh Fri Pure Vegetable Cooking Oil with Ginger (2 Litres)",
      price: 580,
      currency: 'KES',
      specs: 'Triple refined, premium quality, non-smoking frying',
      rating: '⭐ 4.7 (1,430 reviews)',
      category: 'Groceries & Supermarket',
      url: 'https://www.jumia.co.ke/groceries/',
      keywords: ['fresh fri', 'cooking oil', 'oil', 'vegetable oil', 'groceries']
    },
    {
      id: 'oil_goldenfry_5l',
      name: "Golden Fry Premium Cooking Oil Jerrycan (5 Litres)",
      price: 1350,
      currency: 'KES',
      specs: 'Economy family size, 100% pure vegetable oil, long lasting',
      rating: '⭐ 4.9 (820 reviews)',
      category: 'Groceries & Supermarket',
      url: 'https://www.jumia.co.ke/groceries/',
      keywords: ['golden fry', '5l', '5 litres', 'cooking oil', 'oil', 'jerrycan']
    },
    {
      id: 'flour_pembe_2kg',
      name: "Pembe Home Baking All-Purpose Wheat Flour (2kg)",
      price: 185,
      currency: 'KES',
      specs: 'Finely milled, fortified with essential minerals, perfect for pastries & chapati',
      rating: '⭐ 4.8 (3,100 reviews)',
      category: 'Groceries & Supermarket',
      url: 'https://www.jumia.co.ke/groceries/',
      keywords: ['flour', 'wheat flour', 'pembe', 'baking', 'chapati', 'supermarket', 'groceries']
    }
  ],
  appliances: [
    {
      id: 'blender_ramtons_2in1',
      name: "Ramtons 2-in-1 Blender & Dry Mill 1.5L (400W)",
      price: 3499,
      currency: 'KES',
      specs: 'Stainless steel cutting blades, 2 speed with pulse, safety lock',
      rating: '⭐ 4.7 (980 reviews)',
      category: 'Home & Kitchen Appliances',
      url: 'https://www.jumia.co.ke/small-appliances/',
      keywords: ['blender', 'blenders', 'ramtons', 'mixer', 'grinder', 'smoothie']
    },
    {
      id: 'blender_mika_3in1',
      name: "Mika 3-in-1 Heavy Duty Blender, Chopper & Grinder 1.75L",
      price: 4200,
      currency: 'KES',
      specs: '600W copper motor, unbreakable jar, ice crushing blades',
      rating: '⭐ 4.8 (640 reviews)',
      category: 'Home & Kitchen Appliances',
      url: 'https://www.jumia.co.ke/small-appliances/',
      keywords: ['mika', 'blender', 'chopper', 'heavy duty', 'blenders', 'appliances']
    },
    {
      id: 'blender_sayona_commercial',
      name: "Sayona High-Speed Commercial Grade Blender (2 Litres)",
      price: 5800,
      currency: 'KES',
      specs: '1500W commercial motor, multi-function speed dial, BPA-free',
      rating: '⭐ 4.9 (410 reviews)',
      category: 'Home & Kitchen Appliances',
      url: 'https://www.jumia.co.ke/small-appliances/',
      keywords: ['sayona', 'commercial blender', 'high speed', 'blender', 'blenders']
    }
  ],
  fashion: [
    {
      id: 'shoes_running_sneakers',
      name: "Men's Breathable Mesh Lightweight Running Sneakers",
      price: 1850,
      currency: 'KES',
      specs: 'Cushioned shock-absorption sole, lace-up, gym & casual wear',
      rating: '⭐ 4.6 (1,850 reviews)',
      category: 'Fashion & Apparel',
      url: 'https://www.jumia.co.ke/mens-shoes/',
      keywords: ['shoes', 'sneakers', 'running shoes', 'shoe', 'footwear', 'trainers']
    },
    {
      id: 'shoes_leather_loafers',
      name: "Classic Italian Style Leather Slip-On Loafers",
      price: 2999,
      currency: 'KES',
      specs: 'Genuine cowhide leather, non-slip rubber outsole, formal & office wear',
      rating: '⭐ 4.8 (720 reviews)',
      category: 'Fashion & Apparel',
      url: 'https://www.jumia.co.ke/mens-shoes/',
      keywords: ['loafers', 'leather shoes', 'official shoes', 'shoes', 'slip on']
    },
    {
      id: 'socks_bamboo_cotton',
      name: "Bamboo Cotton Anti-Odor Ankle Socks (Pack of 6)",
      price: 450,
      currency: 'KES',
      specs: 'Breathable, sweat-wicking elastic arch support, unisex',
      rating: '⭐ 4.8 (2,400 reviews)',
      category: 'Fashion & Apparel',
      url: 'https://www.jumia.co.ke/fashion/',
      keywords: ['socks', 'ankle socks', 'cotton socks', 'sock', 'clothing']
    }
  ],
  toys: [
    {
      id: 'toy_lego_blocks_100',
      name: "100-Piece STEM Educational Building Blocks & Creative Lego Set",
      price: 1450,
      currency: 'KES',
      specs: 'Non-toxic ABS plastic, storage tub included, ages 3+',
      rating: '⭐ 4.9 (1,120 reviews)',
      category: 'Baby Products, Toys & Games',
      url: 'https://www.jumia.co.ke/toys-games/',
      keywords: ['toy', 'toys', 'building blocks', 'lego', 'educational toy', 'kid', 'child']
    },
    {
      id: 'toy_rc_stunt_car',
      name: "Remote Control 4WD High-Speed Stunt Racing Car (360° Flip)",
      price: 2100,
      currency: 'KES',
      specs: '2.4GHz anti-interference controller, rechargeable battery, LED lights',
      rating: '⭐ 4.7 (860 reviews)',
      category: 'Baby Products, Toys & Games',
      url: 'https://www.jumia.co.ke/toys-games/',
      keywords: ['rc car', 'remote control', 'toy car', 'toy', 'toys', 'stunt car']
    },
    {
      id: 'toy_baby_activity_gym',
      name: "Musical Baby Kick & Play Activity Piano Gym Mat",
      price: 2800,
      currency: 'KES',
      specs: '5 hanging sensory toys, musical piano keys, soft washable mat',
      rating: '⭐ 4.8 (540 reviews)',
      category: 'Baby Products, Toys & Games',
      url: 'https://www.jumia.co.ke/baby-products/',
      keywords: ['baby gym', 'play mat', 'baby toy', 'toy', 'toys', 'toddler']
    }
  ]
};

/**
 * Asynchronously fetch live scraped products from the Python BeautifulSoup microservice
 */
export async function fetchLiveScrapedProducts(query, siteUrl = '', apiBase = '') {
  try {
    if (!query || typeof query !== 'string' || !query.trim()) return null;
    const cleanQ = encodeURIComponent(query.trim());
    const cleanUrl = siteUrl ? encodeURIComponent(siteUrl.trim()) : '';
    let base = apiBase;
    if (!base && typeof window !== 'undefined' && window.location && window.location.origin) {
      base = window.location.origin;
    }
    if (!base) {
      base = 'http://localhost:8080';
    }
    const endpoint = `${base}/api/scrape-products?q=${cleanQ}${cleanUrl ? `&url=${cleanUrl}` : ''}`;

    if (typeof fetch === 'undefined') return null;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 4500) : null;

    const resp = await fetch(endpoint, {
      method: 'GET',
      signal: controller ? controller.signal : undefined,
      headers: { 'Accept': 'application/json' }
    });
    if (timer) clearTimeout(timer);

    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (err) {
    return null;
  }
}

const PRODUCT_INTROS_LIVE = [
  'Great news — I just pulled these live from the catalog for you:',
  "Here's what I found right now — fresh from the store:",
  'Found some great options! Let me show you what\'s available:',
  'Sure thing! Here are the top picks I found just now:',
  "I looked it up and here's what's in stock for you:"
];

function buildProductCardHtml(products, searchUrl, compName) {
  let html = '<div class="ins-product-grid">';
  products.forEach(p => {
    const pSym = p.currency === 'USD' ? '$' : 'KES ';
    const priceFormatted = pSym + Number(p.price).toLocaleString();
    const rating = p.rating || '4.8 ★';
    const ratingNum = parseFloat((rating + '').replace(/[^0-9.]/g, '')) || 4.8;
    let stars = '';
    for (let s = 1; s <= 5; s++) {
      stars += `<span class="ins-star${s <= Math.round(ratingNum) ? ' filled' : ''}">★</span>`;
    }
    const imgEl = p.image
      ? `<img src="${p.image}" alt="${p.name.replace(/"/g, '')}" class="ins-prod-img" onerror="this.style.display='none'">`
      : '<div class="ins-prod-img-placeholder">🛍️</div>';
    const specsStr = p.specs || 'Official warranty · Doorstep delivery';
    html += `<a href="${p.url || searchUrl}" target="_blank" rel="noopener noreferrer" class="ins-product-card">` +
      imgEl +
      '<div class="ins-prod-body">' +
        `<div class="ins-prod-name">${p.name}</div>` +
        `<div class="ins-prod-specs">${specsStr}</div>` +
        '<div class="ins-prod-footer">' +
          `<span class="ins-prod-price">${priceFormatted}</span>` +
          `<span class="ins-prod-stars">${stars}</span>` +
        '</div>' +
      '</div>' +
      '<div class="ins-prod-cta">View on store ↗</div>' +
    '</a>';
  });
  html += '</div>';
  if (searchUrl) {
    html += `<div class="ins-prod-browse-link"><a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Browse all results on ${compName} ↗</a></div>`;
  }
  return html;
}

/**
 * Formats live BeautifulSoup scraped products into rich chat messages and product cards
 */
export function formatScrapedProductsResult(scrapedData, query, siteUrl = '', compName = 'our store') {
  if (!scrapedData || !scrapedData.found || !scrapedData.items || scrapedData.items.length === 0) {
    return null;
  }

  const searchUrl = scrapedData.searchUrl || buildProductSearchUrl(siteUrl, query);
  const topProducts = scrapedData.items.slice(0, 3);
  const dept = getDepartmentHint(query);
  const intro = PRODUCT_INTROS_LIVE[Math.floor(Math.random() * PRODUCT_INTROS_LIVE.length)];

  let message = intro;
  if (dept) {
    message += ` (browsing **${dept.department}**).`;
  } else {
    message += '.';
  }

  const productCardsHtml = buildProductCardHtml(topProducts, searchUrl, compName);

  const quickReplies = [];
  if (topProducts.length > 0) {
    const pShort = topProducts[0].name.length > 20 ? topProducts[0].name.slice(0, 18) + '...' : topProducts[0].name;
    quickReplies.push({
      label: `💬 Tell me more about ${pShort}`,
      payload: `Can you tell me more about ${topProducts[0].name}?`
    });
  }
  quickReplies.push({
    label: '🔍 See all results ↗',
    payload: searchUrl,
    url: searchUrl
  });
  if (dept) {
    quickReplies.push({
      label: `${dept.icon} More in ${dept.department}`,
      payload: `What other deals do you have in ${dept.department}?`
    });
  }
  quickReplies.push({
    label: '🚚 Delivery info',
    payload: 'How does delivery work and what are the timelines?'
  });

  return {
    found: true,
    isLiveScraped: true,
    query,
    items: topProducts,
    searchUrl,
    department: dept ? dept.department : null,
    message,
    productCardsHtml,
    suggestedQuickReplies: quickReplies
  };
}

/**
 * Tool: search_products
 * Resolves live product queries via rich catalog discovery or store search fallback
 */
export function searchProducts(params = {}, config = {}) {
  const query = (params.query || '').trim();
  const siteUrl = config.company?.websiteUrl || '';
  const compName = config.company?.name || 'our store';
  const searchUrl = buildProductSearchUrl(siteUrl, query);

  // 1. Boundary check: Out of scope items (cows, cars, real estate)
  const boundary = checkCategoryBoundary(query, compName);
  if (boundary) {
    return {
      found: false,
      isOutOfScope: true,
      query,
      items: [],
      searchUrl: '',
      message: boundary.reply,
      suggestedQuickReplies: boundary.suggestedQuickReplies
    };
  }

  // If live scraped data was passed in params, format and return immediately
  if (params.scrapedData && params.scrapedData.found && params.scrapedData.items && params.scrapedData.items.length > 0) {
    const formatted = formatScrapedProductsResult(params.scrapedData, query, siteUrl, compName);
    if (formatted) return formatted;
  }

  // 2. Query matching products from CATALOG_DATABASE
  const lower = query.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/i).filter(t => t.length >= 2);
  const matchedProducts = [];

  for (const group of Object.values(CATALOG_DATABASE)) {
    for (const prod of group) {
      let isMatch = false;
      const prodText = (prod.name + ' ' + (prod.keywords || []).join(' ')).toLowerCase();
      for (const t of tokens) {
        if (prodText.includes(t)) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) {
        matchedProducts.push(prod);
      }
    }
  }

  // 3. If matching products are found, present rich in-chat product cards
  if (matchedProducts.length > 0) {
    const topProducts = matchedProducts.slice(0, 3);
    const dept = getDepartmentHint(query);
    const catIntros = [
      'Of course! Here are some popular options we carry:',
      'Happy to help with that! Take a look at these:',
      'Here are the best matches I found for you:',
      "Sure! Here's what we have available right now:"
    ];
    let message = catIntros[Math.floor(Math.random() * catIntros.length)];
    if (dept) message += ` (in **${dept.department}**)`;
    message += '.';

    const productCardsHtml = buildProductCardHtml(topProducts, searchUrl, compName);

    const quickReplies = [];
    if (topProducts.length > 0) {
      const pShort = topProducts[0].name.length > 20 ? topProducts[0].name.slice(0, 18) + '...' : topProducts[0].name;
      quickReplies.push({
        label: `💬 Tell me more about ${pShort}`,
        payload: `Can you tell me more about ${topProducts[0].name}?`
      });
    }
    quickReplies.push({
      label: '🔍 View all results ↗',
      payload: searchUrl,
      url: searchUrl
    });
    if (dept) {
      quickReplies.push({
        label: `${dept.icon} More in ${dept.department}`,
        payload: `What other deals do you have in ${dept.department}?`
      });
    }
    quickReplies.push({
      label: '🚚 Delivery info',
      payload: 'How does delivery work and what are the timelines?'
    });

    return {
      found: true,
      query,
      items: topProducts,
      searchUrl,
      department: dept ? dept.department : null,
      message,
      productCardsHtml,
      suggestedQuickReplies: quickReplies
    };
  }

  // 4. Honest fallback — no preset match, point to live catalog
  const dept = getDepartmentHint(query);
  const fallbackIntros = [
    "I don't have that in my quick-lookup right now, but I can point you to the live catalog where you can find it:",
    "Hmm, I couldn't find an exact match in my index — but the live store should have it:",
    "That one isn't in my preset list, but you can search it directly on the store:"
  ];
  let message = fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];
  if (dept) {
    message += ` Check out the **${dept.department}** section — ${dept.details}`;
  }

  const quickReplies = [
    { label: `🔍 Search "${query.slice(0, 18)}" on store ↗`, payload: searchUrl, url: searchUrl }
  ];
  if (dept) {
    quickReplies.push({
      label: `${dept.icon} Browse ${dept.department}`,
      payload: `What deals do you have in ${dept.department}?`
    });
  }
  quickReplies.push({
    label: '🚚 Delivery info',
    payload: 'How does delivery work and what are the timelines?'
  });

  return {
    found: true,
    isCatalogFallback: true,
    query,
    items: [],
    searchUrl,
    department: dept ? dept.department : null,
    message,
    suggestedQuickReplies: quickReplies
  };
}

export const ToolRegistry = {
  ARCHETYPE_TOOLS,
  buildProductSearchUrl,
  getDepartmentHint,
  checkCategoryBoundary,
  CATALOG_DATABASE,
  searchProducts,
  fetchLiveScrapedProducts,
  formatScrapedProductsResult
};

export default ToolRegistry;

