import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FinancialsData, parseCurrency } from "@/lib/exchangeWizardTypes";
import { LOAN_TYPE_OPTIONS } from "@/lib/constants";
import { useState, useEffect } from "react";

interface Props {
  data: FinancialsData;
  onChange: (data: FinancialsData) => void;
  onNext: () => void;
  onBack: () => void;
}

function CurrencyField({ label, value, onChange, required, error, help }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean; help?: string;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input className={cn("pl-7", error && "border-destructive")} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
      </div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function PercentField({ label, value, onChange, required, error }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <Input className={cn("pr-7", error && "border-destructive")} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
      </div>
    </div>
  );
}

export default function StepFinancials({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [expensesOpen, setExpensesOpen] = useState(false);

  const set = (field: keyof FinancialsData, value: any) => {
    const updated = { ...data, [field]: value };

    // Auto-calc cap rate
    if ((field === "noi" || field === "asking_price") && updated.asking_price && updated.noi) {
      const price = parseCurrency(updated.asking_price);
      const noi = parseCurrency(updated.noi);
      if (price && noi && price > 0) updated.cap_rate = ((noi / price) * 100).toFixed(2);
    }

    // Auto-calc gain
    if ((field === "exchange_proceeds" || field === "estimated_basis") && updated.exchange_proceeds && updated.estimated_basis) {
      const proceeds = parseCurrency(updated.exchange_proceeds);
      const basis = parseCurrency(updated.estimated_basis);
      if (proceeds != null && basis != null) {
        const gain = proceeds - basis;
        updated.estimated_gain = gain > 0 ? gain.toString() : "0";
        updated.estimated_tax_liability = gain > 0 ? Math.round(gain * 0.3).toString() : "0";
      }
    }

    onChange(updated);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    const required: Record<string, boolean> = {
      asking_price: !data.asking_price, noi: !data.noi, occupancy_rate: !data.occupancy_rate,
      exchange_proceeds: !data.exchange_proceeds, estimated_equity: !data.estimated_equity,
    };
    setErrors(required);
    return !Object.values(required).some(Boolean);
  };

  const handleNext = () => { if (validate()) onNext(); };

  const saleDate = data.sale_close_date ? new Date(data.sale_close_date) : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Property Financials & Exchange Economics</h2>
        <p className="text-sm text-muted-foreground">The more detail you provide, the better your matches.</p>
      </div>

      {/* Property Financials */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property Financials</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyField label="Asking Price / Estimated Value" value={data.asking_price} onChange={v => set("asking_price", v)} required error={errors.asking_price} />
          <CurrencyField label="Net Operating Income (NOI)" value={data.noi} onChange={v => set("noi", v)} required error={errors.noi} />
          <PercentField label="Occupancy Rate" value={data.occupancy_rate} onChange={v => set("occupancy_rate", v)} required error={errors.occupancy_rate} />
          <PercentField label="Cap Rate" value={data.cap_rate} onChange={v => set("cap_rate", v)} />
        </div>

        <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={`h-4 w-4 transition-transform ${expensesOpen ? "rotate-180" : ""}`} /> Detailed Expenses
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <CurrencyField label="Gross Scheduled Income" value={data.gross_scheduled_income} onChange={v => set("gross_scheduled_income", v)} />
              <CurrencyField label="Effective Gross Income" value={data.effective_gross_income} onChange={v => set("effective_gross_income", v)} />
              <PercentField label="Vacancy Rate" value={data.vacancy_rate} onChange={v => set("vacancy_rate", v)} />
              <CurrencyField label="Annual Revenue" value={data.annual_revenue} onChange={v => set("annual_revenue", v)} />
              <CurrencyField label="Annual Expenses" value={data.annual_expenses} onChange={v => set("annual_expenses", v)} />
              <CurrencyField label="Real Estate Taxes" value={data.real_estate_taxes} onChange={v => set("real_estate_taxes", v)} />
              <CurrencyField label="Insurance" value={data.insurance} onChange={v => set("insurance", v)} />
              <CurrencyField label="Utilities" value={data.utilities} onChange={v => set("utilities", v)} />
              <CurrencyField label="Management Fee" value={data.management_fee} onChange={v => set("management_fee", v)} />
              <CurrencyField label="Maintenance/Repairs" value={data.maintenance_repairs} onChange={v => set("maintenance_repairs", v)} />
              <CurrencyField label="CapEx Reserves" value={data.capex_reserves} onChange={v => set("capex_reserves", v)} />
              <CurrencyField label="Other Expenses" value={data.other_expenses} onChange={v => set("other_expenses", v)} />
              <CurrencyField label="Avg. Rent Per Unit" value={data.average_rent_per_unit} onChange={v => set("average_rent_per_unit", v)} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Debt Position */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Debt Position</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyField label="Current Loan Balance" value={data.loan_balance} onChange={v => set("loan_balance", v)}
            help="Critical for boot calculations." />
          <PercentField label="Current Interest Rate" value={data.loan_rate} onChange={v => set("loan_rate", v)} />
          <div>
            <Label>Loan Type</Label>
            <Select value={data.loan_type} onValueChange={v => set("loan_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{LOAN_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Loan Maturity Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.loan_maturity_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.loan_maturity_date ? format(new Date(data.loan_maturity_date), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={data.loan_maturity_date ? new Date(data.loan_maturity_date) : undefined}
                  onSelect={d => set("loan_maturity_date", d ? format(d, "yyyy-MM-dd") : "")} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <CurrencyField label="Annual Debt Service" value={data.annual_debt_service} onChange={v => set("annual_debt_service", v)} />
          <div className="flex flex-col gap-2">
            <Label>Has Prepayment Penalty</Label>
            <Switch checked={data.has_prepayment_penalty} onCheckedChange={v => set("has_prepayment_penalty", v)} />
          </div>
        </div>
        {data.has_prepayment_penalty && (
          <div><Label>Prepayment Penalty Details</Label><Input value={data.prepayment_penalty_details} onChange={e => set("prepayment_penalty_details", e.target.value)} /></div>
        )}
      </section>

      {/* Exchange Economics */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exchange Economics</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyField label="Exchange Proceeds" value={data.exchange_proceeds} onChange={v => set("exchange_proceeds", v)} required error={errors.exchange_proceeds}
            help="Net amount from sale after closing costs" />
          <CurrencyField label="Estimated Equity" value={data.estimated_equity} onChange={v => set("estimated_equity", v)} required error={errors.estimated_equity}
            help="Property value minus loan balance" />
          <CurrencyField label="Estimated Basis" value={data.estimated_basis} onChange={v => set("estimated_basis", v)}
            help="Original purchase price minus depreciation" />
          <CurrencyField label="Estimated Gain" value={data.estimated_gain} onChange={v => set("estimated_gain", v)}
            help="Auto-calculated: proceeds − basis" />
          <CurrencyField label="Estimated Tax Liability" value={data.estimated_tax_liability} onChange={v => set("estimated_tax_liability", v)}
            help="Auto-calculated: gain × 30%" />
          <div>
            <Label>Sale Close Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data.sale_close_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.sale_close_date ? format(new Date(data.sale_close_date), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={saleDate} onSelect={d => set("sale_close_date", d ? format(d, "yyyy-MM-dd") : "")} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <p className="mt-1 text-xs text-muted-foreground">Starts the 45-day and 180-day clocks. You can add this later.</p>
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
