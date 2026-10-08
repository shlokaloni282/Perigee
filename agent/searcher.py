import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urlparse

import serpapi
from dotenv import load_dotenv

from .credibility import classify

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

CACHE_DIR = Path(__file__).resolve().parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

# Query templates keyed by the anomaly_type values in ml/data/telemetry.csv
TEMPLATES = {
    "power_surge": [
        "spacecraft electrical power system anomaly causes",
        "satellite power surge solar array failure",
    ],
    "orientation_drift": [
        "satellite attitude control anomaly causes reaction wheel",
        "spacecraft attitude drift anomaly",
    ],
    "comms_dropout": [
        "satellite communication link dropout causes",
        "space weather satellite signal loss",
    ],
    "battery_drop": [
        "spacecraft battery capacity fade anomaly causes",
        "satellite battery voltage drop anomaly",
    ],
    "temp_spike": [
        "spacecraft thermal control anomaly causes",
        "satellite overheating thermal failure",
    ],
}

OFFICIAL_BIAS = "(site:nasa.gov OR site:esa.int OR site:isro.gov.in)"
NOISE = (
    "facebook.com", "instagram.com", "pinterest.com", "quora.com",
    "reddit.com", "tiktok.com", "x.com", "twitter.com",
)
RANK = {"official": 0, "research": 1, "news/other": 2}


def queries_for(anomaly_type: str):
    return TEMPLATES.get(
        anomaly_type, [f"satellite {anomaly_type.replace('_', ' ')} causes"]
    )


def _client():
    key = os.getenv("SERPAPI_API_KEY")
    if not key:
        raise RuntimeError(
            "SERPAPI_API_KEY not found. Check your .env file in the project root."
        )
    return serpapi.Client(api_key=key)


def _cache_path(engine: str, query: str) -> Path:
    digest = hashlib.md5(f"{engine}|{query}".encode()).hexdigest()
    return CACHE_DIR / f"{digest}.json"


def _is_noise(url: str) -> bool:
    host = urlparse(url or "").netloc.lower()
    return any(host == d or host.endswith("." + d) for d in NOISE)


def search(query: str, engine: str = "google", limit: int = 5):
    """Run one SerpApi search (cached on disk) and return source-labelled results."""
    path = _cache_path(engine, query)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
    else:
        params = {"engine": engine, "q": query, "gl": "in", "hl": "en"}
        data = dict(_client().search(params))
        path.write_text(json.dumps(data), encoding="utf-8")

    key = "news_results" if engine == "google_news" else "organic_results"
    results = []
    for r in data.get(key, [])[:limit]:
        link = r.get("link", "")
        results.append({
            "title": r.get("title"),
            "link": link,
            "snippet": r.get("snippet") or r.get("title"),
            "date": r.get("date"),
            "source_type": classify(link),
            "query": query,
            "engine": engine,
        })
    return results


def gather(anomaly_type: str, limit: int = 5):
    """General query + official-biased query, deduped, noise-filtered, ranked."""
    qs = queries_for(anomaly_type)
    queries = [qs[0], f"{qs[1] if len(qs) > 1 else qs[0]} {OFFICIAL_BIAS}"]
    seen, out = set(), []
    for q in queries:
        for item in search(q, limit=limit):
            if item["link"] in seen or _is_noise(item["link"]):
                continue
            seen.add(item["link"])
            out.append(item)
    return sorted(out, key=lambda x: RANK[x["source_type"]])


if __name__ == "__main__":
    for item in gather("battery_drop"):
        print(f"[{item['source_type']}] {item['title']}")
        print(f"   {item['link']}\n")