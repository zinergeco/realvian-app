import { describe, it, expect } from "vitest";
import { calculateSdlt, calculateMortgage, calculateYield, calculateRoi } from "./calculators";

describe("calculateSdlt", () => {
  // These three reference values are independently verified against
  // GOV.UK's published worked examples — see the comment block at the
  // top of calculators.ts. If any of these three break, someone
  // changed the tax bands or the calculation logic, and it needs a
  // human to re-verify against GOV.UK before merging, not just make
  // the test pass again.
  it("matches GOV.UK's worked example: £250,000 standard → £2,500", () => {
    expect(calculateSdlt(250_000, "standard").totalTax).toBe(2500);
  });

  it("matches GOV.UK's worked example: £400,000 standard → £10,000", () => {
    expect(calculateSdlt(400_000, "standard").totalTax).toBe(10_000);
  });

  it("matches GOV.UK's worked example: £500,000 standard → £15,000", () => {
    expect(calculateSdlt(500_000, "standard").totalTax).toBe(15_000);
  });

  it("charges nothing below the £125,000 nil-rate threshold", () => {
    expect(calculateSdlt(100_000, "standard").totalTax).toBe(0);
  });

  it("applies first-time buyer relief up to £300,000", () => {
    expect(calculateSdlt(300_000, "first-time").totalTax).toBe(0);
  });

  it("cuts FTB relief off entirely above £500,000 — a cliff-edge, not a taper", () => {
    // This is the specific behaviour the code comments call out as
    // "the detail most calculators get wrong" — worth a named test
    // precisely because it's the easy mistake to reintroduce.
    const justUnder = calculateSdlt(500_000, "first-time");
    const justOver = calculateSdlt(500_001, "first-time");
    const standardOnMillion = calculateSdlt(500_001, "standard");

    expect(justUnder.ftbReliefApplied).toBe(true);
    expect(justOver.ftbReliefApplied).toBe(false);
    // Above the cliff, an FTB purchase is taxed at the full standard
    // rate on the whole price — not a reduced or tapered rate.
    expect(justOver.totalTax).toBe(standardOnMillion.totalTax);
  });

  it("applies the 5% additional-property surcharge on top of standard rates", () => {
    const standard = calculateSdlt(250_000, "standard");
    const additional = calculateSdlt(250_000, "additional");
    // Surcharge is 5% of the full price, added on top of standard SDLT.
    expect(additional.totalTax).toBe(standard.totalTax + 250_000 * 0.05);
    expect(additional.surchargeApplied).toBe(true);
  });
});

describe("calculateMortgage", () => {
  it("matches the independently-computed amortisation formula for £200k @ 5%/25yr", () => {
    // income £50,000 × 4.5 multiplier would exceed £200k, so use a
    // multiplier of 4.0 to land on a clean £200,000 loan for this
    // specific, precisely-verifiable reference case.
    const result = calculateMortgage(50_000, 0, 5, 25, 4.0);
    expect(result.maxLoan).toBe(200_000);
    // Verified independently in Python against the standard
    // amortisation formula: 1169.18, rounds to 1169.
    expect(result.monthlyPayment).toBe(1169);
  });

  it("adds the deposit on top of the borrowing capacity for max property price", () => {
    const result = calculateMortgage(50_000, 30_000, 5, 25, 4.0);
    expect(result.maxLoan).toBe(200_000);
    expect(result.maxPropertyPrice).toBe(230_000);
  });

  it("handles a zero interest rate without dividing by zero", () => {
    const result = calculateMortgage(50_000, 0, 0, 25, 4.0);
    // At 0% interest, monthly payment is simply loan / numPayments.
    expect(result.monthlyPayment).toBe(Math.round(200_000 / 300));
    expect(result.totalInterest).toBe(0);
  });

  it("returns zero, not NaN or a crash, for zero income", () => {
    const result = calculateMortgage(0, 10_000, 5, 25);
    expect(result.maxLoan).toBe(0);
    expect(result.monthlyPayment).toBe(0);
    expect(Number.isFinite(result.monthlyPayment)).toBe(true);
  });
});

describe("calculateYield", () => {
  it("computes gross and net yield correctly for a known case", () => {
    // £1,000/month rent = £12,000/year on a £200,000 property = 6% gross.
    const result = calculateYield(200_000, 1000, 2000);
    expect(result.annualRent).toBe(12_000);
    expect(result.grossYieldPct).toBe(6);
    // Net: (12,000 - 2,000) / 200,000 = 5%.
    expect(result.netYieldPct).toBe(5);
  });

  it("returns zero yield rather than dividing by zero for a £0 purchase price", () => {
    const result = calculateYield(0, 1000, 0);
    expect(result.grossYieldPct).toBe(0);
    expect(result.netYieldPct).toBe(0);
  });
});

describe("calculateRoi", () => {
  it("uses an interest-only assumption for mortgage interest, deliberately", () => {
    // £150,000 loan @ 5% interest-only = £7,500/year interest,
    // regardless of term — there's no amortisation term parameter,
    // which is the point: this function is interest-only by design.
    const result = calculateRoi(200_000, 50_000, 5_000, 5, 1_200, 2_000);
    expect(result.cashInvested).toBe(55_000);
    expect(result.annualMortgageInterest).toBe(7_500);
    // Net cash flow: (1200*12) - 2000 - 7500 = 4900
    expect(result.annualNetCashFlow).toBe(4_900);
    // Cash-on-cash: 4900 / 55000 * 100 = 8.909...% → rounds to 8.91
    expect(result.cashOnCashReturnPct).toBe(8.91);
  });

  it("returns zero return rather than dividing by zero for £0 cash invested", () => {
    const result = calculateRoi(200_000, 0, 0, 5, 1_200, 2_000);
    expect(result.cashOnCashReturnPct).toBe(0);
  });
});
