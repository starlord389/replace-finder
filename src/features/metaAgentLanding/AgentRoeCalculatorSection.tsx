import { useMemo, useState } from "react";
import { Calculator, CircleDollarSign, Landmark, TrendingUp } from "lucide-react";
import { AgentLandingCta } from "@/features/metaAgentLanding/AgentLandingCta";
import { calculateRoe } from "@/features/metaAgentLanding/agentRoeCalculator";

const DEFAULT_VALUES = {
  propertyValue: "2400000",
  loanBalance: "1200000",
  annualNoi: "180000",
  annualDebtService: "102000",
  additionalCash: "0",
} as const;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function toAmount(value: string) {
  if (value.trim() === "") return 0;
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

type CalculatorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  help: string;
};

function CalculatorField({
  id,
  label,
  value,
  onChange,
  optional = false,
  help,
}: CalculatorFieldProps) {
  return (
    <div className="agent-roe-card__field">
      <label htmlFor={id}>
        <span>{label}</span>
        {optional ? <small>Optional</small> : null}
      </label>
      <div className="agent-roe-card__input-wrap">
        <span aria-hidden="true">$</span>
        <input
          id={id}
          aria-describedby={`${id}-help`}
          type="number"
          inputMode="decimal"
          min="0"
          step="1000"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <small id={`${id}-help`} className="agent-roe-card__help">{help}</small>
    </div>
  );
}

type AgentRoeCalculatorSectionProps = {
  ctaDestination: string;
  onCtaClick: (location: "calculator") => void;
};

export function AgentRoeCalculatorSection({
  ctaDestination,
  onCtaClick,
}: AgentRoeCalculatorSectionProps) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES });

  const result = useMemo(() => calculateRoe({
    propertyValue: toAmount(values.propertyValue),
    loanBalance: toAmount(values.loanBalance),
    annualNoi: toAmount(values.annualNoi),
    annualDebtService: toAmount(values.annualDebtService),
    additionalCash: toAmount(values.additionalCash),
  }), [values]);

  const updateValue = (field: keyof typeof values) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const formattedRoe = result.currentRoe == null
    ? "Not available"
    : percentageFormatter.format(result.currentRoe);

  return (
    <section id="roe-calculator" aria-labelledby="roe-calculator-title" className="agent-roe">
      <svg className="agent-roe__field" viewBox="0 0 1600 980" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 180 H324 V0 M324 180 H602 V422 H870 V132 H1180 V338 H1600" />
        <path d="M0 760 H248 V540 H548 V910 H864 V632 H1180 V980 M1400 0 V186 H1600" />
        <path className="active" d="M-80 820 C220 820 260 668 520 668 S788 790 1010 492 1296 300 1680 300" />
      </svg>

      <div className="agent-landing-shell agent-roe__layout">
        <div className="agent-roe__copy" data-agent-reveal>
          <p className="agent-eyebrow agent-eyebrow--light">Return on Equity Calculator</p>
          <h2 id="roe-calculator-title">Show clients what their equity is actually earning.</h2>
          <p>
            Enter the current property’s value, debt, and income to calculate its return on equity and estimated purchasing capacity.
          </p>

          <div className="agent-roe__formula" aria-label="Return on equity formula">
            <span><TrendingUp aria-hidden="true" /></span>
            <div>
              <small>Return on equity</small>
              <strong>Annual cash flow ÷ current equity</strong>
              <p>ExchangeUp uses this result as the baseline when evaluating replacement properties.</p>
            </div>
          </div>
        </div>

        <div className="agent-roe-card" data-agent-reveal>
          <div className="agent-roe-card__topbar">
            <span><Calculator aria-hidden="true" /> Current property</span>
            <small><i aria-hidden="true" /> Live estimate</small>
          </div>

          <div className="agent-roe-card__fields">
            <CalculatorField
              id="roe-property-value"
              label="Current property value"
              value={values.propertyValue}
              onChange={updateValue("propertyValue")}
              help="Estimated current market value"
            />
            <CalculatorField
              id="roe-loan-balance"
              label="Current loan balance"
              value={values.loanBalance}
              onChange={updateValue("loanBalance")}
              help="Outstanding mortgage balance"
            />
            <CalculatorField
              id="roe-annual-noi"
              label="Annual NOI"
              value={values.annualNoi}
              onChange={updateValue("annualNoi")}
              help="Income after operating expenses"
            />
            <CalculatorField
              id="roe-debt-service"
              label="Annual debt service"
              value={values.annualDebtService}
              onChange={updateValue("annualDebtService")}
              help="Annual principal and interest payments"
            />
            <CalculatorField
              id="roe-additional-cash"
              label="Additional exchange cash"
              value={values.additionalCash}
              onChange={updateValue("additionalCash")}
              optional
              help="Additional equity available for the next purchase"
            />
          </div>

          <div className="agent-roe-card__results" aria-live="polite">
            {result.hasPositiveEquity ? (
              <>
                <div className="agent-roe-card__primary-result">
                  <span><TrendingUp aria-hidden="true" /></span>
                  <div>
                    <small>Current return on equity</small>
                    <strong data-testid="roe-result">{formattedRoe}</strong>
                    <p>
                      {currencyFormatter.format(result.annualCashFlow)} annual cash flow ÷ {currencyFormatter.format(result.equity)} equity
                    </p>
                  </div>
                </div>

                <dl className="agent-roe-card__metrics">
                  <div>
                    <dt><CircleDollarSign aria-hidden="true" /> Current equity</dt>
                    <dd data-testid="equity-result">{currencyFormatter.format(result.equity)}</dd>
                  </div>
                  <div>
                    <dt><TrendingUp aria-hidden="true" /> Annual cash flow</dt>
                    <dd data-testid="cash-flow-result">{currencyFormatter.format(result.annualCashFlow)}</dd>
                  </div>
                  <div>
                    <dt><Landmark aria-hidden="true" /> Capacity at 75% max LTV</dt>
                    <dd data-testid="capacity-result">{currencyFormatter.format(result.purchasingCapacity)}</dd>
                  </div>
                </dl>

                <p className="agent-roe-card__insight">
                  ExchangeUp searches for replacement properties projected to improve on this {formattedRoe} baseline.
                </p>
              </>
            ) : (
              <div className="agent-roe-card__empty" role="status">
                <CircleDollarSign aria-hidden="true" />
                <div>
                  <strong>Positive equity is required</strong>
                  <p>Enter a property value greater than the current loan balance to calculate return on equity.</p>
                </div>
              </div>
            )}

            <div className="agent-roe-card__action">
              <AgentLandingCta
                destination={ctaDestination}
                location="calculator"
                onClick={onCtaClick}
              />
              <p>Illustrative estimate only. Not tax, legal, lending, or investment advice.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
