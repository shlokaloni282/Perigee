import hashlib
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
import re

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

# The three agencies we treat as primary sources. Each is queried on its own if
# the combined "site:a OR site:b OR site:c" query comes back without one.
OFFICIAL_DOMAINS = ("nasa.gov", "esa.int", "isro.gov.in")
OFFICIAL_BIAS = "(" + " OR ".join(f"site:{d}" for d in OFFICIAL_DOMAINS) + ")"
PER_DOMAIN_LIMIT = 3
RANK = {"official": 0, "research": 1, "news/other": 2}
SPACE_RE = re.compile(
    r"\b(satellite|spacecraft|space|orbit|orbital|telemetry|nasa|esa|isro|cubesat|smallsat|aerospace)\b",
    re.I,
)
_STATS_LOCK = threading.Lock()


def new_stats() -> dict:
    """Counters for one briefing: queries run, live SerpApi calls, results seen."""
    return {"queries": 0, "live_searches": 0, "retrieved": 0}


def _bump(stats, key: str, n: int = 1) -> None:
    if stats is not None:
        with _STATS_LOCK:
            stats[key] = stats.get(key, 0) + n


def _on_topic(item) -> bool:
    text = f"{item.get('title') or ''} {item.get('snippet') or ''} {item.get('link') or ''}"
    return bool(SPACE_RE.search(text))


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


NOISE = set()


def _is_noise(url: str) -> bool:
    host = urlparse(url or "").netloc.lower()
    return any(host == d or host.endswith("." + d) for d in NOISE)


def search(query: str, engine: str = "google", limit: int = 5, stats=None):
    """Run one SerpApi search (cached on disk) and return source-labelled results."""
    path = _cache_path(engine, query)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
    else:
        params = {"engine": engine, "q": query, "gl": "in", "hl": "en"}
        data = dict(_client().search(params))
        path.write_text(json.dumps(data), encoding="utf-8")
        _bump(stats, "live_searches")  # only a cache miss spends SerpApi quota

    _bump(stats, "queries")
    key = "news_results" if engine == "google_news" else "organic_results"
    raw = data.get(key, [])[:limit]
    _bump(stats, "retrieved", len(raw))

    results = []
    for r in raw:
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

def official_search(query: str, limit: int = 5, stats=None, per_domain: int = PER_DOMAIN_LIMIT):
    """Search with an official bias, escalating to one query per agency domain.

    Google frequently ignores long `site:a OR site:b OR site:c` chains, so if the
    biased query returns no official page we ask nasa.gov, esa.int and
    isro.gov.in separately. The extra searches are only spent when needed.
    """
    items = search(f"{query} {OFFICIAL_BIAS}", limit=limit, stats=stats)
    if not any(i["source_type"] == "official" for i in items):
        for domain in OFFICIAL_DOMAINS:
            items += search(f"{query} site:{domain}", limit=per_domain, stats=stats)
    return items


def gather(anomaly_type: str, limit: int = 5, stats=None):
    """Gather Google, official-biased, and current Google News results."""
    qs = queries_for(anomaly_type)
    topic_query = qs[1] if len(qs) > 1 else qs[0]
    seen, out = set(), []

    def add(items):
        for item in items:
            link = item["link"]
            if link in seen or _is_noise(link) or not _on_topic(item):
                continue
            seen.add(link)
            out.append(item)

    with ThreadPoolExecutor(max_workers=3) as executor:
        general_search = executor.submit(search, qs[0], limit=limit, stats=stats)
        official_results = executor.submit(
            official_search, topic_query, limit=limit, stats=stats
        )
        news_search = executor.submit(
            search, topic_query, engine="google_news", limit=limit, stats=stats
        )

        add(general_search.result())
        add(official_results.result())
        add(news_search.result())

    return sorted(out, key=lambda x: RANK[x["source_type"]])


if __name__ == "__main__":
    stats = new_stats()
    for item in gather("battery_drop", stats=stats):
        print(f"queries: {stats['queries']} live SerpApi calls: {stats['live_searches']}")
        print(f"[{item['source_type']}] {item['title']}")
        print(f"   {item['link']}\n")