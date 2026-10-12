from urllib.parse import urlparse

OFFICIAL = (
    "nasa.gov", "esa.int", "isro.gov.in", "noaa.gov",
    "jaxa.jp", "cnsa.gov.cn", "space.gov.in",
)
RESEARCH = (
    "arxiv.org", "nature.com", "sciencedirect.com", "ieee.org",
    "springer.com", "researchgate.net", "ntrs.nasa.gov", "aiaa.org",
)

# Government and academic TLDs count too, so an agency report or a university
# paper is not lumped in with blog posts and news aggregators.
GOV_SUFFIXES = (".gov", ".gov.in", ".gov.uk", ".gov.au", ".go.jp", ".mil")
ACADEMIC_SUFFIXES = (".edu", ".edu.au", ".ac.uk", ".ac.in", ".ac.jp", ".ac.nz")


def _host(url: str) -> str:
    return urlparse(url or "").netloc.lower().split(":")[0]


def _matches(host: str, domains) -> bool:
    return any(host == d or host.endswith("." + d) for d in domains)


def classify(url: str) -> str:
    """Label a source as official, research, or news/other using domain rules."""
    host = _host(url)
    if _matches(host, OFFICIAL) or host.endswith(GOV_SUFFIXES):
        return "official"
    if _matches(host, RESEARCH) or host.endswith(ACADEMIC_SUFFIXES):
        return "research"
    return "news/other"