import json
from pathlib import Path

from .llm import ask_json
from .searcher import OFFICIAL_BIAS, RANK, _is_noise, _on_topic, gather, search
MAX_SOURCES = 8

PROMPT = """You are an assistant helping a satellite operator understand an anomaly.
An ML model flagged this anomaly in SIMULATED telemetry:
<<ANOMALY>>

Numbered web sources (source_type: official > research > news/other in reliability):
<<SOURCES>>

Return ONLY JSON with exactly this shape:
{
  "summary": "2-3 plain-English sentences on the most likely causes",
  "causes": [{"cause": "...", "evidence": [source numbers], "confidence": "high|medium|low"}],
  "conflicts": [{"topic": "...", "claims": [{"source": source number, "claim": "..."}]}],
  "needs_followup": true or false,
  "followup_query": "a specific search query to resolve a conflict or fill a gap, or empty string"
}

Rules:
- Use ONLY information in the sources. Do not add outside knowledge.
- Cite source numbers for every cause. Prefer official and research sources over news/other.
- A conflict means two sources genuinely disagree on a cause, number or fact. Do not invent conflicts.
- If sources are off-topic or too thin, say so in the summary and use low confidence.
- Set needs_followup to true only if a conflict or a clear gap needs another search.
"""


def _format_sources(sources):
    lines = []
    for i, s in enumerate(sources):
        snippet = (s.get("snippet") or "")[:300]
        lines.append(f"[{i}] ({s['source_type']}) {s['title']} - {snippet}")
    return "\n".join(lines)


def _analyze(anomaly, sources):
    prompt = (
        PROMPT.replace("<<ANOMALY>>", json.dumps(anomaly, default=str))
        .replace("<<SOURCES>>", _format_sources(sources))
    )
    return ask_json(prompt)


def explain(anomaly: dict) -> dict:
    """Search, analyze, and (if the model asks) run one follow-up search."""
    sources = gather(anomaly["anomaly_type"])[:MAX_SOURCES]
    result = _analyze(anomaly, sources)

    followup_used = False
    query = (result.get("followup_query") or "").strip()
    if result.get("needs_followup") and query:
        known = {s["link"] for s in sources}
        extra = [
            s for s in search(f"{query} {OFFICIAL_BIAS}", limit=5)
            if s["link"] not in known and not _is_noise(s["link"]) and _on_topic(s)        ]
        if extra:
            sources = sorted(sources + extra, key=lambda x: RANK[x["source_type"]])[: MAX_SOURCES + 3]
            result = _analyze(anomaly, sources)
            followup_used = True

    return {
        "anomaly": anomaly,
        "summary": result.get("summary", ""),
        "causes": result.get("causes", []),
        "conflicts": result.get("conflicts", []),
        "followup_used": followup_used,
        "followup_query": query if followup_used else "",
        "sources": sources,
    }


if __name__ == "__main__":
    import sys

    import pandas as pd

    atype = sys.argv[1] if len(sys.argv) > 1 else "comms_dropout"
    root = Path(__file__).resolve().parent.parent
    df = pd.read_csv(root / "ml" / "data" / "telemetry.csv")
    row = df[(df["is_anomaly"] == 1) & (df["anomaly_type"] == atype)].iloc[0]
    out = explain(row.to_dict())

    print("SUMMARY:", out["summary"], "\n")
    for c in out["causes"]:
        print(f"- {c['cause']} (confidence: {c['confidence']}, sources: {c['evidence']})")
    print("\nCONFLICTS:", json.dumps(out["conflicts"], indent=2) if out["conflicts"] else "none")
    print("\nFOLLOW-UP SEARCH USED:", out["followup_used"], out["followup_query"])
    print("\nSOURCES:")
    for i, s in enumerate(out["sources"]):
        print(f"[{i}] [{s['source_type']}] {s['title']}\n{s['link']}")