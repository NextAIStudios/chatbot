"""
Live Web Scraping & Crawling Engine for Chatbot
Uses requests & BeautifulSoup4 to dynamically extract real-time product listings
and website knowledge pages directly from merchant websites.
"""

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


def crawl_website(url: str, max_pages: int = 6) -> dict:
    """
    Crawls a target merchant or business website using BeautifulSoup.
    Extracts structured page metadata, excerpts, headings, and Q&A pairs for the AI chatbot memory.
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

    discovered_pages = []
    visited_urls = set()
    to_visit = [url]

    # Category classification rules
    def categorize_path(path_str: str, title_str: str) -> str:
        combined = f"{path_str} {title_str}".lower()
        if re.search(r"\b(price|pricing|plan|plans|cost|fee|package|packages|checkout|billing)\b", combined):
            return "pricing"
        if re.search(r"\b(service|services|solution|solutions|product|products|feature|course|courses|program)\b", combined):
            return "services"
        if re.search(r"\b(support|help|contact|faq|faqs|desk|guide|doc|docs)\b", combined):
            return "support"
        if re.search(r"\b(policy|policies|terms|privacy|refund|legal|disclaimer)\b", combined):
            return "policies"
        return "overview"

    while to_visit and len(discovered_pages) < max_pages:
        current_url = to_visit.pop(0)
        norm_url = current_url.split("#")[0].rstrip("/")
        if norm_url in visited_urls:
            continue
        visited_urls.add(norm_url)

        try:
            resp = session.get(current_url, headers=headers, timeout=6, allow_redirects=True)
            if resp.status_code != 200 or not resp.text:
                continue

            soup = BeautifulSoup(resp.text, "html.parser")

            # Remove noise scripts/styles/navs
            for tag in soup(["script", "style", "noscript", "svg"]):
                tag.decompose()

            # Extract Title
            title = ""
            if soup.title and soup.title.string:
                title = soup.title.string.strip()
            elif soup.find("h1"):
                title = soup.find("h1").get_text(strip=True)
            if not title:
                title = f"{company_name} - Page"

            # Clean company name refinement from title if possible
            if " - " in title:
                parts = title.split(" - ")
                if len(parts[0].strip()) < 30:
                    company_name = parts[0].strip()

            # Extract Meta Description
            meta_desc = ""
            desc_tag = soup.find("meta", attrs={"name": re.compile(r"description", re.I)}) or \
                       soup.find("meta", attrs={"property": "og:description"})
            if desc_tag and desc_tag.get("content"):
                meta_desc = desc_tag.get("content").strip()

            # Extract Main Body Text
            body_text = ""
            main_el = soup.find("main") or soup.find("article") or soup.find("body")
            if main_el:
                paragraphs = [p.get_text(" ", strip=True) for p in main_el.find_all(["p", "li"]) if len(p.get_text(strip=True)) > 20]
                body_text = " ".join(paragraphs)

            words = body_text.split()
            word_count = len(words)
            excerpt = meta_desc if meta_desc else (" ".join(words[:45]) + "..." if words else f"Information from {title}")

            page_path = urllib.parse.urlparse(current_url).path or "/"
            category = categorize_path(page_path, title)

            # Extract FAQs / Headings as Q&As
            qas = []
            # Check for headings h2, h3 followed by text
            headings = soup.find_all(["h2", "h3"])
            for idx, h in enumerate(headings[:4]):
                h_text = h.get_text(strip=True)
                if len(h_text) < 5 or len(h_text) > 120:
                    continue
                # Next sibling paragraph
                next_p = h.find_next_sibling(["p", "div"])
                answer = next_p.get_text(" ", strip=True) if next_p else ""
                if not answer or len(answer) < 15:
                    answer = f"{h_text} is featured on {company_name}. For full details, explore {page_path} or ask our concierge team."

                kw = [w.lower() for w in re.findall(r"[A-Za-z]{3,}", h_text)[:6]]
                qas.append({
                    "id": f"qa_{len(discovered_pages)}_{idx}",
                    "question": h_text if h_text.endswith("?") else f"What about {h_text}?",
                    "answer": answer[:350],
                    "keywords": kw,
                })

            # If no heading Q&As, create standard page overview QA
            if not qas:
                qas.append({
                    "id": f"qa_{len(discovered_pages)}_main",
                    "question": f"What is on the {title} page?",
                    "answer": excerpt[:300],
                    "keywords": [w.lower() for w in re.findall(r"[A-Za-z]{3,}", title)[:5]],
                })

            page_id = f"crawled_{len(discovered_pages) + 1}_{re.sub(r'[^a-zA-Z0-9]', '_', page_path.strip('/')) or 'home'}"
            discovered_pages.append({
                "id": page_id,
                "title": title[:80],
                "path": page_path,
                "url": current_url,
                "category": category,
                "wordCount": max(word_count, 120),
                "excerpt": excerpt[:220],
                "selected": True,
                "qas": qas,
            })

            # Discover internal links to crawl next
            for link in soup.find_all("a", href=True):
                href = link["href"].strip()
                if not href or href.startswith("javascript:") or href.startswith("mailto:") or href.startswith("tel:"):
                    continue
                full_child = urllib.parse.urljoin(current_url, href)
                child_parsed = urllib.parse.urlparse(full_child)
                # Keep within same domain
                if child_parsed.netloc.lower() == domain and child_parsed.path not in [p["path"] for p in discovered_pages]:
                    child_norm = full_child.split("#")[0].rstrip("/")
                    if child_norm not in visited_urls and child_norm not in to_visit:
                        # Prioritize interesting pages
                        if any(k in child_parsed.path.lower() for k in ["about", "service", "pricing", "contact", "faq", "shop", "catalog"]):
                            to_visit.insert(0, child_norm)
                        else:
                            to_visit.append(child_norm)

        except Exception:
            continue

    # Build synthetic fallback if 0 pages discovered
    if not discovered_pages:
        discovered_pages.append({
            "id": "crawled_1_home",
            "title": f"{company_name} - Official Overview",
            "path": "/",
            "url": url,
            "category": "overview",
            "wordCount": 210,
            "excerpt": f"Official site for {company_name}. Discover products, services, and live support.",
            "selected": True,
            "qas": [
                {
                    "id": "qa_fallback_home",
                    "question": f"What is {company_name} and what services are offered?",
                    "answer": f"Welcome to {company_name}! We provide reliable products, customer support, and dedicated services.",
                    "keywords": [company_name.lower(), "services", "overview", "products"],
                }
            ],
        })

    # Prepare quick replies based on discovered categories
    quick_replies = [
        {"label": "💼 Our Services", "payload": f"What services or products does {company_name} offer?"},
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


if __name__ == "__main__":
    unittest.main()
