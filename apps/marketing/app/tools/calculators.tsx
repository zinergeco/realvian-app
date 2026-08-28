"use client";

import { useMemo, useState } from "react";
import { Badge, Card, cx } from "@/components/ui";
import { AmortizationChart } from "@/components/amortization-chart";
import { SdltBandChart } from "@/components/sdlt-band-chart";
import {
  calculateMortgage,
  calculateAmortizationSchedule,
  calculateSdlt,
  calculateYield,
  calculateRoi,
  type BuyerType,
} from "@/lib/calculators";

const TABS = ["Mortgage", "Stamp duty", "Rental yield", "Return (ROI)"] as const;
type Tab = (typeof TABS)[number];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

/* ══════════════════════════════════════════════════════
   SHARED INPUT PRIMITIVES — controlled, for live recompute
   ══════════════════════════════════════════════════════ */
function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          step={step}
          className={cx(
            "w-full py-2.5 bg-[var(--bg-subtle)] text-[var(--text-primary)]",
            "border border-[var(--border-strong)] rounded-[var(--radius-md)] text-[14px]",
            "outline-none transition-colors focus:border-[var(--primary)]",
            prefix ? "pl-8 pr-3.5" : "px-3.5",
            suffix ? "pr-10" : "",
          )}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="block text-[11.5px] text-[var(--text-muted)] mt-1.5">{hint}</span>}
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="block text-[12.5px] font-medium text-[var(--text-primary)] mb-1.5">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "px-3.5 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium border transition-colors",
              value === opt.value
                ? "bg-[var(--primary-subtle)] border-[var(--primary-border)] text-[var(--primary)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--text-secondary)]",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className={cx("text-[13.5px]", emphasis ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-muted)]")}>
        {label}
      </span>
      <span
        className={cx("tnum text-[15px]", emphasis ? "font-semibold" : "font-medium")}
        style={{ color: emphasis ? "var(--primary)" : "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MORTGAGE AFFORDABILITY
   ══════════════════════════════════════════════════════ */
function MortgageCalculator() {
  const [income, setIncome] = useState(50000);
  const [deposit, setDeposit] = useState(40000);
  const [rate, setRate] = useState(5);
  const [term, setTerm] = useState(25);
  const [multiplier, setMultiplier] = useState(4.5);

  const result = useMemo(
    () => calculateMortgage(income, deposit, rate, term, multiplier),
    [income, deposit, rate, term, multiplier],
  );
  const schedule = useMemo(
    () => calculateAmortizationSchedule(result.maxLoan, rate, term),
    [result.maxLoan, rate, term],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <NumberField label="Annual income (combined if joint)" value={income} onChange={setIncome} prefix="£" step={1000} />
        <NumberField label="Deposit" value={deposit} onChange={setDeposit} prefix="£" step={1000} />
        <NumberField label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.1} />
        <NumberField label="Mortgage term" value={term} onChange={setTerm} suffix="years" step={1} />
        <NumberField
          label="Income multiplier"
          value={multiplier}
          onChange={setMultiplier}
          suffix="×"
          step={0.1}
          hint="Most lenders offer 4–4.5×. Actual offers depend on credit history and existing debt."
        />
      </Card>
      <Card className="p-6">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
          Estimate
        </h3>
        <ResultRow label="Estimated maximum loan" value={fmtGBP(result.maxLoan)} />
        <ResultRow label="Estimated maximum property price" value={fmtGBP(result.maxPropertyPrice)} emphasis />
        <ResultRow label="Estimated monthly payment" value={fmtGBP(result.monthlyPayment)} />
        <ResultRow label="Total interest over term" value={fmtGBP(result.totalInterest)} />
        {schedule.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <p className="text-[12px] text-[var(--text-muted)] mb-3">
              How your balance and interest paid change over the {term}-year term
            </p>
            <AmortizationChart schedule={schedule} />
          </div>
        )}
        <p className="text-[12px] text-[var(--text-muted)] mt-4 pt-4 border-t border-[var(--border)]">
          This is a planning estimate, not a mortgage offer or advice. Get a
          decision in principle from a broker or lender for a figure you can
          actually rely on.
        </p>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STAMP DUTY
   ══════════════════════════════════════════════════════ */
function StampDutyCalculator() {
  const [price, setPrice] = useState(350000);
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");

  const result = useMemo(() => calculateSdlt(price, buyerType), [price, buyerType]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <NumberField label="Purchase price" value={price} onChange={setPrice} prefix="£" step={5000} />
        <SegmentedControl
          label="Buyer type"
          value={buyerType}
          onChange={setBuyerType}
          options={[
            { value: "standard", label: "Standard" },
            { value: "first-time", label: "First-time buyer" },
            { value: "additional", label: "Additional property" },
          ]}
        />
        <p className="text-[11.5px] text-[var(--text-muted)]">
          England &amp; Northern Ireland only. Scotland (LBTT) and Wales
          (LTT) use different bands — see{" "}
          <a href="https://www.gov.uk/stamp-duty-land-tax" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
            gov.uk
          </a>.
        </p>
      </Card>
      <Card className="p-6">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
          Breakdown
        </h3>
        {result.bands.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-muted)]">Enter a purchase price.</p>
        ) : (
          <>
            {result.bands.map((b) => (
              <ResultRow
                key={b.from}
                label={`${fmtGBP(b.from)} – ${b.to ? fmtGBP(b.to) : "above"} @ ${(b.rate * 100).toFixed(0)}%`}
                value={fmtGBP(b.tax)}
              />
            ))}
            <div className="my-4">
              <SdltBandChart bands={result.bands} />
            </div>
            <ResultRow label="Total Stamp Duty" value={fmtGBP(result.totalTax)} emphasis />
            <ResultRow label="Effective rate" value={`${(result.effectiveRate * 100).toFixed(2)}%`} />
          </>
        )}
        {result.ftbReliefApplied && (
          <div className="mt-3">
            <Badge tone="primary">First-time buyer relief applied</Badge>
          </div>
        )}
        {buyerType === "first-time" && price > 500000 && (
          <p className="text-[12px] mt-3" style={{ color: "var(--color-gold)" }}>
            First-time buyer relief doesn't apply above £500,000 — standard
            rates apply to the full price.
          </p>
        )}
        <p className="text-[12px] text-[var(--text-muted)] mt-4 pt-4 border-t border-[var(--border)]">
          Informational estimate, not a tax return. Confirm the exact figure
          with your solicitor or HMRC's own calculator before completion.
        </p>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RENTAL YIELD
   ══════════════════════════════════════════════════════ */
function YieldCalculator() {
  const [price, setPrice] = useState(280000);
  const [rent, setRent] = useState(1400);
  const [costs, setCosts] = useState(2500);

  const result = useMemo(() => calculateYield(price, rent, costs), [price, rent, costs]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <NumberField label="Purchase price" value={price} onChange={setPrice} prefix="£" step={5000} />
        <NumberField label="Monthly rent" value={rent} onChange={setRent} prefix="£" step={50} />
        <NumberField
          label="Annual running costs"
          value={costs}
          onChange={setCosts}
          prefix="£"
          step={100}
          hint="Service charge, insurance, maintenance, letting agent fees, ground rent"
        />
      </Card>
      <Card className="p-6">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
          Yield
        </h3>
        <ResultRow label="Annual rent" value={fmtGBP(result.annualRent)} />
        <ResultRow label="Gross yield" value={`${result.grossYieldPct.toFixed(2)}%`} />
        <ResultRow label="Annual net income" value={fmtGBP(result.annualNetIncome)} />
        <ResultRow label="Net yield" value={`${result.netYieldPct.toFixed(2)}%`} emphasis />
        <p className="text-[12px] text-[var(--text-muted)] mt-4 pt-4 border-t border-[var(--border)]">
          Net yield here excludes mortgage costs — see the Return (ROI) tab
          for cash-on-cash return after financing.
        </p>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RETURN ON INVESTMENT
   ══════════════════════════════════════════════════════ */
function RoiCalculator() {
  const [price, setPrice] = useState(280000);
  const [deposit, setDeposit] = useState(70000);
  const [extraCosts, setExtraCosts] = useState(8000);
  const [rate, setRate] = useState(5.5);
  const [rent, setRent] = useState(1400);
  const [runningCosts, setRunningCosts] = useState(2500);

  const result = useMemo(
    () => calculateRoi(price, deposit, extraCosts, rate, rent, runningCosts),
    [price, deposit, extraCosts, rate, rent, runningCosts],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <NumberField label="Purchase price" value={price} onChange={setPrice} prefix="£" step={5000} />
        <NumberField label="Deposit" value={deposit} onChange={setDeposit} prefix="£" step={1000} />
        <NumberField
          label="Stamp duty + other costs"
          value={extraCosts}
          onChange={setExtraCosts}
          prefix="£"
          step={500}
          hint="Use the Stamp Duty tab to get this figure"
        />
        <NumberField label="Mortgage interest rate" value={rate} onChange={setRate} suffix="%" step={0.1} />
        <NumberField label="Monthly rent" value={rent} onChange={setRent} prefix="£" step={50} />
        <NumberField label="Annual running costs" value={runningCosts} onChange={setRunningCosts} prefix="£" step={100} />
      </Card>
      <Card className="p-6">
        <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase mb-4" style={{ color: "var(--primary)" }}>
          Cash-on-cash return
        </h3>
        <ResultRow label="Cash invested" value={fmtGBP(result.cashInvested)} />
        <ResultRow label="Annual mortgage interest" value={fmtGBP(result.annualMortgageInterest)} />
        <ResultRow label="Annual net cash flow" value={fmtGBP(result.annualNetCashFlow)} />
        <ResultRow label="Cash-on-cash return" value={`${result.cashOnCashReturnPct.toFixed(2)}%`} emphasis />
        <p className="text-[12px] text-[var(--text-muted)] mt-4 pt-4 border-t border-[var(--border)]">
          Assumes an interest-only mortgage, which is standard for most
          buy-to-let cash-flow planning. Doesn't include capital appreciation
          or void periods.
        </p>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SHELL
   ══════════════════════════════════════════════════════ */
export function Calculators() {
  const [tab, setTab] = useState<Tab>("Mortgage");

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-8 border-b border-[var(--border)] pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx(
              "px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Mortgage" && <MortgageCalculator />}
      {tab === "Stamp duty" && <StampDutyCalculator />}
      {tab === "Rental yield" && <YieldCalculator />}
      {tab === "Return (ROI)" && <RoiCalculator />}
    </div>
  );
}
