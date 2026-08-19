export const ILLUSTRATIVE_DEAL_ASSUMPTIONS = {
  maximumLtv: 0.75,
  mortgageRate: 0.07,
  amortizationYears: 25,
  roeImprovementForFullScore: 5,
} as const;

export function amortizedAnnualPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const payments = years * 12;
  if (monthlyRate === 0) return principal / years;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments)) * 12;
}

const moneyMillions = (value: number) => `$${(value / 1_000_000).toFixed(2)}M`;
const moneyThousands = (value: number) => `$${Math.round(value / 1_000)}K`;
const signedMoneyThousands = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.round(Math.abs(value) / 1_000)}K / yr`;
const percentage = (value: number) => `${(value * 100).toFixed(1)}%`;
const signedPercentagePoints = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;

const CURRENT_PROPERTY_VALUES = {
  value: 2_400_000,
  loan: 1_200_000,
  noi: 180_000,
  annualDebtService: 102_000,
} as const;

const currentEquity = CURRENT_PROPERTY_VALUES.value - CURRENT_PROPERTY_VALUES.loan;
const currentCashFlow = CURRENT_PROPERTY_VALUES.noi - CURRENT_PROPERTY_VALUES.annualDebtService;
const currentRoe = currentCashFlow / currentEquity;
const purchasingCapacity = currentEquity / (1 - ILLUSTRATIVE_DEAL_ASSUMPTIONS.maximumLtv);

export const CURRENT_PROPERTY = {
  address: "214 Shrewsbury Street",
  market: "Worcester, MA",
  image: "/mf-4.jpg",
  raw: { ...CURRENT_PROPERTY_VALUES, equity: currentEquity, cashFlow: currentCashFlow, roe: currentRoe, purchasingCapacity },
  value: moneyMillions(CURRENT_PROPERTY_VALUES.value),
  loan: moneyMillions(CURRENT_PROPERTY_VALUES.loan),
  equity: moneyMillions(currentEquity),
  ltv: percentage(CURRENT_PROPERTY_VALUES.loan / CURRENT_PROPERTY_VALUES.value),
  noi: moneyThousands(CURRENT_PROPERTY_VALUES.noi),
  debtService: moneyThousands(CURRENT_PROPERTY_VALUES.annualDebtService),
  cashFlow: moneyThousands(currentCashFlow),
  roe: percentage(currentRoe),
  buyingRange: moneyMillions(purchasingCapacity),
} as const;

type MatchSeed = {
  address: string;
  type: string;
  market: string;
  image: string;
  description: string;
  price: number;
  noi: number;
  qualityAdjustment: number;
};

export function buildIllustrativeMatch(seed: MatchSeed) {
  const replacementLoan = seed.price - currentEquity;
  const ltv = replacementLoan / seed.price;
  const debtService = amortizedAnnualPayment(
    replacementLoan,
    ILLUSTRATIVE_DEAL_ASSUMPTIONS.mortgageRate,
    ILLUSTRATIVE_DEAL_ASSUMPTIONS.amortizationYears,
  );
  const cashFlow = seed.noi - debtService;
  const roe = cashFlow / currentEquity;
  const roeImprovement = (roe - currentRoe) * 100;
  const roeComponent = Math.min(100, Math.max(0, roeImprovement / ILLUSTRATIVE_DEAL_ASSUMPTIONS.roeImprovementForFullScore * 100));
  const score = Math.round(Math.min(100, roeComponent * 0.7 + 100 * 0.3 + seed.qualityAdjustment));
  const cashBoot = Math.max(0, currentEquity - seed.price);
  const mortgageBoot = Math.max(0, CURRENT_PROPERTY_VALUES.loan - replacementLoan);

  return {
    ...seed,
    raw: { replacementLoan, ltv, debtService, cashFlow, roe, roeImprovement, cashBoot, mortgageBoot, score },
    price: moneyMillions(seed.price),
    capRate: percentage(seed.noi / seed.price),
    noi: moneyThousands(seed.noi),
    equity: moneyMillions(currentEquity),
    loan: moneyMillions(replacementLoan),
    debtService: moneyThousands(debtService),
    cashFlow: moneyThousands(cashFlow),
    roe: percentage(roe),
    roeImprovement: signedPercentagePoints(roeImprovement),
    ltv: percentage(ltv),
    valueIncrease: `+$${((seed.price - CURRENT_PROPERTY_VALUES.value) / 1_000_000).toFixed(2)}M`,
    noiChange: signedMoneyThousands(seed.noi - CURRENT_PROPERTY_VALUES.noi),
    cashFlowChange: signedMoneyThousands(cashFlow - currentCashFlow),
    estimatedBoot: moneyThousands(cashBoot + mortgageBoot),
    score,
  };
}

export const ILLUSTRATIVE_MATCHES = [
  buildIllustrativeMatch({
    address: "184 River Avenue",
    type: "Multifamily",
    market: "Providence, RI",
    image: "/mf-1.jpg",
    description: "A 28-unit multifamily property with stabilized occupancy near Providence employment centers.",
    price: 4_000_000,
    noi: 364_000,
    qualityAdjustment: 3,
  }),
  buildIllustrativeMatch({
    address: "675 Harvey Road",
    type: "Industrial",
    market: "Manchester, NH",
    image: "/landing-prop-industrial.jpg",
    description: "A multi-tenant industrial property with flexible bays and direct regional highway access.",
    price: 4_400_000,
    noi: 390_000,
    qualityAdjustment: 3,
  }),
] as const;

export const ILLUSTRATIVE_CLIENT = {
  name: "Elaine Thomas",
  initials: "ET",
} as const;

export const ILLUSTRATIVE_LISTING_AGENT = {
  name: "Jordan Lee",
  initials: "JL",
  brokerage: "Northeast Commercial Realty",
} as const;

export const ILLUSTRATIVE_OPENING_MESSAGE =
  "Hi Jordan, my client is interested in 184 River Avenue. Could you send the OM and latest T-12?";
