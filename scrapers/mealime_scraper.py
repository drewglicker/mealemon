#!/usr/bin/env python3
"""
mealime_scraper.py

Fetches public recipe pages from mealime.com, parses the
<script type="application/ld+json"> Recipe block on each page, and
saves the extracted ingredients, cooking steps, and images as
structured JSON files into the data/ directory.

Usage:
    python scrapers/mealime_scraper.py <recipe_url> [<recipe_url> ...]
    python scrapers/mealime_scraper.py --urls-file urls.txt

Each recipe is written to data/<slug>-<id>.json, e.g.:
    data/strawberry-panzanella-italian-bread-salad-chicken-feta-mint-31115.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 MealemonScraper/1.0"
)

LD_JSON_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"


def fetch_html(url: str, timeout: int = 20) -> str:
    """Download the raw HTML for a recipe page."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def extract_ld_json_blocks(html: str) -> list[dict[str, Any]]:
    """Return every parsed JSON-LD block found in the page."""
    blocks = []
    for raw in LD_JSON_RE.findall(html):
        raw = raw.strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            blocks.extend(data)
        else:
            blocks.append(data)
    return blocks


def find_recipe_block(blocks: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Pick out the block whose @type is Recipe (handles list-valued @type too)."""
    for block in blocks:
        block_type = block.get("@type")
        if block_type == "Recipe":
            return block
        if isinstance(block_type, list) and "Recipe" in block_type:
            return block
    return None


def unescape(value: Any) -> Any:
    """Recursively unescape HTML entities (e.g. &amp; -> &) in strings."""
    if isinstance(value, str):
        return html.unescape(value)
    if isinstance(value, list):
        return [unescape(item) for item in value]
    if isinstance(value, dict):
        return {key: unescape(item) for key, item in value.items()}
    return value


def normalize_instructions(raw_instructions: Any) -> list[str]:
    """recipeInstructions can be a list of HowToStep dicts or plain strings."""
    steps: list[str] = []
    if isinstance(raw_instructions, str):
        steps.append(raw_instructions)
    elif isinstance(raw_instructions, list):
        for item in raw_instructions:
            if isinstance(item, dict):
                text = item.get("text") or item.get("name")
                if text:
                    steps.append(text)
            elif isinstance(item, str):
                steps.append(item)
    return [html.unescape(step) for step in steps]


def normalize_images(raw_image: Any) -> list[str]:
    """image can be a single URL string, a list, or an ImageObject dict."""
    images: list[str] = []
    if isinstance(raw_image, str):
        images.append(raw_image)
    elif isinstance(raw_image, list):
        for item in raw_image:
            if isinstance(item, str):
                images.append(item)
            elif isinstance(item, dict) and item.get("url"):
                images.append(item["url"])
    elif isinstance(raw_image, dict) and raw_image.get("url"):
        images.append(raw_image["url"])
    return images


def slug_and_id_from_url(url: str) -> tuple[str, str]:
    """Pull the human-readable slug and numeric recipe id out of a mealime URL."""
    parts = [p for p in url.rstrip("/").split("/") if p]
    recipe_id = parts[-1] if parts and parts[-1].isdigit() else "unknown"
    slug = parts[-2] if len(parts) >= 2 else "recipe"
    return slug, recipe_id


def parse_recipe(url: str, html: str) -> dict[str, Any]:
    blocks = extract_ld_json_blocks(html)
    recipe = find_recipe_block(blocks)
    if recipe is None:
        raise ValueError(f"No Recipe JSON-LD block found at {url}")

    slug, recipe_id = slug_and_id_from_url(url)

    return {
        "source_url": url,
        "recipe_id": recipe.get("@id", recipe_id),
        "name": unescape(recipe.get("name")),
        "recipe_category": unescape(recipe.get("recipeCategory")),
        "recipe_cuisine": unescape(recipe.get("recipeCuisine")),
        "keywords": unescape(recipe.get("keywords")),
        "cook_time": recipe.get("cookTime"),
        "total_time": recipe.get("totalTime"),
        "recipe_yield": unescape(recipe.get("recipeYield")),
        "ingredients": unescape(recipe.get("recipeIngredient", [])),
        "instructions": normalize_instructions(recipe.get("recipeInstructions")),
        "images": normalize_images(recipe.get("image")),
        "author": unescape(
            (recipe.get("author") or {}).get("name")
            if isinstance(recipe.get("author"), dict)
            else recipe.get("author")
        ),
        "slug": slug,
    }


def save_recipe(recipe: dict[str, Any], data_dir: Path = DATA_DIR) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{recipe['slug']}-{recipe['recipe_id']}.json"
    out_path = data_dir / filename
    out_path.write_text(json.dumps(recipe, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_path


def scrape_url(url: str, delay: float = 1.0) -> Path:
    html = fetch_html(url)
    recipe = parse_recipe(url, html)
    path = save_recipe(recipe)
    time.sleep(delay)  # be polite between requests
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("urls", nargs="*", help="Mealime recipe page URLs")
    parser.add_argument(
        "--urls-file",
        type=Path,
        help="Path to a text file with one recipe URL per line",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds to sleep between requests (politeness delay, default 1.0)",
    )
    args = parser.parse_args(argv)

    urls = list(args.urls)
    if args.urls_file:
        urls.extend(
            line.strip()
            for line in args.urls_file.read_text().splitlines()
            if line.strip() and not line.strip().startswith("#")
        )

    if not urls:
        parser.error("Provide at least one recipe URL, or --urls-file")

    exit_code = 0
    for url in urls:
        try:
            path = scrape_url(url, delay=args.delay)
            print(f"OK   {url} -> {path.relative_to(REPO_ROOT)}")
        except (urllib.error.URLError, ValueError) as exc:
            print(f"FAIL {url}: {exc}", file=sys.stderr)
            exit_code = 1
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
