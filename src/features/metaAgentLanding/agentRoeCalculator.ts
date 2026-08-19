import { ILLUSTRATIVE_DEAL_ASSUMPTIONS } from "@/features/metaAgentLanding/agentWorkflowData";

export type RoeCalculatorInputs = {
  propertyValue: number;
  loanBalance: number;
  annualNoi: number;
  annualDebtService: number;
  additionalCash: number;
};

export type RoeCalculatorResult = {
  equity: number;
  annualCashFlow: number;
  currentRoe: number | null;
  purchasingCapacity: number;
  hasPositiveEquity: boolean;
};

export function calculateRoe(inputs: RoeCalculatorInputs): RoeCalculatorResult {
  const propertyValue = Math.max(0, inputs.propertyValue);
  const loanBalance = Math.max(0, inputs.loanBalance);
  const annualNoi = Math.max(0, inputs.annualNoi);
  const annualDebtService = Math.max(0, inputs.annualDebtService);
  const additionalCash = Math.max(0, inputs.additionalCash);
  const equity = propertyValue - loanBalance;
  const hasPositiveEquity = propertyValue > 0 && equity > 0;
  const annualCashFlow = annualNoi - annualDebtService;
  const currentRoe = hasPositiveEquity ? annualCashFlow / equity : null;
  const purchasingCapacity = hasPositiveEquity
    ? (equity + additionalCash) / (1 - ILLUSTRATIVE_DEAL_ASSUMPTIONS.maximumLtv)
    : 0;

  return {
    equity,
    annualCashFlow,
    currentRoe,
    purchasingCapacity,
    hasPositiveEquity,
  };
}
