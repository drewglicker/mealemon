#!/usr/bin/env python3
"""Scrape recipe pages from mealime.com sitemap into data/*.json (JSON-LD -> repo schema).

Usage: python3 scripts/scrape_mealime.py [--limit N] [--start N]
Writes progress to scripts/.scrape_progress.json so it's resumable.
Polite: 1 request every ~0.4s, single-threaded, standard UA, respects robots.txt (no disallow).
"""
import json
import re
import sys
import time
import html
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PROGRESS_FILE = ROOT / "scripts" / ".scrape_progress.json"
SITEMAP_URL = "https://www.mealime.com/sitemap.xml"
UA = "Mozilla/5.0 (compatible; MealemonPersonalArchive/1.0; +personal recipe archive for household use)"
DELAY_S = 0.4


def fetch(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def get_all_recipe_urls():
    xml = fetch(SITEMAP_URL)
    urls = re.findall(r"<loc>(https://www\.mealime\.com/recipes/[^<]+)</loc>", xml)
    return urls


def parse_iso_duration_or_passthrough(v):
    return v or ""


def ld_to_record(ld, source_url):
    m = re.search(r"/recipes/([^/]+)/(\d+)$", source_url)
    slug = m.group(1) if m else ld.get("@id", "")
    recipe_id = m.group(2) if m else str(ld.get("@id", ""))

    instructions = []
    for step in ld.get("recipeInstructions", []) or []:
        if isinstance(step, dict):
            instructions.append(html.unescape(step.get("text", "")))
        elif isinstance(step, str):
            instructions.append(html.unescape(step))

    images = ld.get("image")
    if isinstance(images, str):
        images = [images]
    elif not isinstance(images, list):
        images = []

    author = ld.get("author")
    if isinstance(author, dict):
        author = author.get("name", "Mealime")
    elif not isinstance(author, str):
        author = "Mealime"

    keywords = ld.get("keywords")
    if isinstance(keywords, str):
        keywords = [keywords] if keywords else []
    elif not isinstance(keywords, list):
        keywords = []

    return {
        "source_url": source_url,
        "recipe_id": recipe_id,
        "name": html.unescape(ld.get("name", "")),
        "recipe_category": ld.get("recipeCategory", ""),
        "recipe_cuisine": ld.get("recipeCuisine", ""),
        "keywords": keywords,
        "cook_time": ld.get("cookTime", ""),
        "total_time": ld.get("totalTime", ""),
        "recipe_yield": ld.get("recipeYield", ""),
        "ingredients": [html.unescape(i) for i in ld.get("recipeIngredient", []) or []],
        "instructions": instructions,
        "images": images,
        "author": author,
        "slug": slug,
    }


def extract_ld(html_text):
    blocks = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', html_text, re.S
    )
    for b in blocks:
        try:
            d = json.loads(b)
        except Exception:
            continue
        if isinstance(d, dict) and d.get("@type") == "Recipe":
            return d
        if isinstance(d, list):
            for item in d:
                if isinstance(item, dict) and item.get("@type") == "Recipe":
                    return item
    return None


def load_progress():
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {"done": [], "failed": []}


def save_progress(progress):
    PROGRESS_FILE.write_text(json.dumps(progress))


def main():
    limit = None
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])

    DATA_DIR.mkdir(exist_ok=True)
    urls = get_all_recipe_urls()
    if limit:
        urls = urls[:limit]
    print(f"Found {len(urls)} recipe URLs in sitemap", flush=True)

    progress = load_progress()
    done_set = set(progress["done"])
    failed_set = set(progress["failed"])

    saved = 0
    skipped = 0
    failed = 0
    for idx, url in enumerate(urls, 1):
        m = re.search(r"/recipes/([^/]+)/(\d+)$", url)
        if not m:
            continue
        slug, rid = m.group(1), m.group(2)
        out_path = DATA_DIR / f"{slug}-{rid}.json"
        if url in done_set or out_path.exists():
            skipped += 1
            continue
        try:
            page = fetch(url)
            ld = extract_ld(page)
            if not ld:
                failed += 1
                failed_set.add(url)
                print(f"[{idx}/{len(urls)}] NO_LD {url}", flush=True)
                continue
            record = ld_to_record(ld, url)
            out_path.write_text(json.dumps(record, indent=2, ensure_ascii=False))
            done_set.add(url)
            saved += 1
            if saved % 25 == 0:
                print(f"[{idx}/{len(urls)}] saved={saved} skipped={skipped} failed={failed}", flush=True)
        except Exception as e:
            failed += 1
            failed_set.add(url)
            print(f"[{idx}/{len(urls)}] ERROR {url}: {e}", flush=True)
        finally:
            if idx % 20 == 0:
                progress["done"] = list(done_set)
                progress["failed"] = list(failed_set)
                save_progress(progress)
            time.sleep(DELAY_S)

    progress["done"] = list(done_set)
    progress["failed"] = list(failed_set)
    save_progress(progress)
    print(f"DONE total={len(urls)} saved={saved} skipped={skipped} failed={failed}", flush=True)


if __name__ == "__main__":
    main()
