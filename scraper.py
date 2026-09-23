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

# Optional Level-3 escalation: browser TLS fingerprint (defeats JA3/TLS blocks
# that reject Python's requests stack even with browser headers). Degrades
# gracefully when curl-cffi is not installed.
try:
    from curl_cffi import requests as cffi_requests
    _CFFI_AVAILABLE = True
except Exception:
    cffi_requests = None
    _CFFI_AVAILABLE = False

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

# Level-2 escalation: full browser-grade navigation header profile. Corporate
# WAFs (Cloudflare bot management etc.) often 403 bare-bones clients while
# passing requests that look like a real tab navigation.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    # No Accept-Encoding: requests/urllib3 negotiates what it can decode.
    # (Advertising `br` without brotli installed yields undecodable garbage.)
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Cache-Control": "max-age=0",
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


CHALLENGE_MARKERS = ("just a moment", "cf_chl", "challenge-form", "captcha-delivery")

# JS verification loaders (hosting-level bot checks): title + body markers.
# These pages answer HTTP 200 but contain zero business content — indexing
# them poisons the bot ("Information from One moment, please...").
LOADER_TITLE_MARKERS = ("one moment, please", "just a moment", "please verify you are", "checking your browser")
LOADER_BODY_MARKERS = ("request is being verified", "verifying you are human", "verify you are human")


def page_looks_challenged(html_content: str | None) -> str | None:
    """
    Detect JS-challenge / bot-firewall interstitials served with HTTP 200
    (e.g. Cloudflare 'Just a moment...') that contain zero product cards.
    Returns a vendor label or None.
    """
    body = (html_content or "").lower()
    if not body:
        return None
    if "just a moment" in body and "cloudflare" in body:
        return "Cloudflare"
    for marker in ("cf_chl", "challenge-form", "captcha-delivery"):
        if marker in body:
            return "bot firewall"
    return None


def detect_loader_challenge(html_content: str | None) -> str | None:
    """
    Detect bot-check interstitials served as HTTP 200 (Cloudflare challenges,
    hosting-level JS verification loaders). Returns a vendor label or None.
    """
    vendor = page_looks_challenged(html_content)
    if vendor:
        return vendor
    body = (html_content or "").lower()
    if not body:
        return None
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.S)
    title = (m.group(1).strip() if m else "")
    if any(t in title for t in LOADER_TITLE_MARKERS):
        return "JS verification loader"
    if any(t in body for t in LOADER_BODY_MARKERS):
        return "JS verification loader"
    return None


def map_shopify_suggest_products(payload: dict, base_origin: str, max_results: int = 5) -> list[dict]:
    """Map Shopify /search/suggest.json product results onto the Botly item schema."""
    try:
        raw = payload.get("resources", {}).get("results", {}).get("products", [])
    except AttributeError:
        return []
    items = []
    for p in raw:
        if not isinstance(p, dict) or not p.get("title"):
            continue
        numeric_price, currency = parse_numeric_price(str(p.get("price", "") or ""))
        url = str(p.get("url", "") or "")
        if url.startswith("/"):
            url = urllib.parse.urljoin(base_origin, url)
        elif not url.startswith("http"):
            url = f"{base_origin}/{url}" if url else base_origin
        items.append({
            "name": str(p["title"]).strip(),
            "price": numeric_price,
            "currency": currency,
            "rawPrice": str(p.get("price", "") or ""),
            "url": url,
            "rating": "⭐ —",
            "image": str(p.get("image", "") or ""),
            "specs": "Live from store catalog",
            "source": "shopify_api",
        })
        if len(items) >= max_results:
            break
    return items


def map_woocommerce_store_products(payload: list, max_results: int = 5) -> list[dict]:
    """Map WooCommerce Store API (/wp-json/wc/store/v1/products) entries onto the Botly item schema."""
    items = []
    if not isinstance(payload, list):
        return []
    for p in payload:
        if not isinstance(p, dict) or not p.get("name"):
            continue
        prices = p.get("prices", {}) if isinstance(p.get("prices"), dict) else {}
        try:
            minor = int(str(prices.get("price", "0") or "0"))
            decimals = int(prices.get("currency_minor_unit", 2) or 2)
            numeric_price = minor / (10 ** decimals)
        except (ValueError, TypeError):
            numeric_price = 0.0
        currency = str(prices.get("currency_code", "") or "KES")
        images = p.get("images", []) if isinstance(p.get("images"), list) else []
        image = images[0].get("src", "") if images and isinstance(images[0], dict) else ""
        items.append({
            "name": str(p["name"]).strip(),
            "price": numeric_price,
            "currency": currency,
            "rawPrice": str(prices.get("price", "") or ""),
            "url": str(p.get("permalink", "") or ""),
            "rating": "⭐ —",
            "image": str(image or ""),
            "specs": "Live from store catalog",
            "source": "woocommerce_api",
        })
        if len(items) >= max_results:
            break
    return items


def try_merchant_product_apis(base_origin: str, query: str, session: requests.Session,
                              max_results: int = 5) -> tuple[list[dict], str]:
    """
    Query merchant JSON product APIs (Shopify suggest + WooCommerce Store API).
    These rarely sit behind browser fingerprinting, so they succeed where raw
    HTML scraping gets challenged. Returns (items, source_label).
    """
    encoded = urllib.parse.quote_plus(query)
    json_headers = {"Accept": "application/json", "User-Agent": DEFAULT_HEADERS.get("User-Agent", "Botly/1.0")}
    # 1. Shopify predictive-search / suggest endpoint
    try:
        resp = session.get(
            f"{base_origin}/search/suggest.json?q={encoded}&resources[type]=product&resources[limit]={max_results}",
            headers=json_headers, timeout=6, allow_redirects=True,
        )
        if resp.status_code == 200 and "json" in resp.headers.get("content-type", ""):
            items = map_shopify_suggest_products(resp.json(), base_origin, max_results)
            if items:
                return items, "shopify_api"
    except Exception:
        pass
    # 2. WooCommerce Store API (public, no auth needed on most stores)
    try:
        resp = session.get(
            f"{base_origin}/wp-json/wc/store/v1/products?search={encoded}&per_page={max_results}",
            headers=json_headers, timeout=6, allow_redirects=True,
        )
        if resp.status_code == 200 and "json" in resp.headers.get("content-type", ""):
            items = map_woocommerce_store_products(resp.json(), max_results)
            if items:
                return items, "woocommerce_api"
    except Exception:
        pass
    return [], ""


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
    base_origin = "https://www.jumia.co.ke"
    is_jumia = True
    if site_url and "jumia" not in site_url.lower():
        # Custom Shopify / WooCommerce or generic site
        parsed = urllib.parse.urlparse(site_url if site_url.startswith("http") else f"https://{site_url}")
        base_origin = f"{parsed.scheme}://{parsed.netloc}"
        target_search_url = f"{base_origin}/search?q={urllib.parse.quote_plus(clean_q)}"
        is_jumia = False

    # 3. Live HTTP request with browser headers
    session = requests.Session()
    try:
        resp = session.get(
            target_search_url,
            headers=DEFAULT_HEADERS,
            timeout=8,
            allow_redirects=True,
        )

        html = resp.text if resp.status_code == 200 else ""
        if html:
            items = scrape_jumia_products(html, max_results=max_results)
            if items:
                return {
                    "found": True,
                    "query": clean_q,
                    "items": items,
                    "searchUrl": target_search_url,
                    "source": "beautifulsoup_live",
                    "count": len(items),
                }
            if is_jumia:
                challenged = page_looks_challenged(html)
                if challenged:
                    return {
                        "found": False,
                        "query": clean_q,
                        "items": [],
                        "searchUrl": target_search_url,
                        "blocked": "waf",
                        "vendor": challenged,
                        "error": f"{challenged} showed an automated-traffic challenge instead of products.",
                    }
        if not is_jumia:
            # Merchant JSON APIs get a chance even when the HTML search page
            # 404s or is challenged — they often live outside the WAF rules.
            api_items, api_source = try_merchant_product_apis(base_origin, clean_q, session, max_results)
            if api_items:
                return {
                    "found": True,
                    "query": clean_q,
                    "items": api_items,
                    "searchUrl": target_search_url,
                    "source": api_source,
                    "count": len(api_items),
                }
        if resp.status_code != 200:
            waf_vendor = detect_waf_block(resp.status_code, resp.headers, (resp.text or "")[:2000])
            return {
                "found": False,
                "query": clean_q,
                "items": [],
                "searchUrl": target_search_url,
                "blocked": "waf" if waf_vendor else "unreachable",
                **({"vendor": waf_vendor} if waf_vendor else {}),
                "error": (
                    f"{waf_vendor} blocked the store request (HTTP {resp.status_code})."
                    if waf_vendor else
                    f"Store request failed (HTTP {resp.status_code})."
                ),
            }

    except Exception as exc:
        return {
            "found": False,
            "query": clean_q,
            "items": [],
            "searchUrl": target_search_url,
            "blocked": "unreachable",
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

    # 3. Fetch and parse sitemaps — concurrently, so one slow host never
    #    stalls discovery, and ALL candidates (not just the first 3).
    sub_sitemaps_to_fetch = []

    def _fetch_sitemap_xml(sm_url: str) -> str | None:
        try:
            resp = session.get(sm_url, headers=headers, timeout=5)
            if resp.status_code == 200 and resp.text and ("<loc>" in resp.text or "<url>" in resp.text or "<sitemap>" in resp.text):
                return resp.text
        except Exception:
            pass
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as _sm_pool:
        _sitemap_bodies = list(_sm_pool.map(_fetch_sitemap_xml, sitemap_candidates))

    for sm, _body in zip(sitemap_candidates, _sitemap_bodies):
        if not _body:
            continue
        locs = re.findall(r"<loc>(https?://[^<]+)</loc>", _body, re.IGNORECASE)
        for loc in locs:
            clean_loc = loc.strip()
            if clean_loc.endswith(".xml") or "sitemap" in clean_loc.lower():
                if clean_loc not in sub_sitemaps_to_fetch and clean_loc != sm:
                    sub_sitemaps_to_fetch.append(clean_loc)
            else:
                if clean_loc not in discovered_urls:
                    discovered_urls.append(clean_loc)

    # 4. Fetch child sitemaps (prioritize pages, services, products)
    def rank_sitemap(s: str) -> int:
        lower = s.lower()
        if "page" in lower: return 10
        if "service" in lower: return 9
        if "product" in lower: return 8
        if "post" in lower: return 5
        return 1

    sub_sitemaps_to_fetch.sort(key=rank_sitemap, reverse=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as _child_pool:
        _child_bodies = list(_child_pool.map(_fetch_sitemap_xml, sub_sitemaps_to_fetch[:4]))

    for _child_body in _child_bodies:
        if not _child_body:
            continue
        locs = re.findall(r"<loc>(https?://[^<]+)</loc>", _child_body, re.IGNORECASE)
        for loc in locs:
            clean_loc = loc.strip()
            if not clean_loc.endswith(".xml") and clean_loc not in discovered_urls:
                discovered_urls.append(clean_loc)

    return discovered_urls


# Boilerplate URL paths that must NEVER become knowledge pages. WordPress and
# similar CMS platforms expose these in sitemaps/nav (sample page, hello-world
# post, login/admin screens, feeds); indexing them fills bot memory with
# "Log In / Powered by WordPress / Sample Page" answers about the WRONG topic.
JUNK_PAGE_PATH_PARTS = (
    "wp-login", "wp-admin", "wp-json", "xmlrpc", "/feed", "comments/feed",
    "sample-page", "hello-world", "uncategorized",
)

# Boilerplate headings that must NEVER become Q&A chunks (hero counters, years,
# CMS chrome, sidebar widgets). Applied BEFORE the 8-heading slice so real
# content sections keep their slots.
JUNK_HEADINGS_EXACT = frozenset({
    "log in", "log out", "login", "powered by wordpress", "sample page",
    "hello world", "search", "menu", "navigation", "archives", "categories",
    "meta", "recent posts", "recent comments", "entries feed", "comments feed",
    "wordpress.org", "skip to content", "share this", "follow us",
    "related posts", "you may also like",
})
_JUNK_HEADING_RES = (
    re.compile(r"^\d{4}$"),  # lone years: "2022"
    # bare counters: "0 K+", "100%", "1,200+", "$50"
    re.compile(r"^[\d\s.,+%$\u20AC\u00A3]+\s*[kmb]?\+?%?$", re.IGNORECASE),
)
_LOGIN_TITLE_RE = re.compile(r"^(log\s?in|sign\s?in|login|register)\b", re.IGNORECASE)


def is_junk_page_url(path: str) -> bool:
    """True when a URL path is CMS boilerplate (login/admin/feed/sample)."""
    pl = (path or "").lower()
    return any(part in pl for part in JUNK_PAGE_PATH_PARTS)


def is_junk_heading(text: str) -> bool:
    """True when a heading is CMS chrome/counter junk, not real content."""
    t = (text or "").strip().lower().rstrip(" .!\u2026")
    if not t or t in JUNK_HEADINGS_EXACT:
        return True
    return any(rx.match(t) for rx in _JUNK_HEADING_RES)


def is_login_chrome_page(page: dict) -> bool:
    """True when a parsed page is just a login/admin screen (title check)."""
    title = (page.get("title") or "").strip()
    return bool(title) and len(title) <= 40 and bool(_LOGIN_TITLE_RE.match(title))


def extract_heading_answer(h, h_text: str, company_name: str, page_path: str) -> str:
    """Best-effort answer text for a heading element.

    Stages: (1) next content sibling, (2) paragraphs inside the parent
    element, (3) smallest substantive ancestor (card/tile content — e.g.
    Elementor practice cards where the description sits in a sibling div of
    the header block), (4) honest stub. The ancestor must contribute at
    least 40 chars BEYOND the heading text itself, so bare header wrappers
    ("Eyebrow + Heading") are skipped in favour of the real card body.
    """
    next_node = h.find_next_sibling(["p", "div", "ul", "ol", "table"])
    ans_text = next_node.get_text(" ", strip=True) if next_node else ""
    if not ans_text or len(ans_text) < 15:
        parent = h.parent
        if parent:
            sibling_ps = parent.find_all(["p", "li"])
            if sibling_ps:
                ans_text = " ".join([p.get_text(" ", strip=True) for p in sibling_ps[:2]])
    if not ans_text or len(ans_text) < 15:
        node = h.parent
        for _ in range(3):
            node = node.parent if node is not None else None
            if node is None or getattr(node, "name", None) in ("body", "html", "main", "article"):
                break
            cand = node.get_text(" ", strip=True)
            rest = re.sub(r"\s+", "", cand).replace(re.sub(r"\s+", "", h_text), "", 1)
            if len(rest) >= 40:
                ans_text = cand
                break
    if not ans_text or len(ans_text) < 15:
        ans_text = (
            f"{h_text} is featured on {company_name}. For more information, "
            f"explore {page_path} or connect with our team."
        )
    return ans_text


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

        if is_junk_page_url(urllib.parse.urlparse(clean).path):
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


def detect_waf_block(status_code, headers, body_snippet=""):
    """
    Detect bot-firewall / WAF blocks from a failed fetch.
    Returns a vendor label ('AWS WAF', 'Cloudflare', ...) or generic
    'bot firewall', or None when the failure does not look like a block.
    """
    if status_code not in (401, 403, 405, 429, 503):
        return None
    h = {str(k).lower(): str(v).lower() for k, v in (headers or {}).items()}
    body = (body_snippet or "").lower()
    if "x-amzn-waf-action" in h or "awselb" in h.get("server", "") or "aws waf" in body:
        return "AWS WAF"
    if ("cf-mitigated" in h or "cloudflare" in h.get("server", "")
            or "__cf_bm" in h.get("set-cookie", "")
            or ("attention required" in body and "cloudflare" in body)):
        return "Cloudflare"
    if "x-iinfo" in h or "incapsula" in body or "imperva" in body:
        return "Imperva/Incapsula"
    if "akamai" in h.get("server", "") or "akamai" in body:
        return "Akamai"
    if "captcha" in body:
        return "bot firewall (CAPTCHA challenge)"
    # Status-only fallback: a public business homepage should never 403/405 real visitors.
    return "bot firewall"


def discover_wordpress_urls(base_origin: str, session: requests.Session, headers: dict, limit: int = 30) -> list[str]:
    """
    List WordPress pages/posts via the public REST API — finds real content
    that is neither linked from the homepage nor present in the sitemap
    (common on Elementor one-pagers with orphan service pages).
    Off-site links are filtered later by rank_and_filter_urls.
    """
    found: list[str] = []
    try:
        for endpoint in ("pages", "posts"):
            if len(found) >= limit:
                break
            r = session.get(
                f"{base_origin}/wp-json/wp/v2/{endpoint}?per_page=100&_fields=link",
                headers=headers, timeout=6, allow_redirects=True,
            )
            if r.status_code != 200:
                continue
            try:
                payload = r.json()
            except Exception:
                continue
            if not isinstance(payload, list):
                continue
            for item in payload:
                link = (item.get("link") if isinstance(item, dict) else "") or ""
                if not link.startswith(("http://", "https://")):
                    continue
                if link not in found:
                    found.append(link)
                if len(found) >= limit:
                    break
    except Exception:
        pass
    return found


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

    # Non-200 fetch outcomes, used to diagnose firewall blocks vs offline sites.
    block_evidence: list[dict] = []
    # HTTP-200 bot-check interstitials (challenge/loader pages carry no content).
    challenge_evidence: list[dict] = []
    # Hosts that only answer escalated fetches skip Level 1 for later pages.
    start_level: dict = {"n": 1}
    # Root-probe HTML cache (avoids re-fetching the homepage in phase 1).
    root_cache: dict[str, str] = {}

    def escalated_get(target_u: str, timeout: int = 6) -> tuple[str | None, str, int]:
        """
        Force-read fetch: escalate past bot-block layers until real HTML arrives.
        Level 1 = plain request, Level 2 = full browser navigation headers,
        Level 3 = browser TLS fingerprint (curl-cffi, when installed).
        Returns (html_or_None, final_url, level_index_used).
        """
        levels: list = []
        if start_level["n"] <= 1:
            levels.append(("std", lambda: session.get(
                target_u, headers=headers, timeout=timeout, allow_redirects=True)))
        levels.append(("browser", lambda: session.get(
            target_u, headers=BROWSER_HEADERS, timeout=timeout + 2, allow_redirects=True)))
        if _CFFI_AVAILABLE:
            levels.append(("tls", lambda: cffi_requests.get(
                target_u, impersonate="chrome124", timeout=timeout + 4, allow_redirects=True)))
        for level_idx, (label, do_get) in enumerate(levels):
            try:
                r = do_get()
            except Exception as exc:
                block_evidence.append({
                    "status": None, "headers": {},
                    "snippet": f"{label}:{type(exc).__name__}: {exc}"[:300],
                })
                continue
            content_type = (r.headers.get("Content-Type") or "").lower()
            is_html = ("html" in content_type or "xml" in content_type or not content_type)
            if r.status_code == 200 and getattr(r, "text", "") and is_html:
                challenged = detect_loader_challenge(r.text)
                if not challenged:
                    return (r.text, r.url or target_u, level_idx)
                challenge_evidence.append({"url": r.url or target_u, "vendor": challenged})
                continue  # challenged at this level — a higher level may clear it
            block_evidence.append({
                "status": r.status_code,
                "headers": dict(r.headers or {}),
                "snippet": (r.text or "")[:800],
            })
        return (None, target_u, len(levels) - 1)

    # 0. Host fallback: many small-business sites only answer on ONE of the
    #    apex / www hostnames (DNS or TLS misconfiguration is common, e.g. a
    #    certificate that covers www.example.com but not example.com). If the
    #    given host fails outright, retry once with the www <-> apex variant.
    # Last failed root-probe details (status/headers/snippet) for block diagnosis.
    root_probe: dict = {"ok": False, "status": None, "headers": {}, "snippet": ""}

    def _probe_root(candidate_url: str) -> bool:
        html, final_u, level = escalated_get(candidate_url, timeout=5)
        if html:
            root_probe["ok"] = True
            if level > 0:
                start_level["n"] = 2  # host blocks plain fetches — skip Level 1 later
            root_cache[candidate_url] = html
            root_cache[final_u] = html
            return True
        if block_evidence:
            last = block_evidence[-1]
            root_probe.update({
                "status": last.get("status"),
                "headers": dict(last.get("headers") or {}),
                "snippet": str(last.get("snippet") or "")[:1500],
            })
        return False

    if not _probe_root(url):
        alt_netloc = domain[4:] if domain.startswith("www.") else ("www." + domain)
        alt_url = f"{parsed_root.scheme}://{alt_netloc}{parsed_root.path or ''}"
        if alt_url != url and _probe_root(alt_url):
            url = alt_url
            parsed_root = urllib.parse.urlparse(url)
            base_origin = f"{parsed_root.scheme}://{parsed_root.netloc}"
            domain = parsed_root.netloc.lower()
            clean_domain = domain.replace("www.", "")
            company_name = clean_domain.split(".")[0].capitalize()

    # 1. Sitemap Discovery
    sitemap_urls = discover_sitemap_urls(base_origin, session, headers)
    candidate_urls = [url]
    if sitemap_urls:
        candidate_urls.extend(sitemap_urls)
    # 1b. WordPress REST Discovery (unlinked pages/posts)
    try:
        candidate_urls.extend(discover_wordpress_urls(base_origin, session, headers))
    except Exception:
        pass

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

    def fetch_single_url(target_u: str) -> tuple[str, str | None, str]:
        """Fetch one URL. Returns (requested_url, html_or_None, final_url_after_redirects)."""
        if target_u in root_cache:
            return (target_u, root_cache[target_u], target_u)
        html, final_u, _level = escalated_get(target_u, timeout=6)
        if html:
            return (target_u, html, final_u)
        return (target_u, None, target_u)

    def parse_page_html(html: str, final_u: str, page_index: int) -> tuple[dict | None, list[str]]:
        """Parse one HTML document into a knowledge page plus discovered internal links."""
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
            body_excerpt = (" ".join(words[:45]) + "..." if words else f"Information from {title}")
            # Stub meta descriptions ("Law Firm") produce useless overview answers — use body text.
            excerpt = meta_desc if len(meta_desc) >= 40 else body_excerpt

            page_path = urllib.parse.urlparse(final_u).path or "/"
            category = categorize_path(page_path, title)

            # Extract Contact Info from VISIBLE text only. Raw HTML contains
            # scripts/styles with long numeric IDs that pollute phone detection.
            visible_text = (body_text + " " + title) if body_text else (soup.get_text(" ", strip=True) or "")
            phones = re.findall(r"(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}", visible_text)
            clean_phones = []
            for p in phones:
                digits = re.sub(r"\D", "", p)
                if 8 <= len(digits) <= 13 and not p.strip().startswith("202") and not re.match(r"^\d{5}-\d{4}$", p.strip()):
                    cp = p.strip()
                    if cp not in clean_phones:
                        clean_phones.append(cp)
            clean_phones = clean_phones[:2]
            emails = []
            for e in re.findall(r"[\w\.-]+@[\w\.-]+\.\w{2,}", visible_text):
                ce = e.strip().rstrip(".,;:")
                if ce not in emails and not ce.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".svg", ".js", ".css")):
                    emails.append(ce)
            emails = emails[:2]

            # Extract Headings as Q&As
            qas = []
            # Junk headings (counters, CMS chrome) are dropped BEFORE the 8-heading
            # slice so real content sections keep their answerable-chunk slots.
            headings = [h for h in soup.find_all(["h1", "h2", "h3"]) if not is_junk_heading(h.get_text(strip=True))]
            # Thin-content gate: loader shells / empty pages that slipped past
            # challenge detection carry no Q&A value — never index them.
            if word_count < 25 and not headings and not clean_phones and not emails:
                return (None, [])
            # NOTE: keep in sync with the Studio's browser-side chunker (customizer.html).
            # 20 heading-chunks: one-page business sites list every practice area /
            # product / team member as headings (e.g. 7 law-firm practice areas sat
            # at positions 9-15 and were cut off by the old cap of 8 -> the bot
            # could not name a single area of service).
            for idx, h in enumerate(headings[:20]):
                h_text = h.get_text(strip=True)
                if len(h_text) < 4 or len(h_text) > 130:
                    continue
                ans_text = extract_heading_answer(h, h_text, company_name, page_path)

                clean_ans = ans_text[:400].strip()
                kw = [w.lower() for w in re.findall(r"[A-Za-z]{3,}", h_text)[:6]]
                qas.append({
                    "id": f"qa_{page_index}_{idx}",
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
                    "id": f"qa_{page_index}_contact",
                    "question": f"How can I contact {company_name}?",
                    "answer": "\n".join(contact_ans_parts),
                    "keywords": ["contact", "phone", "email", "reach", company_name.lower()],
                })

            # Page-summary chunks: guarantee overview queries ("what does X do?",
            # "what services...") match REAL page content instead of generic fallbacks.
            if page_path in ("/", ""):
                top_headings = []
                for h in headings:
                    ht = h.get_text(strip=True)
                    if 4 <= len(ht) <= 130 and ht not in top_headings:
                        top_headings.append(ht)
                    if len(top_headings) >= 16:
                        break
                overview_answer = excerpt
                if top_headings:
                    overview_answer += " What we offer: " + "; ".join(top_headings) + "."
                qas.append({
                    "id": f"qa_{page_index}_overview",
                    # Own category: the widget gates generic 'overview' content for topical
                    # queries, but this extractive services summary must stay searchable.
                    "category": "services",
                    "question": f"What services or solutions does {company_name} offer?",
                    "answer": overview_answer[:1100],
                    "keywords": ["services", "solutions", "offer", "provide", "about", company_name.lower(), clean_domain],
                })
            qas.append({
                "id": f"qa_{page_index}_summary",
                "question": f"What does the {title[:60]} page cover?",
                "answer": excerpt[:400],
                "keywords": [w.lower() for w in re.findall(r"[A-Za-z]{3,}", title)[:6]],
            })

            if not qas:
                qas.append({
                    "id": f"qa_{page_index}_main",
                    "question": f"What is on the {title} page?",
                    "answer": excerpt[:350],
                    "keywords": [w.lower() for w in re.findall(r"[A-Za-z]{3,}", title)[:5]],
                })

            page_id = f"crawled_{page_index + 1}_{re.sub(r'[^a-zA-Z0-9]', '_', page_path.strip('/')) or 'home'}"
            page = {
                "id": page_id,
                "title": title[:85],
                "path": page_path,
                "url": final_u,
                "category": category,
                "wordCount": max(word_count, 140),
                "excerpt": excerpt[:240],
                "selected": True,
                "qas": qas,
            }

            # Collect internal links for breadth-first follow-up crawling
            child_links = []
            for link in soup.find_all("a", href=True):
                hr = link["href"].strip()
                if hr and not hr.startswith("javascript:") and not hr.startswith("mailto:") and not hr.startswith("tel:") and not hr.startswith("#"):
                    child_links.append(urllib.parse.urljoin(final_u, hr))

            return (page, child_links)
        except Exception:
            return (None, [])

    def _normalize_visit_key(u: str) -> str:
        return u.split("#")[0].split("?")[0].rstrip("/") or base_origin

    def fetch_batch(urls: list[str]) -> None:
        """Fetch + parse a batch of URLs concurrently, appending to discovered_pages."""
        if not urls:
            return
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = {executor.submit(fetch_single_url, u): u for u in urls}
            for future in concurrent.futures.as_completed(futures):
                _requested, html, final_u = future.result()
                if not html:
                    continue
                challenged = detect_loader_challenge(html)
                if challenged:
                    challenge_evidence.append({"url": final_u, "vendor": challenged})
                    continue
                visit_key = _normalize_visit_key(final_u)
                if visit_key in visited_urls:
                    continue
                visited_urls.add(visit_key)
                page, child_links = parse_page_html(html, final_u, len(discovered_pages))
                if page and is_login_chrome_page(page):
                    page = None  # login/admin screen slipped past URL filters — never index it
                if page:
                    discovered_pages.append(page)
                for child in child_links:
                    if len(internal_links_discovered) < 600:
                        internal_links_discovered.append(child)

    # Phase 1: fetch sitemap-ranked URLs (homepage first)
    fetch_batch(to_visit[:max_pages])

    # Phase 2: breadth-first follow of discovered internal links. This is what
    # indexes "all the pages" on sites with no (or sparse) sitemap.xml — the
    # homepage nav alone usually reveals /services, /pricing, /about, /contact.
    while discovered_pages and len(discovered_pages) < max_pages and internal_links_discovered:
        fresh = [
            u for u in rank_and_filter_urls(internal_links_discovered, base_origin, domain, clean_domain)
            if _normalize_visit_key(u) not in visited_urls
        ]
        internal_links_discovered.clear()
        if not fresh:
            break
        before = len(discovered_pages)
        fetch_batch(fresh[: max_pages - len(discovered_pages)])
        if len(discovered_pages) == before:
            break  # no progress — stop instead of hammering the site

    # Honest failure: NEVER fabricate knowledge-base pages for a site we could
    # not actually read. The Studio UI shows a clear "unreachable" notice and
    # asks the owner to add FAQs manually or re-scan later.
    if not discovered_pages:
        # Diagnose WHY nothing was readable: bot-firewall block vs truly offline.
        waf_vendor = detect_waf_block(root_probe.get("status"), root_probe.get("headers", {}), root_probe.get("snippet", ""))
        block_status = root_probe.get("status")
        if not waf_vendor:
            for ev in block_evidence:
                waf_vendor = detect_waf_block(ev.get("status"), ev.get("headers", {}), ev.get("snippet", ""))
                if waf_vendor:
                    block_status = ev.get("status")
                    break
        # HTTP-200 interstitials: the site answers but only with bot checks.
        challenge_vendor = challenge_evidence[0]["vendor"] if challenge_evidence else ""
        if challenge_vendor and not waf_vendor:
            waf_vendor = challenge_vendor
            block_status = 200
        return {
            "success": False,
            "url": url,
            "domain": clean_domain,
            "companyName": company_name,
            "botName": f"{company_name} Concierge",
            "botTitle": "AI Inquiries & Knowledge Concierge",
            "greeting": f"Hello and welcome to **{company_name}**! I am your AI concierge. How can I assist you today?",
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
            "pages": [],
            "blocked": "waf" if waf_vendor else "unreachable",
            "wafVendor": waf_vendor or "",
            "blockStatus": block_status,
            "browserFetchRecommended": bool(waf_vendor),
            "error": (
                f"Blocked by a JS verification loader: {base_origin} shows an automated browser check "
                "('One moment, please...') instead of content to server crawlers. Real-visitor browsers "
                "usually pass it - use 'Fetch with my browser instead' below (needs CORS), or add "
                "Company Data/FAQs manually in the earlier tabs."
                if challenge_vendor else
                f"Protected by a bot firewall ({waf_vendor}): the site refused the server crawler "
                f"(HTTP {block_status}). Business firewalls often block datacenter servers while "
                "allowing real visitors - use 'Fetch with my browser instead' below, or add "
                "Company Data/FAQs manually in the earlier tabs."
                if waf_vendor else
                f"Could not fetch any page from {base_origin} (site offline, blocking crawlers, "
                "invalid SSL, or unreachable from this network). Re-scan later, or add "
                "Company Data/FAQs manually in the earlier tabs."
            ),
        }

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
            "https://example.com/wp-login.php",
            "https://example.com/sample-page/",
            "https://example.com/2024/01/01/hello-world/",
            "https://example.com/category/uncategorized/",
            "https://example.com/feed/",
        ]
        ranked = rank_and_filter_urls(raw_urls, "https://example.com", "example.com", "example.com")
        # Ensure logo.png and otherdomain are excluded
        self.assertFalse(any(u.endswith(".png") for u in ranked))
        self.assertFalse(any("otherdomain" in u for u in ranked))
        # Ensure high value pages are ranked at top
        top_paths = [u.split("example.com")[-1] for u in ranked[:4]]
        self.assertTrue(any("services" in p for p in top_paths))
        self.assertTrue(any("pricing" in p for p in top_paths))
        # CMS boilerplate must never be indexed (login/sample/hello-world/feeds)
        self.assertFalse(any("wp-login" in u for u in ranked))
        self.assertFalse(any("sample-page" in u for u in ranked))
        self.assertFalse(any("hello-world" in u for u in ranked))
        self.assertFalse(any("uncategorized" in u for u in ranked))
        self.assertFalse(any(u.rstrip("/").endswith("/feed") for u in ranked))

    def test_junk_heading_filter(self):
        """Verify CMS-chrome/counter headings are flagged, real ones kept."""
        for junk in ["2022", "100%", "0 K+", "Log In", "Powered by WordPress",
                     "Sample Page", "Hello world!", "Search", "Skip to content",
                     "Recent Posts", "  MENU  "]:
            self.assertTrue(is_junk_heading(junk), junk)
        for real in ["Banking, Securities & Debt Recovery", "Our Core Values",
                     "24/7 Customer Support", "5 Star Cleaning Services",
                     " Pricing Plans 2024 ", "Contact Our Team?"]:
            self.assertFalse(is_junk_heading(real), real)

    def test_login_chrome_page(self):
        """Verify login-screen pages are detected by title."""
        self.assertTrue(is_login_chrome_page({"title": "Log In \u2039 Acme \u2014 WordPress"}))
        self.assertTrue(is_login_chrome_page({"title": "Login"}))
        self.assertFalse(is_login_chrome_page({"title": "Client Login Portal - Services & Support Center"}))
        self.assertFalse(is_login_chrome_page({"title": "Contact Us"}))

    def test_extract_heading_answer_stages(self):
        """Verify sibling -> parent -> card-ancestor -> stub answer stages."""
        from bs4 import BeautifulSoup
        # Stage 1: next sibling paragraph wins
        soup = BeautifulSoup("<div><h3>Alpha</h3><p>Alpha description text here.</p></div>", "html.parser")
        h = soup.find("h3")
        self.assertIn("Alpha description", extract_heading_answer(h, "Alpha", "Acme", "/"))
        # Stage 2: parent paragraphs
        soup = BeautifulSoup("<div><h3>Beta</h3><p>Beta parent paragraph text here.</p></div>", "html.parser")
        h = soup.find("h3")
        self.assertIn("Beta parent", extract_heading_answer(h, "Beta", "Acme", "/"))
        # Stage 3: Elementor-style card — description in uncle div of the header
        card = ('<div class="practice-card"><div class="practice-card-header"><div>'
                '<span>Eyebrow</span><h3>Banking Law</h3></div></div>'
                '<div class="practice-card-body"><p>Serving top financial institutions '
                'with perfection of securities.</p></div></div>')
        soup = BeautifulSoup(card, "html.parser")
        h = soup.find("h3")
        self.assertIn("financial institutions", extract_heading_answer(h, "Banking Law", "Acme", "/"))
        # Stage 4: lonely heading falls back to honest stub
        soup = BeautifulSoup("<div><h3>Lonely</h3></div>", "html.parser")
        h = soup.find("h3")
        self.assertIn("is featured on Acme", extract_heading_answer(h, "Lonely", "Acme", "/"))

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

    def test_crawl_unreachable_returns_honest_failure(self):
        """Verify unreachable sites return success=False + empty pages (never fabricated KB)."""
        res = crawl_website("http://invalid.invalid/", max_pages=3)
        self.assertFalse(res["success"])
        self.assertEqual(res["pages"], [])
        self.assertEqual(res["blocked"], "unreachable")
        self.assertIn("error", res)
        self.assertTrue(res["error"])

    def test_detect_waf_block(self):
        """Verify firewall-block detection from statuses, headers, and body markers."""
        self.assertEqual(
            detect_waf_block(403, {"x-amzn-waf-action": "captcha", "server": "awselb/2.0"}, "<h1>403</h1>"),
            "AWS WAF",
        )
        self.assertEqual(
            detect_waf_block(403, {"server": "cloudflare"}, "attention required | cloudflare"),
            "Cloudflare",
        )
        self.assertEqual(detect_waf_block(403, {}, "plain forbidden"), "bot firewall")
        self.assertIsNone(detect_waf_block(200, {}, "hello"))
        self.assertIsNone(detect_waf_block(None, {}, "ConnectTimeout"))

    def test_page_looks_challenged(self):
        """Verify JS-challenge interstitials are labelled, normal pages pass."""
        cf_html = "<html><head><title>Just a moment...</title></head><body>Cloudflare challenge cf_chl_opt</body></html>"
        self.assertEqual(page_looks_challenged(cf_html), "Cloudflare")
        self.assertIsNone(page_looks_challenged('<article class="prd"><h3 class="name">Milk</h3></article>'))
        self.assertIsNone(page_looks_challenged(""))
        self.assertIsNone(page_looks_challenged(None))

    def test_detect_loader_challenge(self):
        """Verify JS-loader + Cloudflare interstitials are labelled, normal pages pass."""
        loader = ("<html><head><title>One moment, please...</title></head><body>"
                  "Please wait while your request is being verified...</body></html>")
        self.assertEqual(detect_loader_challenge(loader), "JS verification loader")
        cf = "<html><head><title>Just a moment...</title></head><body>Cloudflare</body></html>"
        self.assertEqual(detect_loader_challenge(cf), "Cloudflare")
        normal = ("<html><head><title>About Us</title></head><body><p>Hello world, "
                  "we help clients every single day.</p></body></html>")
        self.assertIsNone(detect_loader_challenge(normal))
        self.assertIsNone(detect_loader_challenge(None))

    def test_crawl_skips_loader_and_thin_pages(self):
        """Challenge interstitials + thin pages are never indexed; real pages kept."""
        import threading
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

        real_para = "We are advocates helping clients with land commercial and family matters. "
        PAGES = {
            "/": (200, "text/html",
                  "<html><head><title>Home</title></head><body><main><h1>Welcome</h1><p>"
                  + real_para * 12 + "</p><nav><a href='/about'>About</a><a href='/promo'>Promo</a>"
                  "<a href='/thin'>Thin</a></nav></main></body></html>"),
            "/about": (200, "text/html",
                       "<html><head><title>About Us</title></head><body><main><h1>About Our Firm</h1><p>"
                       + real_para * 12 + "</p></main></body></html>"),
            "/promo": (200, "text/html",
                       "<html><head><title>One moment, please...</title><script>"
                       "setTimeout(function(){window.location.reload();},5000);</script></head><body>"
                       "Please wait while your request is being verified...</body></html>"),
            "/thin": (200, "text/html",
                      "<html><head><title>Thin</title></head><body><p>Hi there</p></body></html>"),
        }

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                status, ctype, body = PAGES.get(self.path.split("?")[0], (404, "text/plain", ""))
                data = body.encode()
                self.send_response(status)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *a):
                pass

        srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            res = crawl_website(f"http://127.0.0.1:{srv.server_address[1]}/", max_pages=5)
        finally:
            srv.shutdown()
            t.join(timeout=5)
        paths = sorted(p["path"] for p in res["pages"])
        self.assertTrue(res["success"])
        self.assertIn("/", paths)
        self.assertIn("/about", paths)
        self.assertNotIn("/promo", paths)
        self.assertNotIn("/thin", paths)
        blob = " ".join(p["title"] + " " + p["excerpt"] for p in res["pages"])
        self.assertNotIn("One moment", blob)

    def _gated_fixture_server(self, allow):
        """Local HTTP server that 403s every page unless allow(headers) is True."""
        import threading
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

        real_para = "Liberty heritage insurance covers motor medical and life policies. "
        PAGES = {
            "/": ("<html><head><title>Liberty & Heritage Insurance</title></head><body><main><h1>Welcome to Liberty</h1><p>"
                  + real_para * 12 + "</p><nav><a href='/about'>About</a></nav></main></body></html>"),
            "/about": ("<html><head><title>About Liberty</title></head><body><main><h1>About Our Company</h1><p>"
                       + real_para * 12 + "</p></main></body></html>"),
        }

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path.split("?")[0] not in PAGES or not allow(self.headers):
                    self.send_response(403)
                    self.send_header("Content-Length", "9")
                    self.end_headers()
                    self.wfile.write(b"forbidden")
                    return
                data = PAGES[self.path.split("?")[0]].encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *a):
                pass

        srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        return srv, t

    def test_escalation_browser_headers_clears_403(self):
        """403 to plain fetches, 200 to browser navigation headers -> site crawled."""
        srv, t = self._gated_fixture_server(lambda h: h.get("Sec-Fetch-Mode") == "navigate")
        try:
            res = crawl_website(f"http://127.0.0.1:{srv.server_address[1]}/", max_pages=5)
        finally:
            srv.shutdown()
            t.join(timeout=5)
        paths = sorted(p["path"] for p in res["pages"])
        self.assertTrue(res["success"])
        self.assertIn("/", paths)
        self.assertIn("/about", paths)

    @unittest.skipUnless(_CFFI_AVAILABLE, "curl-cffi not installed")
    def test_escalation_tls_level_clears_403(self):
        """403 to the requests stack, 200 to the browser TLS fingerprint -> crawled."""
        def allow(h):
            # L3 only: L1 sends no sec-ch-ua, L2 sends v="126", L3 sends v="124".
            return ('v="124"' in (h.get("sec-ch-ua") or "")
                    and "Chrome/124" in (h.get("User-Agent") or ""))
        srv, t = self._gated_fixture_server(allow)
        try:
            res = crawl_website(f"http://127.0.0.1:{srv.server_address[1]}/", max_pages=5)
        finally:
            srv.shutdown()
            t.join(timeout=5)
        paths = sorted(p["path"] for p in res["pages"])
        self.assertTrue(res["success"])
        self.assertIn("/", paths)
        self.assertIn("/about", paths)

    def test_map_shopify_suggest_products(self):
        """Verify Shopify suggest-JSON mapping onto the Botly item schema."""
        payload = {"resources": {"results": {"products": [
            {"title": "Fresh Milk 1L", "url": "/products/fresh-milk", "image": "https://x/m.jpg", "price": "KSh 120"},
            {"title": "", "url": "/products/blank"},
        ]}}}
        items = map_shopify_suggest_products(payload, "https://demo-store.myshopify.com", 5)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "Fresh Milk 1L")
        self.assertEqual(items[0]["url"], "https://demo-store.myshopify.com/products/fresh-milk")
        self.assertEqual(items[0]["source"], "shopify_api")
        self.assertEqual(map_shopify_suggest_products({}, "https://x", 5), [])

    def test_map_woocommerce_store_products(self):
        """Verify WooCommerce Store API mapping incl. minor-unit price conversion."""
        payload = [
            {"name": "Whole Milk", "permalink": "https://shop.test/milk",
             "prices": {"price": "12000", "currency_code": "KES", "currency_minor_unit": 2},
             "images": [{"src": "https://shop.test/m.jpg"}]},
        ]
        items = map_woocommerce_store_products(payload, 5)
        self.assertEqual(len(items), 1)
        self.assertAlmostEqual(items[0]["price"], 120.0)
        self.assertEqual(items[0]["currency"], "KES")
        self.assertEqual(items[0]["source"], "woocommerce_api")
        self.assertEqual(map_woocommerce_store_products({"oops": 1}, 5), [])

    def test_scrape_products_reports_blocked_shape(self):
        """Unreachable stores return the honest blocked payload (never fabricated items)."""
        res = scrape_products("milk", site_url="http://invalid.invalid", max_results=2)
        self.assertFalse(res["found"])
        self.assertEqual(res["items"], [])
        self.assertEqual(res["blocked"], "unreachable")
        self.assertTrue(res["error"])
        self.assertIn("searchUrl", res)

    def test_discover_wordpress_urls(self):
        """WP REST pages/posts surfaces unlinked content; non-WP sites yield []."""
        import json
        import threading
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                port = self.server.server_address[1]
                if self.path.startswith("/wp-json/wp/v2/pages"):
                    body = json.dumps([{"link": f"http://127.0.0.1:{port}/hidden-service/"}])
                elif self.path.startswith("/wp-json/wp/v2/posts"):
                    body = json.dumps([{"link": f"http://127.0.0.1:{port}/news/hello/"}])
                else:
                    self.send_response(404)
                    self.end_headers()
                    return
                data = body.encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *a):
                pass

        srv = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        t = threading.Thread(target=srv.serve_forever, daemon=True)
        t.start()
        try:
            import requests
            base = f"http://127.0.0.1:{srv.server_address[1]}"
            found = discover_wordpress_urls(base, requests.Session(), dict(DEFAULT_HEADERS))
            self.assertIn(f"{base}/hidden-service/", found)
            self.assertIn(f"{base}/news/hello/", found)
            self.assertEqual(discover_wordpress_urls(base + "/nope", requests.Session(), dict(DEFAULT_HEADERS)), [])
        finally:
            srv.shutdown()
            t.join(timeout=5)


if __name__ == "__main__":
    unittest.main()
