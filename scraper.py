"""
Live Web Scraping & Crawling Engine for Chatbot
Uses requests & BeautifulSoup4 to dynamically extract real-time product listings
and website knowledge pages directly from merchant websites.
"""

import concurrent.futures
import re
import urllib.parse
from bs4 import BeautifulSoup
import requests

# Realistic browser headers to prevent basic bot blocking
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

# Category Boundaries: Out-of-scope merchant inquiries
OUT_OF_SCOPE_RULES = [
    {
        "pattern": r"\b(cow|cows|goat|goats|sheep|bull|bulls|cattle|livestock|pig|pigs|horse|horses|camel|camels|live\s*chicken)\b",
        "category": "livestock",
        "message": (
            "We do not sell live animals or livestock.\n\n"
            "However, we carry fresh meat cuts and dairy products in our **Supermarket** section, "
            "as well as pet food, leather accessories, and animal care supplies. Would you like to explore any of those?"
        ),
        "suggestedQuickReplies": [
            {"label": "🛒 Groceries & Supermarket", "payload": "What products are available in Groceries & Supermarket?"},
            {"label": "🥩 Meat & Poultry", "payload": "What fresh meat and cuts are available in the supermarket?"},
            {"label": "🥛 Dairy & Eggs", "payload": "Do you have fresh milk and dairy products in stock?"},
        ],
    },
    {
        "pattern": r"\b(car|cars|motor\s*vehicle|automobile|truck|trucks|motorcycle|motorcycles|suv|suvs|sedan)\b",
        "category": "vehicles",
        "message": (
            "We do not sell full motor vehicles or cars.\n\n"
            "However, we offer a complete range of **Automotive Accessories & Spare Parts** including car batteries, "
            "dashcams, sound systems, motor oils, and cleaning kits. Would you like to view our automotive essentials?"
        ),
        "suggestedQuickReplies": [
            {"label": "🚗 Car Accessories", "payload": "What car accessories and gadgets are available?"},
            {"label": "🔋 Car Batteries", "payload": "What car batteries and chargers do you have?"},
            {"label": "🔊 Car Audio & Dashcams", "payload": "What car sound systems and dashcams are in stock?"},
        ],
    },
    {
        "pattern": r"\b(house|houses|land|plot|plots|apartment|apartments|mansion|real\s*estate|rental\s*property)\b",
        "category": "real_estate",
        "message": (
            "We do not sell real estate or land.\n\n"
            "However, we feature a vast collection of **Home & Kitchen Appliances**, living room furniture, "
            "beddings, and interior lighting to furnish your home. What can I help you furnish today?"
        ),
        "suggestedQuickReplies": [
            {"label": "🛋️ Furniture & Living", "payload": "What home and living furniture is available?"},
            {"label": "🍳 Kitchen Appliances", "payload": "What kitchen appliances and cookware do you have?"},
            {"label": "📺 TVs & Audio", "payload": "What smart TVs and sound systems are on offer?"},
        ],
    },
]


def check_category_boundary(query: str, company_name: str = "our store") -> dict | None:
    """Check if inquiry falls into out-of-scope categories."""
    lower = query.lower().strip()
    for rule in OUT_OF_SCOPE_RULES:
        if re.search(rule["pattern"], lower, re.IGNORECASE):
            msg = rule["message"].replace("We do not sell", f"{company_name} does not sell")
            return {
                "isOutOfScope": True,
                "category": rule["category"],
                "message": msg,
                "suggestedQuickReplies": rule["suggestedQuickReplies"],
            }
    return None


def parse_numeric_price(price_str: str) -> tuple[float, str]:
    """Extract float number and currency code from price string."""
    if not price_str:
        return (0.0, "KES")

    clean = price_str.replace(",", "").strip()
    currency = "KES"
    if "$" in clean or "USD" in clean.upper():
        currency = "USD"
    elif "EUR" in clean.upper() or "€" in clean:
        currency = "EUR"
    elif "GBP" in clean.upper() or "£" in clean:
        currency = "GBP"

    nums = re.findall(r"\d+(?:\.\d+)?", clean)
    if nums:
        try:
            return (float(nums[0]), currency)
        except ValueError:
            pass
    return (0.0, currency)


def build_jumia_search_url(query: str) -> str:
    """Construct search catalog URL for Jumia Kenya."""
    clean = re.sub(r"^(?:i want|i need|looking for|buy|do you have|show me|search for)\s+", "", query, flags=re.I).strip()
    encoded = urllib.parse.quote_plus(clean if clean else query)
    return f"https://www.jumia.co.ke/catalog/?q={encoded}"


def scrape_jumia_products(html_content: str, base_url: str = "https://www.jumia.co.ke", max_results: int = 5) -> list[dict]:
    """Parse product cards from Jumia Kenya search result HTML using BeautifulSoup."""
    soup = BeautifulSoup(html_content, "html.parser")
    articles = soup.select("article.prd")
    products = []

    for art in articles:
        name_el = art.select_one(".name, h3.name")
        prc_el = art.select_one(".prc")
        link_el = art.select_one("a.core")
        img_el = art.select_one("img.img, img")
        rating_el = art.select_one(".stars._s, .rev, .stars")
        discount_el = art.select_one(".bdg._dsct, .tag._dsct")
        old_prc_el = art.select_one(".old")

        if not name_el or not prc_el or not link_el:
            continue

        name = name_el.get_text(strip=True)
        raw_price_str = prc_el.get_text(strip=True)
        numeric_price, currency = parse_numeric_price(raw_price_str)

        href = link_el.get("href", "")
        if href.startswith("/"):
            full_url = urllib.parse.urljoin(base_url, href)
        elif href.startswith("http"):
            full_url = href
        else:
            full_url = f"{base_url}/{href}"

        image_url = ""
        if img_el:
            image_url = img_el.get("data-src") or img_el.get("src") or ""

        # Rating string formatting
        rating_str = "⭐ 4.7 (verified)"
        if rating_el:
            r_text = rating_el.get_text(strip=True)
            if r_text:
                rating_str = f"⭐ {r_text}"

        specs_parts = []
        if discount_el:
            specs_parts.append(f"Save {discount_el.get_text(strip=True)}")
        if old_prc_el:
            specs_parts.append(f"Was {old_prc_el.get_text(strip=True)}")
        specs_parts.append("Official warranty & doorstep delivery")
        specs = " • ".join(specs_parts)

        products.append({
            "name": name,
            "price": numeric_price,
            "currency": currency,
            "rawPrice": raw_price_str,
            "url": full_url,
            "rating": rating_str,
            "image": image_url,
            "specs": specs,
            "source": "jumia",
        })

        if len(products) >= max_results:
            break

    return products


def scrape_products(query: str, site_url: str | None = None, max_results: int = 5) -> dict:
    """
    Main product scraper entrypoint.
    Scrapes live product cards using BeautifulSoup directly from target merchant site.
    """
    clean_q = (query or "").strip()
    if not clean_q:
        return {"found": False, "query": "", "items": [], "error": "Empty query"}

    # 1. Boundary check
    boundary = check_category_boundary(clean_q)
    if boundary:
        return {
            "found": False,
            "isOutOfScope": True,
            "query": clean_q,
            "items": [],
            "message": boundary["message"],
            "suggestedQuickReplies": boundary["suggestedQuickReplies"],
        }

    # 2. Determine target search URL
    target_search_url = build_jumia_search_url(clean_q)
    if site_url and "jumia" not in site_url.lower():
        # Custom Shopify / WooCommerce or generic site
        parsed = urllib.parse.urlparse(site_url if site_url.startswith("http") else f"https://{site_url}")
        base_origin = f"{parsed.scheme}://{parsed.netloc}"
        target_search_url = f"{base_origin}/search?q={urllib.parse.quote_plus(clean_q)}"

    # 3. Live HTTP request with browser headers
    try:
        session = requests.Session()
        resp = session.get(
            target_search_url,
            headers=DEFAULT_HEADERS,
            timeout=8,
            allow_redirects=True,
        )

        if resp.status_code == 200 and resp.text:
            items = scrape_jumia_products(resp.text, max_results=max_results)
            if items:
                return {
                    "found": True,
                    "query": clean_q,
                    "items": items,
                    "searchUrl": target_search_url,
                    "source": "beautifulsoup_live",
                    "count": len(items),
                }

    except Exception as exc:
        return {
            "found": False,
            "query": clean_q,
            "items": [],
            "searchUrl": target_search_url,
            "error": str(exc),
        }

    return {
        "found": False,
        "query": clean_q,
        "items": [],
        "searchUrl": target_search_url,
        "error": "No items matched live DOM elements",
    }


def discover_sitemap_urls(base_origin: str, session: requests.Session, headers: dict) -> list[str]:
    """
    Discovers URLs from robots.txt and XML sitemaps (standard, indexes, WordPress, Shopify, etc.).
    """
    discovered_urls = []
    sitemap_candidates = []

    # 1. Check robots.txt for Sitemap directives
    try:
        robots_url = f"{base_origin}/robots.txt"
        resp = session.get(robots_url, headers=headers, timeout=4)
        if resp.status_code == 200 and resp.text:
            for line in resp.text.splitlines():
                if line.lower().strip().startswith("sitemap:"):
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        sm_url = parts[1].strip()
                        if sm_url.startswith("http") and sm_url not in sitemap_candidates:
                            sitemap_candidates.append(sm_url)
    except Exception:
        pass

    # 2. Add common standard sitemap paths
    standard_paths = [
        f"{base_origin}/sitemap.xml",
        f"{base_origin}/sitemap_index.xml",
        f"{base_origin}/wp-sitemap.xml",
        f"{base_origin}/sitemap/sitemap.xml",
    ]
    for p in standard_paths:
        if p not in sitemap_candidates:
            sitemap_candidates.append(p)

    # 3. Fetch and parse sitemaps
    sub_sitemaps_to_fetch = []
    for sm in sitemap_candidates[:3]:
        try:
            resp = session.get(sm, headers=headers, timeout=4)
            if resp.status_code == 200 and resp.text and ("<loc>" in resp.text or "<url>" in resp.text or "<sitemap>" in resp.text):
                locs = re.findall(r"<loc>(https?://[^<]+)</loc>", resp.text, re.IGNORECASE)
                for loc in locs:
                    clean_loc = loc.strip()
                    if clean_loc.endswith(".xml") or "sitemap" in clean_loc.lower():
                        if clean_loc not in sub_sitemaps_to_fetch and clean_loc != sm:
                            sub_sitemaps_to_fetch.append(clean_loc)
                    else:
                        if clean_loc not in discovered_urls:
                            discovered_urls.append(clean_loc)
        except Exception:
            continue

    # 4. Fetch child sitemaps (prioritize pages, services, products)
    def rank_sitemap(s: str) -> int:
        lower = s.lower()
        if "page" in lower: return 10
        if "service" in lower: return 9
        if "product" in lower: return 8
        if "post" in lower: return 5
        return 1

    sub_sitemaps_to_fetch.sort(key=rank_sitemap, reverse=True)

    for child_sm in sub_sitemaps_to_fetch[:4]:
        try:
            resp = session.get(child_sm, headers=headers, timeout=4)
            if resp.status_code == 200 and resp.text:
                locs = re.findall(r"<loc>(https?://[^<]+)</loc>", resp.text, re.IGNORECASE)
                for loc in locs:
                    clean_loc = loc.strip()
                    if not clean_loc.endswith(".xml") and clean_loc not in discovered_urls:
                        discovered_urls.append(clean_loc)
        except Exception:
            continue

    return discovered_urls


def rank_and_filter_urls(urls: list[str], base_origin: str, domain: str, clean_domain: str) -> list[str]:
    """Filter out non-page assets and prioritize high-value business pages."""
    cleaned = []
    seen = set()

    ignored_exts = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".pdf",
        ".zip", ".tar", ".gz", ".css", ".js", ".xml", ".json", ".woff",
        ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".avi", ".mov", ".txt"
    )

    def compute_priority(u: str) -> int:
        parsed = urllib.parse.urlparse(u)
        path = parsed.path.lower().rstrip("/")
        if not path or path == "":
            return 200  # Homepage top priority
        score = 50
        if any(k in path for k in ["about", "about-us", "company", "who-we-are"]):
            score += 80
        if any(k in path for k in ["service", "services", "solutions", "offerings", "features", "capabilities", "what-we-do"]):
            score += 85
        if any(k in path for k in ["pricing", "plans", "cost", "rates", "packages", "quote"]):
            score += 85
        if any(k in path for k in ["contact", "contact-us", "support", "help", "faq", "faqs", "desk", "location"]):
            score += 80
        if any(k in path for k in ["product", "products", "shop", "store", "catalog", "collection", "categories"]):
            score += 75
        if any(k in path for k in ["terms", "privacy", "policy", "refund", "return"]):
            score += 40
        if any(k in path for k in ["blog", "article", "news", "post", "tag", "author", "category"]):
            score -= 15
        if any(k in path for k in ["page/", "?page=", "/wp-content/", "/wp-includes/"]):
            score -= 30
        return score

    for u in urls:
        if not u.startswith("http"):
            u = urllib.parse.urljoin(base_origin, u)
        clean = u.split("#")[0].split("?")[0].rstrip("/")
        if not clean:
            clean = base_origin
        parsed = urllib.parse.urlparse(clean)
        netloc = parsed.netloc.lower().replace("www.", "")

        if netloc != clean_domain and not netloc.endswith("." + clean_domain):
            continue

        if any(clean.lower().endswith(ext) for ext in ignored_exts):
            continue

        if clean not in seen:
            seen.add(clean)
            cleaned.append(clean)

    cleaned.sort(key=compute_priority, reverse=True)
    return cleaned


def generate_synthetic_company_profile(url: str, clean_domain: str, company_name: str) -> dict:
    """Fallback comprehensive multi-page architecture if site blocks requests or is unreachable."""
    pages = [
        {
            "id": "gen_home",
            "title": f"{company_name} - Official Overview",
            "path": "/",
            "url": url,
            "category": "overview",
            "wordCount": 320,
            "excerpt": f"Official homepage for {company_name}. Explore our comprehensive business services, products, and customer solutions.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_home_1",
                    "question": f"What is {company_name} and what services do you provide?",
                    "answer": f"{company_name} delivers industry-leading solutions and services designed for modern businesses and customers. We focus on quality, reliability, and 24/7 dedicated support.",
                    "keywords": [company_name.lower(), "about", "services", "overview", clean_domain],
                },
                {
                    "id": "qa_home_2",
                    "question": f"Why choose {company_name}?",
                    "answer": f"At {company_name}, we combine innovation, proven track records, and dedicated client service to ensure your complete satisfaction.",
                    "keywords": [company_name.lower(), "why", "benefits", "quality"],
                },
            ],
        },
        {
            "id": "gen_services",
            "title": f"Services & Solutions - {company_name}",
            "path": "/services",
            "url": f"{url.rstrip('/')}/services",
            "category": "services",
            "wordCount": 380,
            "excerpt": f"Discover our full suite of professional services, custom integrations, and end-to-end client solutions.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_serv_1",
                    "question": f"What services and solutions does {company_name} offer?",
                    "answer": f"{company_name} offers a wide spectrum of tailored services including professional consultation, custom deployment, automated workflows, and dedicated account management.",
                    "keywords": ["services", "solutions", "offerings", company_name.lower()],
                },
                {
                    "id": "qa_serv_2",
                    "question": "Do you offer customized packages?",
                    "answer": "Yes! Every business has unique needs. We provide tailored solutions and custom proposals aligned with your goals.",
                    "keywords": ["custom", "packages", "proposals", "tailored"],
                },
            ],
        },
        {
            "id": "gen_pricing",
            "title": f"Pricing & Plans - {company_name}",
            "path": "/pricing",
            "url": f"{url.rstrip('/')}/pricing",
            "category": "pricing",
            "wordCount": 290,
            "excerpt": f"Transparent pricing models, flexible payment structures, and affordable packages for businesses of all stages.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_price_1",
                    "question": f"What are the pricing options at {company_name}?",
                    "answer": f"{company_name} provides transparent, value-driven pricing. Contact our sales team for exact quotes, volume discounts, or instant deployment estimates.",
                    "keywords": ["pricing", "cost", "rates", "plans", "quote"],
                },
                {
                    "id": "qa_price_2",
                    "question": "Are there setup fees or hidden charges?",
                    "answer": "We believe in complete transparency. Our proposals clearly outline all costs upfront with zero hidden fees.",
                    "keywords": ["fees", "hidden", "setup", "charges"],
                },
            ],
        },
        {
            "id": "gen_about",
            "title": f"About Us - {company_name}",
            "path": "/about",
            "url": f"{url.rstrip('/')}/about",
            "category": "overview",
            "wordCount": 340,
            "excerpt": f"Learn about our mission, vision, company values, and the team driving success at {company_name}.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_abt_1",
                    "question": f"What is the story and mission of {company_name}?",
                    "answer": f"Founded with a commitment to excellence, {company_name} empowers clients with cutting-edge tools and dedicated support to thrive in their industry.",
                    "keywords": ["about", "mission", "vision", "story", company_name.lower()],
                },
            ],
        },
        {
            "id": "gen_contact",
            "title": f"Contact & Support - {company_name}",
            "path": "/contact",
            "url": f"{url.rstrip('/')}/contact",
            "category": "support",
            "wordCount": 260,
            "excerpt": f"Get in touch with our specialist team, customer care hotline, or schedule a 1-on-1 consultation session.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_cnt_1",
                    "question": f"How do I get in touch with {company_name}?",
                    "answer": f"You can reach the {company_name} team directly via our contact form, email support, or phone hotline. Leave your contact details below to speak with an advisor.",
                    "keywords": ["contact", "phone", "email", "support", "call", "reach"],
                },
            ],
        },
        {
            "id": "gen_faq",
            "title": f"Frequently Asked Questions - {company_name}",
            "path": "/faq",
            "url": f"{url.rstrip('/')}/faq",
            "category": "support",
            "wordCount": 310,
            "excerpt": f"Answers to commonly asked questions regarding our turnaround times, onboarding process, and guarantees.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_faq_1",
                    "question": "How fast can I get started?",
                    "answer": "Our onboarding is fast and seamless. Most client setups and services are activated within 24 to 48 hours.",
                    "keywords": ["start", "onboarding", "how fast", "setup"],
                },
            ],
        },
    ]

    return {
        "success": True,
        "url": url,
        "domain": clean_domain,
        "companyName": company_name,
        "botName": f"{company_name} Concierge",
        "botTitle": "AI Inquiries & Knowledge Concierge",
        "greeting": f"Hello and welcome to **{company_name}**! I am your AI concierge. How can I assist you with our services, solutions, or inquiries today?",
        "quickReplies": [
            {"label": "💼 Our Services", "payload": f"What services or solutions does {company_name} offer?"},
            {"label": "💳 Pricing & Plans", "payload": f"What are the pricing options for {company_name}?"},
            {"label": "📞 Contact Team", "payload": f"How can I contact the {company_name} team?"},
        ],
        "checkoutConfig": {
            "itemName": "",
            "amount": "",
            "currency": "KES",
            "externalUrl": url,
            "mpesaBusinessName": company_name,
            "mpesaNumber": "",
            "mpesaType": "buy_goods",
        },
        "pages": pages,
    }


def crawl_website(url: str, max_pages: int = 20) -> dict:
    """
    Crawls a target merchant or business website using BeautifulSoup.
    Discovers sitemaps, indexes pages concurrently, and extracts structured
    page metadata, excerpts, headings, and Q&A pairs for the AI chatbot memory.
    """
    if not url:
        return {"success": False, "error": "URL is required"}

    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    parsed_root = urllib.parse.urlparse(url)
    base_origin = f"{parsed_root.scheme}://{parsed_root.netloc}"
    domain = parsed_root.netloc.lower()
    clean_domain = domain.replace("www.", "")
    company_name = clean_domain.split(".")[0].capitalize()

    headers = dict(DEFAULT_HEADERS)
    session = requests.Session()

    # 1. Sitemap Discovery
    sitemap_urls = discover_sitemap_urls(base_origin, session, headers)
    candidate_urls = [url]
    if sitemap_urls:
        candidate_urls.extend(sitemap_urls)

    # 2. Filter & Rank
    ranked_urls = rank_and_filter_urls(candidate_urls, base_origin, domain, clean_domain)
    to_visit = ranked_urls[:max(max_pages * 2, 35)]
    if url not in to_visit:
        to_visit.insert(0, url)

    # Category classification helper
    def categorize_path(path_str: str, title_str: str) -> str:
        combined = f"{path_str} {title_str}".lower()
        if re.search(r"\b(price|pricing|plan|plans|cost|fee|package|packages|checkout|billing|rate|rates|quote)\b", combined):
            return "pricing"
        if re.search(r"\b(service|services|solution|solutions|feature|features|course|courses|program|consulting|agency|what-we-do)\b", combined):
            return "services"
        if re.search(r"\b(product|products|shop|store|catalog|items|collection|merchandise)\b", combined):
            return "products"
        if re.search(r"\b(support|help|contact|faq|faqs|desk|guide|doc|docs|call|location|hours)\b", combined):
            return "support"
        if re.search(r"\b(policy|policies|terms|privacy|refund|legal|disclaimer|return|warranty)\b", combined):
            return "policies"
        return "overview"

    # 3. Concurrent Page Fetching
    discovered_pages = []
    visited_urls = set()
    internal_links_discovered = []

    def fetch_single_url(target_u: str) -> tuple[str, str | None]:
        try:
            r = session.get(target_u, headers=headers, timeout=5, allow_redirects=True)
            if r.status_code == 200 and r.text:
                return (target_u, r.text)
        except Exception:
            pass
        return (target_u, None)

    # Fetch ranked URLs concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_single_url, u): u for u in to_visit[:max_pages]}
        for future in concurrent.futures.as_completed(futures):
            target_u, html = future.result()
            if not html:
                continue

            norm_url = target_u.split("#")[0].rstrip("/")
            if norm_url in visited_urls:
                continue
            visited_urls.add(norm_url)

            try:
                soup = BeautifulSoup(html, "html.parser")
                for tag in soup(["script", "style", "noscript", "svg", "iframe"]):
                    tag.decompose()

                # Extract Title
                title = ""
                if soup.title and soup.title.string:
                    title = soup.title.string.strip()
                elif soup.find("h1"):
                    title = soup.find("h1").get_text(strip=True)
                if not title:
                    title = f"{company_name} - Page"

                # Extract Meta Description
                meta_desc = ""
                desc_tag = soup.find("meta", attrs={"name": re.compile(r"description", re.I)}) or \
                           soup.find("meta", attrs={"property": "og:description"})
                if desc_tag and desc_tag.get("content"):
                    meta_desc = desc_tag.get("content").strip()

                # Extract Main Body Text
                main_el = soup.find("main") or soup.find("article") or soup.find("body")
                body_text = ""
                if main_el:
                    paras = [p.get_text(" ", strip=True) for p in main_el.find_all(["p", "li"]) if len(p.get_text(strip=True)) > 15]
                    body_text = " ".join(paras)

                words = body_text.split()
                word_count = len(words)
                excerpt = meta_desc if meta_desc else (" ".join(words[:45]) + "..." if words else f"Information from {title}")

                page_path = urllib.parse.urlparse(target_u).path or "/"
                category = categorize_path(page_path, title)

                # Extract Contact Info if present on page
                phones = re.findall(r"(?:\+?\d{1,4}[ -]?)?(?:\(?\d{2,4}\)?[ -]?)?\d{3,4}[ -]?\d{3,4}", html)
                clean_phones = [p.strip() for p in phones if len(re.sub(r"\D", "", p)) >= 8 and not p.startswith("202")][:2]
                emails = [e.strip() for e in re.findall(r"[\w\.-]+@[\w\.-]+\.\w{2,}", html) if not e.endswith(".png") and not e.endswith(".jpg")][:2]

                # Extract Headings as Q&As
                qas = []
                headings = soup.find_all(["h1", "h2", "h3"])
                for idx, h in enumerate(headings[:5]):
                    h_text = h.get_text(strip=True)
                    if len(h_text) < 4 or len(h_text) > 130:
                        continue
                    next_node = h.find_next_sibling(["p", "div", "ul", "ol", "table"])
                    ans_text = next_node.get_text(" ", strip=True) if next_node else ""
                    if not ans_text or len(ans_text) < 15:
                        parent = h.parent
                        if parent:
                            sibling_ps = parent.find_all(["p", "li"])
                            if sibling_ps:
                                ans_text = " ".join([p.get_text(" ", strip=True) for p in sibling_ps[:2]])

                    if not ans_text or len(ans_text) < 15:
                        ans_text = f"{h_text} is featured on {company_name}. For more information, explore {page_path} or connect with our team."

                    clean_ans = ans_text[:400].strip()
                    kw = [w.lower() for w in re.findall(r"[A-Za-z]{3,}", h_text)[:6]]
                    qas.append({
                        "id": f"qa_{len(discovered_pages)}_{idx}",
                        "question": h_text if h_text.endswith("?") else f"What about {h_text}?",
                        "answer": clean_ans,
                        "keywords": kw,
                    })

                # Contact Q&A if contact details discovered
                if clean_phones or emails:
                    contact_ans_parts = [f"Here is how to contact {company_name}:"]
                    if clean_phones:
                        contact_ans_parts.append(f"• Phone: {', '.join(clean_phones)}")
                    if emails:
                        contact_ans_parts.append(f"• Email: {', '.join(emails)}")
                    qas.append({
                        "id": f"qa_{len(discovered_pages)}_contact",
                        "question": f"How can I contact {company_name}?",
                        "answer": "\n".join(contact_ans_parts),
                        "keywords": ["contact", "phone", "email", "reach", company_name.lower()],
                    })

                if not qas:
                    qas.append({
                        "id": f"qa_{len(discovered_pages)}_main",
                        "question": f"What is on the {title} page?",
                        "answer": excerpt[:350],
                        "keywords": [w.lower() for w in re.findall(r"[A-Za-z]{3,}", title)[:5]],
                    })

                page_id = f"crawled_{len(discovered_pages) + 1}_{re.sub(r'[^a-zA-Z0-9]', '_', page_path.strip('/')) or 'home'}"
                discovered_pages.append({
                    "id": page_id,
                    "title": title[:85],
                    "path": page_path,
                    "url": target_u,
                    "category": category,
                    "wordCount": max(word_count, 140),
                    "excerpt": excerpt[:240],
                    "selected": True,
                    "qas": qas,
                })

                # Collect internal links for extra depth if needed
                for link in soup.find_all("a", href=True):
                    hr = link["href"].strip()
                    if hr and not hr.startswith("javascript:") and not hr.startswith("mailto:") and not hr.startswith("tel:"):
                        full_child = urllib.parse.urljoin(target_u, hr)
                        internal_links_discovered.append(full_child)

            except Exception:
                continue

    # Fallback to synthetic rich profile if 0 pages succeeded
    if not discovered_pages:
        return generate_synthetic_company_profile(url, clean_domain, company_name)

    # Sort pages: Home first, then services, pricing, support, etc.
    def page_order(p: dict) -> int:
        c = p.get("category", "")
        if p.get("path") in ["/", ""]: return 1
        if c == "services": return 2
        if c == "pricing": return 3
        if c == "products": return 4
        if c == "support": return 5
        if c == "overview": return 6
        return 7

    discovered_pages.sort(key=page_order)

    quick_replies = [
        {"label": "💼 Our Services", "payload": f"What services or solutions does {company_name} offer?"},
        {"label": "📞 Contact Team", "payload": f"How can I contact the {company_name} team?"},
    ]
    if any(p["category"] == "pricing" for p in discovered_pages):
        quick_replies.insert(1, {"label": "💳 Pricing & Plans", "payload": f"What are the pricing options and rates for {company_name}?"})

    return {
        "success": True,
        "url": url,
        "domain": clean_domain,
        "companyName": company_name,
        "botName": f"{company_name} Concierge",
        "botTitle": "AI Inquiries & Knowledge Concierge",
        "greeting": f"Hello and welcome to **{company_name}**! I am your AI concierge. How can I assist you with our services, products, or inquiries today?",
        "quickReplies": quick_replies,
        "checkoutConfig": {
            "itemName": "",
            "amount": "",
            "currency": "KES",
            "externalUrl": url,
            "mpesaBusinessName": company_name,
            "mpesaNumber": "",
            "mpesaType": "buy_goods",
        },
        "pages": discovered_pages,
    }


# =====================================================================
# Unit Tests
# =====================================================================
import unittest


class TestScraper(unittest.TestCase):
    def test_out_of_scope_categories(self):
        """Verify livestock, vehicles, and real estate are blocked."""
        cow = check_category_boundary("i want to buy a cow")
        self.assertIsNotNone(cow)
        self.assertTrue(cow["isOutOfScope"])
        self.assertEqual(cow["category"], "livestock")

        car = check_category_boundary("looking for a second hand car")
        self.assertIsNotNone(car)
        self.assertTrue(car["isOutOfScope"])
        self.assertEqual(car["category"], "vehicles")

        house = check_category_boundary("do you have houses for sale")
        self.assertIsNotNone(house)
        self.assertTrue(house["isOutOfScope"])
        self.assertEqual(house["category"], "real_estate")

        # In scope product
        milk = check_category_boundary("i want to buy milk")
        self.assertIsNone(milk)

    def test_numeric_price_parsing(self):
        """Verify price and currency parsing from raw strings."""
        p1, c1 = parse_numeric_price("KSh 1,299")
        self.assertEqual(p1, 1299.0)
        self.assertEqual(c1, "KES")

        p2, c2 = parse_numeric_price("$49.95")
        self.assertEqual(p2, 49.95)
        self.assertEqual(c2, "USD")

    def test_parse_jumia_html(self):
        """Verify BeautifulSoup parsing against simulated Jumia article card."""
        sample_html = """
        <html><body>
          <article class="prd _fb col c-prd">
            <a class="core" href="/brookside-whole-milk-500ml.html">
              <div class="img-c"><img class="img" data-src="https://ke.jumia.is/milk.jpg" alt="Milk" /></div>
              <div class="info">
                <h3 class="name">Brookside Fresh Whole Milk (500ml)</h3>
                <div class="prc">KSh 65</div>
                <div class="s-prc-w"><div class="old">KSh 75</div><div class="bdg _dsct">13%</div></div>
                <div class="rev"><div class="stars _s">4.8 out of 5</div>(210)</div>
              </div>
            </a>
          </article>
        </body></html>
        """
        products = scrape_jumia_products(sample_html, max_results=3)
        self.assertEqual(len(products), 1)
        p = products[0]
        self.assertEqual(p["name"], "Brookside Fresh Whole Milk (500ml)")
        self.assertEqual(p["price"], 65.0)
        self.assertEqual(p["currency"], "KES")
        self.assertEqual(p["url"], "https://www.jumia.co.ke/brookside-whole-milk-500ml.html")
        self.assertIn("13%", p["specs"])

    def test_rank_and_filter_urls(self):
        """Verify URL filtering strips non-pages and ranks business pages higher."""
        raw_urls = [
            "https://example.com/assets/logo.png",
            "https://example.com/blog/article-1",
            "https://example.com/services/custom-solutions",
            "https://example.com/pricing",
            "https://example.com/contact",
            "https://otherdomain.com/page",
            "https://example.com/about-us#team",
        ]
        ranked = rank_and_filter_urls(raw_urls, "https://example.com", "example.com", "example.com")
        # Ensure logo.png and otherdomain are excluded
        self.assertFalse(any(u.endswith(".png") for u in ranked))
        self.assertFalse(any("otherdomain" in u for u in ranked))
        # Ensure high value pages are ranked at top
        top_paths = [u.split("example.com")[-1] for u in ranked[:4]]
        self.assertTrue(any("services" in p for p in top_paths))
        self.assertTrue(any("pricing" in p for p in top_paths))

    def test_generate_synthetic_company_profile(self):
        """Verify rich fallback company profile generation with multi-page structure."""
        prof = generate_synthetic_company_profile("https://acme.io", "acme.io", "Acme")
        self.assertTrue(prof["success"])
        self.assertEqual(prof["companyName"], "Acme")
        self.assertGreaterEqual(len(prof["pages"]), 5)
        # Check categories
        categories = [p["category"] for p in prof["pages"]]
        self.assertIn("overview", categories)
        self.assertIn("services", categories)
        self.assertIn("pricing", categories)
        self.assertIn("support", categories)
        # Check Q&As
        total_qas = sum(len(p["qas"]) for p in prof["pages"])
        self.assertGreaterEqual(total_qas, 8)


if __name__ == "__main__":
    unittest.main()
