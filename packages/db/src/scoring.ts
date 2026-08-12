/**
 * REALVIAN SCORING ENGINE
 *
 * Turns raw public data into the two proprietary composite scores:
 *   • Realvian Score  — liveability (for people who will live there)
 *   • Investment Score — return potential (for people who will let it)
 *
 * DESIGN PRINCIPLES
 *
 * 1. TRANSPARENT. Every score decomposes into named, inspectable inputs.
 *    If a user asks "why is this 87?", we must be able to answer precisely.
 *    This is both a trust requirement and a legal one — under Consumer
 *    Protection Regulations an unexplainable number attached to a property
 *    decision is a liability.
 *
 * 2. NATIONALLY NORMALISED. A score of 80 must mean the same thing in
 *    Glasgow as in Bristol. Every raw input is converted to a percentile
 *    against the national distribution before weighting.
 *
 * 3. PURE FUNCTIONS. No I/O, no database, no network. Fully unit-testable,
 *    and deterministic for a given input set.
 *
 * 4. VERSIONED. `SCORING_VERSION` is stamped onto every stored score, so
 *    when weights change we can tell which scores are stale and recompute
 *    rather than silently mixing methodologies.
 */

export const SCORING_VERSION = "1.0.0";

/* ══════════════════════════════════════════════════════
   RAW INPUTS — exactly what the ingestion layer provides
   ══════════════════════════════════════════════════════ */
export interface RawAreaInputs {
  /** Ofsted: share of pupils at Good/Outstanding schools within 2km (0–1) */
  goodSchoolShare: number | null;
  /** Number of schools within 2km */
  schoolCount: number | null;

  /** Police.uk: recorded crimes per 1,000 residents, trailing 12 months */
  crimePer1000: number | null;

  /** Minutes to the nearest major rail/metro station on foot */
  minsToStation: number | null;
  /** Distinct public transport stops within 1km */
  transportStops: number | null;

  /** Share of land within 1km that is accessible green space (0–1) */
  greenSpaceShare: number | null;
  /** Metres to the nearest park entrance */
  metresToPark: number | null;

  /** Count of retail, food, health and leisure premises within 1km */
  amenityCount: number | null;

  /** HM Land Registry: median sold price, trailing 12 months */
  medianPrice: number | null;
  /** ONS: median gross annual earnings for the local authority */
  medianEarnings: number | null;

  /** Median monthly rent (ONS private rental statistics) */
  medianRent: number | null;
  /** Price change over 5 years as a decimal (0.18 = +18%) */
  fiveYearPriceChange: number | null;
  /** Median days on market */
  daysOnMarket: number | null;
  /** Net new dwellings approved in the last 24 months (supply pressure) */
  planningApprovals: number | null;
  /** Population, used to scale supply pressure */
  population: number | null;

  /** Environment Agency flood risk band */
  floodRisk: "very low" | "low" | "medium" | "high" | null;
}

/* ══════════════════════════════════════════════════════
   NATIONAL REFERENCE DISTRIBUTIONS
   Derived from the full national dataset during ingestion, then frozen
   for a scoring run so every area is scored against the same yardstick.
   The values below are UK-wide starting estimates, replaced by computed
   percentiles once the first full ingest completes.
   ══════════════════════════════════════════════════════ */
export interface NationalBaseline {
  crimePer1000: { p10: number; p50: number; p90: number };
  minsToStation: { p10: number; p50: number; p90: number };
  transportStops: { p10: number; p50: number; p90: number };
  greenSpaceShare: { p10: number; p50: number; p90: number };
  amenityCount: { p10: number; p50: number; p90: number };
  priceToEarnings: { p10: number; p50: number; p90: number };
  grossYield: { p10: number; p50: number; p90: number };
  fiveYearPriceChange: { p10: number; p50: number; p90: number };
  daysOnMarket: { p10: number; p50: number; p90: number };
}

export const DEFAULT_BASELINE: NationalBaseline = {
  crimePer1000: { p10: 38, p50: 78, p90: 152 },
  minsToStation: { p10: 4, p50: 14, p90: 42 },
  transportStops: { p10: 6, p50: 22, p90: 68 },
  greenSpaceShare: { p10: 0.04, p50: 0.13, p90: 0.34 },
  amenityCount: { p10: 18, p50: 74, p90: 240 },
  priceToEarnings: { p10: 4.2, p50: 7.4, p90: 13.8 },
  grossYield: { p10: 3.4, p50: 5.2, p90: 7.6 },
  fiveYearPriceChange: { p10: 0.04, p50: 0.16, p90: 0.32 },
  daysOnMarket: { p10: 18, p50: 38, p90: 82 },
};

/* ══════════════════════════════════════════════════════
   NORMALISATION
   ══════════════════════════════════════════════════════ */

/**
 * Maps a raw value onto 0–100 using three national anchor points.
 * Piecewise-linear rather than a z-score because property data is heavily
 * right-skewed — a z-score would push most areas into a narrow band and
 * let a handful of London outliers dominate the scale.
 */
function normalise(
  value: number,
  anchors: { p10: number; p50: number; p90: number },
  /** true when a HIGHER raw value should produce a LOWER score (crime, price) */
  inverted = false,
): number {
  const { p10, p50, p90 } = anchors;
  let score: number;

  if (value <= p10) {
    score = 10 * (value / Math.max(p10, 0.0001));
  } else if (value <= p50) {
    score = 10 + 40 * ((value - p10) / Math.max(p50 - p10, 0.0001));
  } else if (value <= p90) {
    score = 50 + 40 * ((value - p50) / Math.max(p90 - p50, 0.0001));
  } else {
    // Compress the long tail so extreme outliers can't exceed 100
    score = 90 + 10 * Math.min(1, (value - p90) / Math.max(p90, 0.0001));
  }

  score = clamp(score, 0, 100);
  return inverted ? 100 - score : score;
}

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

const round = (n: number): number => Math.round(n);

/* ══════════════════════════════════════════════════════
   DIMENSION SCORING
   Each returns 0–100, or null when the underlying data is missing.
   Null is deliberate: a missing dimension must not be silently
   scored as zero, which would misrepresent the area.
   ══════════════════════════════════════════════════════ */

export function scoreSchools(i: RawAreaInputs): number | null {
  if (i.goodSchoolShare === null) return null;
  // Share of good/outstanding provision is the main signal; choice
  // (school count) is a secondary modifier worth up to 12 points.
  const base = i.goodSchoolShare * 88;
  const choice = i.schoolCount === null ? 6 : clamp(i.schoolCount / 12, 0, 1) * 12;
  return round(clamp(base + choice, 0, 100));
}

export function scoreSafety(i: RawAreaInputs, b: NationalBaseline): number | null {
  if (i.crimePer1000 === null) return null;
  return round(normalise(i.crimePer1000, b.crimePer1000, true));
}

export function scoreTransport(i: RawAreaInputs, b: NationalBaseline): number | null {
  if (i.minsToStation === null && i.transportStops === null) return null;
  const proximity =
    i.minsToStation === null ? null : normalise(i.minsToStation, b.minsToStation, true);
  const density =
    i.transportStops === null ? null : normalise(i.transportStops, b.transportStops);

  if (proximity === null) return round(density!);
  if (density === null) return round(proximity);
  // Proximity to fast transit matters more than sheer stop count
  return round(proximity * 0.62 + density * 0.38);
}

export function scoreGreenSpace(i: RawAreaInputs, b: NationalBaseline): number | null {
  if (i.greenSpaceShare === null && i.metresToPark === null) return null;
  const share =
    i.greenSpaceShare === null ? null : normalise(i.greenSpaceShare, b.greenSpaceShare);
  // 300m is the widely used "accessible green space" walking threshold
  const access =
    i.metresToPark === null ? null : clamp(100 - (i.metresToPark / 1200) * 100, 0, 100);

  if (share === null) return round(access!);
  if (access === null) return round(share);
  return round(share * 0.55 + access * 0.45);
}

export function scoreAmenities(i: RawAreaInputs, b: NationalBaseline): number | null {
  if (i.amenityCount === null) return null;
  return round(normalise(i.amenityCount, b.amenityCount));
}

export function scoreAffordability(i: RawAreaInputs, b: NationalBaseline): number | null {
  if (i.medianPrice === null || i.medianEarnings === null || i.medianEarnings <= 0) {
    return null;
  }
  const ratio = i.medianPrice / i.medianEarnings;
  return round(normalise(ratio, b.priceToEarnings, true));
}

/* ══════════════════════════════════════════════════════
   DERIVED MARKET METRICS
   ══════════════════════════════════════════════════════ */

export function grossYield(i: RawAreaInputs): number | null {
  if (i.medianRent === null || i.medianPrice === null || i.medianPrice <= 0) return null;
  return Number((((i.medianRent * 12) / i.medianPrice) * 100).toFixed(1));
}

/** Net new supply per 1,000 residents — high values signal rent softening risk */
export function supplyPressure(i: RawAreaInputs): number | null {
  if (i.planningApprovals === null || !i.population) return null;
  return Number(((i.planningApprovals / i.population) * 1000).toFixed(2));
}

/* ══════════════════════════════════════════════════════
   COMPOSITE SCORES
   ══════════════════════════════════════════════════════ */

/**
 * Weights for the liveability score. These are editorial judgements, not
 * empirical truths — documented here so they can be argued with, and
 * versioned so changes are traceable.
 *
 * Rationale: schools and safety dominate family relocation decisions in
 * UK survey data; affordability is weighted meaningfully because a
 * "liveable" area nobody can afford is not useful guidance.
 */
export const LIVEABILITY_WEIGHTS = {
  schools: 0.22,
  safety: 0.22,
  transport: 0.18,
  amenities: 0.15,
  green: 0.13,
  affordability: 0.10,
} as const;

export interface DimensionScores {
  schools: number | null;
  safety: number | null;
  transport: number | null;
  green: number | null;
  amenities: number | null;
  affordability: number | null;
}

export interface ScoreResult {
  score: number | null;
  /** 0–1: share of weight backed by real data. Below 0.6 we don't publish. */
  confidence: number;
  /** Which dimensions were missing — surfaced in the admin data-quality view */
  missing: string[];
  version: string;
}

export function computeDimensions(
  i: RawAreaInputs,
  b: NationalBaseline = DEFAULT_BASELINE,
): DimensionScores {
  return {
    schools: scoreSchools(i),
    safety: scoreSafety(i, b),
    transport: scoreTransport(i, b),
    green: scoreGreenSpace(i, b),
    amenities: scoreAmenities(i, b),
    affordability: scoreAffordability(i, b),
  };
}

/**
 * Realvian Score — liveability.
 *
 * Missing dimensions are excluded and the remaining weights renormalised,
 * rather than substituted with an average. Substituting invents data;
 * renormalising is honest about what we actually know, and the confidence
 * figure tells the reader how much to trust it.
 */
export function computeRealvianScore(d: DimensionScores): ScoreResult {
  let weighted = 0;
  let weightUsed = 0;
  const missing: string[] = [];

  for (const [key, weight] of Object.entries(LIVEABILITY_WEIGHTS)) {
    const value = d[key as keyof DimensionScores];
    if (value === null) {
      missing.push(key);
      continue;
    }
    weighted += value * weight;
    weightUsed += weight;
  }

  const confidence = Number(weightUsed.toFixed(2));

  // Below 60% weight coverage the number is not defensible — withhold it.
  if (weightUsed < 0.6) {
    return { score: null, confidence, missing, version: SCORING_VERSION };
  }

  return {
    score: round(weighted / weightUsed),
    confidence,
    missing,
    version: SCORING_VERSION,
  };
}

/**
 * Investment Score.
 *
 * Deliberately a different shape from liveability: an excellent investment
 * and an excellent place to live are frequently not the same area, and
 * collapsing both into one number would destroy the most useful insight
 * the platform offers.
 */
export const INVESTMENT_WEIGHTS = {
  yield: 0.32,
  growth: 0.26,
  demand: 0.20,
  supplyRisk: 0.12,
  liveability: 0.10,
} as const;

export function computeInvestmentScore(
  i: RawAreaInputs,
  liveabilityScore: number | null,
  b: NationalBaseline = DEFAULT_BASELINE,
): ScoreResult {
  const missing: string[] = [];
  let weighted = 0;
  let weightUsed = 0;

  const add = (key: keyof typeof INVESTMENT_WEIGHTS, value: number | null) => {
    if (value === null) {
      missing.push(key);
      return;
    }
    weighted += clamp(value, 0, 100) * INVESTMENT_WEIGHTS[key];
    weightUsed += INVESTMENT_WEIGHTS[key];
  };

  const gy = grossYield(i);
  add("yield", gy === null ? null : normalise(gy, b.grossYield));

  add(
    "growth",
    i.fiveYearPriceChange === null
      ? null
      : normalise(i.fiveYearPriceChange, b.fiveYearPriceChange),
  );

  // Fast-selling stock indicates real demand — inverted, fewer days is better
  add(
    "demand",
    i.daysOnMarket === null ? null : normalise(i.daysOnMarket, b.daysOnMarket, true),
  );

  // Heavy incoming supply is a risk to future rents; 4 units per 1,000
  // residents is treated as the point where pressure becomes material.
  const sp = supplyPressure(i);
  add("supplyRisk", sp === null ? null : clamp(100 - (sp / 4) * 100, 0, 100));

  add("liveability", liveabilityScore);

  const confidence = Number(weightUsed.toFixed(2));
  if (weightUsed < 0.6) {
    return { score: null, confidence, missing, version: SCORING_VERSION };
  }

  return {
    score: round(weighted / weightUsed),
    confidence,
    missing,
    version: SCORING_VERSION,
  };
}

/* ══════════════════════════════════════════════════════
   EXPLANATION — powers "why is this 87?"
   ══════════════════════════════════════════════════════ */
export interface ScoreContribution {
  dimension: string;
  label: string;
  score: number;
  weight: number;
  /** Points this dimension contributed to the final score */
  contribution: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  schools: "Schools",
  safety: "Safety",
  transport: "Transport",
  green: "Green space",
  amenities: "Amenities",
  affordability: "Affordability",
};

export function explainRealvianScore(d: DimensionScores): ScoreContribution[] {
  const present = Object.entries(LIVEABILITY_WEIGHTS).filter(
    ([k]) => d[k as keyof DimensionScores] !== null,
  );
  const totalWeight = present.reduce((sum, [, w]) => sum + w, 0);

  return present
    .map(([key, weight]) => {
      const score = d[key as keyof DimensionScores]!;
      const effectiveWeight = weight / totalWeight;
      return {
        dimension: key,
        label: DIMENSION_LABELS[key] ?? key,
        score,
        weight: Number(effectiveWeight.toFixed(3)),
        contribution: Number((score * effectiveWeight).toFixed(1)),
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

/** Consistent language for a score. Used in copy, badges and alt text. */
export function scoreBand(score: number): {
  label: string;
  description: string;
} {
  if (score >= 88)
    return {
      label: "Exceptional",
      description: "Among the strongest areas nationally across most dimensions",
    };
  if (score >= 80)
    return { label: "Strong", description: "Performs well above the national median" };
  if (score >= 72)
    return { label: "Good", description: "Solid across most dimensions with some trade-offs" };
  if (score >= 60)
    return { label: "Mixed", description: "Notable strengths offset by clear weaknesses" };
  return {
    label: "Challenging",
    description: "Below the national median on most dimensions",
  };
}
