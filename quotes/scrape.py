import json
import time
import requests
from bs4 import BeautifulSoup

URL = "https://www.goodreads.com/work/quotes/17993650-keeper-of-the-lost-cities"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MetadataCollector/1.0)"
}

def parse_page(html: str):
    soup = BeautifulSoup(html, "html.parser")
    items = []

    for block in soup.select(".quoteDetails"):
        # Metadata only (avoid copying quote text)
        author_el = block.select_one(".authorOrTitle")
        likes_el = block.find(string=lambda s: s and "likes" in s.lower())
        tags = [a.get_text(strip=True) for a in block.select("a.smallText")]

        items.append({
            "author": author_el.get_text(strip=True) if author_el else None,
            "likes_text": likes_el.strip() if likes_el else None,
            "tags": tags
        })

    return items

def scrape_metadata(start_url: str, max_pages: int = 5):
    all_items = []
    next_url = start_url

    for _ in range(max_pages):
        if not next_url:
            break

        resp = requests.get(next_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()

        all_items.extend(parse_page(resp.text))

        soup = BeautifulSoup(resp.text, "html.parser")
        next_link = soup.select_one("a.next_page")
        next_url = f"https://www.goodreads.com{next_link['href']}" if next_link and next_link.get("href") else None

        time.sleep(1.0)

    return all_items

if __name__ == "__main__":
    data = scrape_metadata(URL, max_pages=10)

    with open("kotlc_quotes_metadata.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(data)} metadata records to kotlc_quotes_metadata.json")
