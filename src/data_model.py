"""Small, framework-independent functions that a later dashboard can reuse.

One record is one structure/BIN, not necessarily one named bridge. No rating
averages, cost models, traffic exposure, or safety predictions are calculated.
"""
from collections import Counter

CONDITIONS = ["Poor", "Fair", "Good", "Very good", "Closed"]
BOROUGH_GROUPS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island",
                  "Cross-borough", "Unknown"]
BOROUGH_CODES = {"B": "Bronx", "K": "Brooklyn", "M": "Manhattan",
                 "Q": "Queens", "R": "Staten Island"}
SPAN_BANDS = ["1", "2-4", "5-9", "10-49", "50+"]
# Eleven exceptions listed in the report, printed p. 21 (PDF page 23).
LEGACY_BINS = {"2245290", "2231300", "2232030", "2247020", "7705510",
               "2271180", "2247190", "1247200", "2232110", "2243460", "2271190"}


def borough_group(code):
    if code in BOROUGH_CODES:
        return BOROUGH_CODES[code]
    if code in {"BM", "KM", "MQ", "KQ"}:
        return "Cross-borough"
    return "Unknown"


def span_band(spans):
    if spans == 1:
        return "1"
    if 2 <= spans <= 4:
        return "2-4"
    if 5 <= spans <= 9:
        return "5-9"
    if 10 <= spans <= 49:
        return "10-49"
    if spans >= 50:
        return "50+"
    raise ValueError(f"Invalid span count: {spans}")


def select_records(records, conditions=None, boroughs=None, bins=None,
                   rating_sources=None, nbi_w_only=False, include_closed=True):
    """Intersect selections. None = no constraint; [] = deliberately empty.

    Important for a future UI: clearing a brush must send None, not [].
    Every chart must receive the same returned records. Empty selections must
    show an explicit empty-state message rather than NaN or misleading bars.
    """
    tests = [(conditions, "condition"), (boroughs, "borough_group"),
             (bins, "bin"), (rating_sources, "rating_source")]
    out = []
    for row in records:
        if any(allowed is not None and row[key] not in allowed
               for allowed, key in tests):
            continue
        if nbi_w_only and row["rating_basis"] != "NBI-W":
            continue
        if not include_closed and row["condition"] == "Closed":
            continue
        out.append(row)
    return out


def group_summary(records, field, order):
    """Count and area shares use the same selected-record denominator.

    Values are recomputed after selection; the future UI must display n and
    total area. A borough share is a share of this cohort, not a within-borough
    failure rate, traffic-weighted exposure, or neighborhood risk statistic.
    """
    total_n = len(records)
    total_area = sum(row["deck_area_sq_ft"] for row in records)
    out = []
    for value in order:
        subset = [row for row in records if row[field] == value]
        n = len(subset)
        area = sum(row["deck_area_sq_ft"] for row in subset)
        out.append({"group": value, "count": n, "deck_area_sq_ft": area,
                    "count_pct": 100 * n / total_n if total_n else None,
                    "area_pct": 100 * area / total_area if total_area else None})
    return out


def overview(records):
    return {"structures": len(records),
            "deck_area_sq_ft": sum(row["deck_area_sq_ft"] for row in records),
            "spans": sum(row["spans"] for row in records),
            "closed": sum(row["condition"] == "Closed" for row in records),
            "legacy": sum(row["rating_basis"] == "Legacy exception" for row in records),
            "condition_counts": dict(Counter(row["condition"] for row in records))}
