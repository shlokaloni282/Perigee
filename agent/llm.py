import hashlib
import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

CACHE_DIR = Path(__file__).resolve().parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

PRIMARY = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACKS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "").split(",") if m.strip()]
MODELS = [PRIMARY] + FALLBACKS
RETRYABLE = {429, 500, 502, 503, 504}


def _client():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not found. Check your .env file in the project root.")
    return genai.Client(api_key=key)


def _generate(client, prompt: str) -> str:
    """Call Gemini, retrying on overload and falling back to the next model if one is unavailable."""
    last = None
    for model in MODELS:
        for attempt in range(5):
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json", temperature=0.2
                    ),
                )
                return resp.text or ""
            except errors.APIError as e:
                last = e
                code = getattr(e, "code", None)
                if code in RETRYABLE:
                    wait = min(3 * 2 ** attempt, 30)
                    print(f"[llm] {model} busy ({code}); retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                if code == 404:
                    print(f"[llm] {model} not available; trying next model")
                    break
                raise
    raise RuntimeError(f"All Gemini attempts failed: {last}")


def ask_json(prompt: str) -> dict:
    """Send a prompt, return parsed JSON. Successful responses are cached on disk."""
    digest = hashlib.md5((PRIMARY + prompt).encode()).hexdigest()
    path = CACHE_DIR / f"llm_{digest}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))

    client = _client()
    last_err = None
    for _ in range(2):  # one retry if the model returns malformed JSON
        text = _generate(client, prompt).strip()
        text = re.sub(r"^```(?:json)?|```$", "", text).strip()
        try:
            data = json.loads(text)
            path.write_text(json.dumps(data), encoding="utf-8")
            return data
        except json.JSONDecodeError as e:
            last_err = e
    raise ValueError(f"LLM did not return valid JSON: {last_err}")