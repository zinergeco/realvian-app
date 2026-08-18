/**
 * PROPERTY CALCULATORS
 *
 * Pure functions, no React, no side effects — easy to verify in isolation
 * before any UI is built on top. SDLT rates verified against GOV.UK
 * (gov.uk/stamp-duty-land-tax/residential-property-rates) and cross-checked
 * against three independently published worked examples before being
 * treated as correct:
 *
 *   £250,000 standard purchase → £2,500   ✓
 *   £400,000 standard purchase → £10,000  ✓
 *   £500,000 standard purchase → £15,000  ✓
 *
 * Rates in force from 1 April 2025, unchanged through 2026. England &
 * Northern Ireland only — Scotland (LBTT) and Wales (LTT) are separate
 * systems with different bands; the UI must say so rather than imply
 * UK-wide coverage.
 */

/* ══════════════════════════════════════════════════════
   1. STAMP DUTY LAND TAX (England & Northern Ireland)
   ══════════════════════════════════════════════════════ */
export type BuyerType = "standard" | "first-time" | "additional";

export interface SdltBandResult {
  from: number;
  to: number | null; // null = no upper bound
  rate: number; // e.g. 0.02 for 2%
  taxableAmount: number;
  tax: number;
}

export interface SdltResult {
  bands: SdltBandResult[];
  totalTax: number;
  effectiveRate: number; // total tax / price, as a fraction
  ftbReliefApplied: boolean;
  surchargeApplied: boolean;
}

const STANDARD_BANDS: { upTo: number; rate: number }[] = [
  { upTo: 125_000, rate: 0 },
  { upTo: 250_000, rate: 0.02 },
  { upTo: 925_000, rate: 0.05 },
  { upTo: 1_500_000, rate: 0.1 },
  { upTo: Infinity, rate: 0.12 },
];

const FTB_BANDS: { upTo: number; rate: number }[] = [
  { upTo: 300_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
];

/** First-time buyer relief is a hard cliff, not a taper — above £500,000
 * it doesn't apply at all, and the purchase reverts to full standard
 * rates on the entire price. This is the detail most calculators get
 * wrong by tapering it instead of cutting it off. */
const FTB_RELIEF_CEILING = 500_000;

export function calculateSdlt(price: number, buyerType: BuyerType): SdltResult {
  if (!Number.isFinite(price) || price <= 0) {
    return { bands: [], totalTax: 0, effectiveRate: 0, ftbReliefApplied: false, surchargeApplied: false };
  }

  const ftbReliefApplied = buyerType === "first-time" && price <= FTB_RELIEF_CEILING;
  const surchargeApplied = buyerType === "additional";
  const surcharge = surchargeApplied ? 0.05 : 0;
  const baseBands = ftbReliefApplied ? FTB_BANDS : STANDARD_BANDS;

  const bands: SdltBandResult[] = [];
  let lower = 0;
  let totalTax = 0;

  for (const band of baseBands) {
    if (price <= lower) break;
    const taxableAmount = Math.min(price, band.upTo) - lower;
    const rate = band.rate + surcharge;
    const tax = taxableAmount * rate;
    bands.push({ from: lower, to: band.upTo === Infinity ? null : band.upTo, rate, taxableAmount, tax });
    totalTax += tax;
    lower = band.upTo;
  }

  return {
    bands,
    totalTax: Math.round(totalTax),
    effectiveRate: price > 0 ? totalTax / price : 0,
    ftbReliefApplied,
    surchargeApplied,
  };
}

/* ══════════════════════════════════════════════════════
   2. MORTGAGE AFFORDABILITY
   ══════════════════════════════════════════════════════ */
export interface MortgageResult {
  maxLoan: number;
  maxPropertyPrice: number;
  monthlyPayment: number;
  totalRepaid: number;
  totalInterest: number;
}

/**
 * Standard repayment-mortgage amortisation formula. The income multiplier
 * defaults to 4.5x, a commonly cited industry rule of thumb — real lender
 * offers vary by credit history, existing debt and individual stress
 * tests, which is why the UI must present this as an estimate, not a
 * guaranteed borrowing figure.
 */
export function calculateMortgage(
  annualIncome: number,
  deposit: number,
  interestRatePct: number,
  termYears: number,
  incomeMultiplier = 4.5,
): MortgageResult {
  const maxLoan = Math.max(0, annualIncome * incomeMultiplier);
  const maxPropertyPrice = maxLoan + deposit;

  const monthlyRate = interestRatePct / 100 / 12;
  const numPayments = termYears * 12;

  let monthlyPayment = 0;
  if (maxLoan > 0 && numPayments > 0) {
    monthlyPayment =
      monthlyRate === 0
        ? maxLoan / numPayments
        : (maxLoan * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const totalRepaid = monthlyPayment * numPayments;
  const totalInterest = totalRepaid - maxLoan;

  return {
    maxLoan: Math.round(maxLoan),
    maxPropertyPrice: Math.round(maxPropertyPrice),
    monthlyPayment: Math.round(monthlyPayment),
    totalRepaid: Math.round(totalRepaid),
    totalInterest: Math.round(totalInterest),
  };
}

/* ══════════════════════════════════════════════════════
   3. RENTAL YIELD
   ══════════════════════════════════════════════════════ */
export interface YieldResult {
  grossYieldPct: number;
  netYieldPct: number;
  annualRent: number;
  annualCosts: number;
  annualNetIncome: number;
}

export function calculateYield(
  purchasePrice: number,
  monthlyRent: number,
  annualCosts: number,
): YieldResult {
  const annualRent = monthlyRent * 12;
  const grossYieldPct = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
  const annualNetIncome = annualRent - annualCosts;
  const netYieldPct = purchasePrice > 0 ? (annualNetIncome / purchasePrice) * 100 : 0;

  return {
    grossYieldPct: Math.round(grossYieldPct * 100) / 100,
    netYieldPct: Math.round(netYieldPct * 100) / 100,
    annualRent,
    annualCosts,
    annualNetIncome,
  };
}

/* ══════════════════════════════════════════════════════
   4. CASH-ON-CASH RETURN (ROI)
   ══════════════════════════════════════════════════════ */
export interface RoiResult {
  cashInvested: number;
  annualMortgageInterest: number;
  annualNetCashFlow: number;
  cashOnCashReturnPct: number;
}

/**
 * Interest-only assumption is deliberate, not an oversight — the large
 * majority of UK buy-to-let mortgages are interest-only, and that's the
 * standard basis landlords use for cash-flow planning. A repayment
 * mortgage would show a misleadingly worse cash-on-cash figure for a
 * property that's actually being run on an interest-only basis.
 */
export function calculateRoi(
  purchasePrice: number,
  depositAmount: number,
  additionalCosts: number,
  interestRatePct: number,
  monthlyRent: number,
  annualRunningCosts: number,
): RoiResult {
  const cashInvested = depositAmount + additionalCosts;
  const loanAmount = Math.max(0, purchasePrice - depositAmount);
  const annualMortgageInterest = loanAmount * (interestRatePct / 100);
  const annualRent = monthlyRent * 12;
  const annualNetCashFlow = annualRent - annualRunningCosts - annualMortgageInterest;
  const cashOnCashReturnPct = cashInvested > 0 ? (annualNetCashFlow / cashInvested) * 100 : 0;

  return {
    cashInvested: Math.round(cashInvested),
    annualMortgageInterest: Math.round(annualMortgageInterest),
    annualNetCashFlow: Math.round(annualNetCashFlow),
    cashOnCashReturnPct: Math.round(cashOnCashReturnPct * 100) / 100,
  };
}
