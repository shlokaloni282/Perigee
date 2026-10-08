from urllib.parse import urlparse

OFFICIAL = (
    "nasa.gov", "esa.int", "isro.gov.in", "noaa.gov",
    "jaxa.jp", "cnsa.gov.cn", "space.gov.in",
)
RESEARCH = (
    "arxiv.org", "nature.com", "sciencedirect.com", "ieee.org",
    "springer.com", "researchgate.net", "ntrs.nasa.gov", "aiaa.org",
)


def classify(url: str) -> str:
    """Label a source as official, research, or news/other using domain rules."""
    host = urlparse(url or "").netloc.lower()
    if any(host == d or host.endswith("." + d) for d in OFFICIAL):
        return "official"
    if any(host == d or host.endswith("." + d) for d in RESEARCH):
        return "research"
    return "news/other"