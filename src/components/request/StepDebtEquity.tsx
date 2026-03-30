import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOAN_TYPE_OPTIONS } from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepDebtEquity({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Debt & Equity Position</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand your equity and debt structure for exchange planning.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proceeds">Estimated Exchange Proceeds ($) <span className="text-destructive">*</span></Label>
          <Input id="proceeds" type="number" placeholder="1,200,000" value={form.exchange_proceeds} onChange={(e) => update({ exchange_proceeds: e.target.value })} />
          <p className="text-xs text-muted-foreground">Net proceeds you expect to exchange.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equity">Estimated Equity ($) <span className="text-destructive">*</span></Label>
          <Input id="equity" type="number" placeholder="1,200,000" value={form.estimated_equity} onChange={(e) => update({ estimated_equity: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debt">Estimated Debt ($)</Label>
          <Input id="debt" type="number" placeholder="1,300,000" value={form.estimated_debt} onChange={(e) => update({ estimated_debt: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basis">Estimated Basis ($)</Label>
          <Input id="basis" type="number" placeholder="800,000" value={form.estimated_basis} onChange={(e) => update({ estimated_basis: e.target.value })} />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-foreground">Current Loan Details (Optional)</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="loan_balance">Current Loan Balance ($)</Label>
            <Input id="loan_balance" type="number" placeholder="1,300,000" value={form.current_loan_balance} onChange={(e) => update({ current_loan_balance: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="int_rate">Current Interest Rate (%)</Label>
            <Input id="int_rate" type="number" step="0.01" placeholder="4.5" value={form.current_interest_rate} onChange={(e) => update({ current_interest_rate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Loan Type</Label>
            <Select value={form.loan_type || undefined} onValueChange={(v) => update({ loan_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select loan type" /></SelectTrigger>
              <SelectContent>
                {LOAN_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maturity">Loan Maturity Date</Label>
            <Input id="maturity" type="date" value={form.loan_maturity_date} onChange={(e) => update({ loan_maturity_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt_svc">Annual Debt Service ($)</Label>
            <Input id="debt_svc" type="number" placeholder="90,000" value={form.annual_debt_service} onChange={(e) => update({ annual_debt_service: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Switch id="prepay" checked={form.has_prepayment_penalty} onCheckedChange={(v) => update({ has_prepayment_penalty: v })} />
          <Label htmlFor="prepay">Prepayment Penalty?</Label>
        </div>
        {form.has_prepayment_penalty && (
          <div className="mt-3">
            <Label htmlFor="prepay_details">Prepayment Penalty Details</Label>
            <Textarea id="prepay_details" className="mt-1" placeholder="Describe the penalty structure…" value={form.prepayment_penalty_details} onChange={(e) => update({ prepayment_penalty_details: e.target.value })} />
          </div>
        )}
      </div>
    </div>
  );
}
