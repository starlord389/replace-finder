import { useMemo, useState } from "react";
import { AlertCircle, Check, ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ASSET_TYPE_LABELS, US_STATES } from "@/lib/constants";
import {
  CriteriaData,
  FinancialsData,
  formatCurrency,
  formatThousands,
  getCriteriaPurchasingCapacity,
  hasExchangeCriteria,
  initialCriteriaData,
  parseCurrency,
  stripThousands,
} from "@/lib/exchangeWizardTypes";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  criteria: CriteriaData;
  financials: FinancialsData;
  onChange: (criteria: CriteriaData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PickerOption<T extends string> {
  value: T;
  label: string;
}

function MultiValuePicker<T extends string>({
  label,
  placeholder,
  searchPlaceholder,
  selected,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  selected: T[];
  options: PickerOption<T>[];
  onChange: (values: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerId = `criteria-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const labelByValue = useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);

  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={triggerId}>{label} <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={triggerId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn(!selected.length && "text-muted-foreground")}>
              {selected.length ? `${selected.length} selected` : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 pr-1">
              {labelByValue.get(value) ?? value}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-foreground/10"
                onClick={() => toggle(value)}
                aria-label={`Remove ${labelByValue.get(value) ?? value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
  help,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  error?: string;
}) {
  const inputId = `criteria-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label} <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          id={inputId}
          className={cn("pl-7", error && "border-destructive")}
          inputMode="decimal"
          value={formatThousands(value)}
          onChange={(event) => onChange(stripThousands(event.target.value))}
          placeholder="0"
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

const ASSET_OPTIONS = Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({
  value: value as Enums<"asset_type">,
  label,
}));
const STATE_OPTIONS = US_STATES.map((state) => ({ value: state, label: state }));

export default function StepCriteria({ criteria, financials, onChange, onNext, onBack }: Props) {
  const startsAdvanced = Boolean(
    criteria.target_metros.length ||
    criteria.target_price_min ||
    criteria.target_price_max ||
    criteria.max_ltv ||
    criteria.min_projected_roe ||
    criteria.preferred_monthly_cash_flow ||
    criteria.require_location_match ||
    criteria.require_asset_type_match,
  );
  const [advancedOpen, setAdvancedOpen] = useState(startsAdvanced);
  const [metroDraft, setMetroDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const economics = getCriteriaPurchasingCapacity(financials, criteria);
  const hasCriteria = hasExchangeCriteria(criteria);

  const setField = <K extends keyof CriteriaData>(field: K, value: CriteriaData[K]) => {
    onChange({ ...criteria, [field]: value });
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
  };

  const setAssetTypes = (values: Enums<"asset_type">[]) => {
    onChange({
      ...criteria,
      target_asset_types: values,
      require_asset_type_match: values.length ? criteria.require_asset_type_match : false,
    });
  };

  const setStates = (values: string[]) => {
    onChange({
      ...criteria,
      target_states: values,
      require_location_match: values.length || criteria.target_metros.length
        ? criteria.require_location_match
        : false,
    });
  };

  const addMetro = () => {
    const metro = metroDraft.trim();
    if (!metro) return;
    const exists = criteria.target_metros.some((item) => item.toLowerCase() === metro.toLowerCase());
    if (!exists) setField("target_metros", [...criteria.target_metros, metro]);
    setMetroDraft("");
  };

  const removeMetro = (metro: string) => {
    const next = criteria.target_metros.filter((item) => item !== metro);
    onChange({
      ...criteria,
      target_metros: next,
      require_location_match: criteria.target_states.length || next.length
        ? criteria.require_location_match
        : false,
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const moneyFields: Array<[keyof CriteriaData, string]> = [
      ["additional_cash_available", "Additional cash"],
      ["target_price_min", "Minimum price"],
      ["target_price_max", "Maximum price"],
      ["preferred_monthly_cash_flow", "Minimum monthly cash flow"],
    ];

    for (const [field, label] of moneyFields) {
      const raw = criteria[field] as string;
      if (!raw) continue;
      const value = parseCurrency(raw);
      if (value == null || value < 0) next[field] = `${label} must be 0 or greater.`;
    }

    if (criteria.max_ltv) {
      const value = Number(criteria.max_ltv);
      if (!Number.isFinite(value) || value <= 0 || value > 75) next.max_ltv = "Maximum LTV must be greater than 0% and no more than 75%.";
    }

    if (criteria.min_projected_roe) {
      const value = Number(criteria.min_projected_roe);
      if (!Number.isFinite(value) || value < 0 || value > 100) next.min_projected_roe = "Minimum projected ROE must be between 0% and 100%.";
    }

    const minPrice = parseCurrency(criteria.target_price_min);
    const maxPrice = parseCurrency(criteria.target_price_max);
    if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
      next.target_price_max = "Maximum price must be greater than or equal to minimum price.";
    }
    if (maxPrice != null && economics.equity != null && maxPrice < (parseCurrency(financials.asking_price) ?? 0)) {
      next.target_price_max = "The maximum must be at least the current property's value for an Exchange Up match.";
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      setAdvancedOpen(true);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Replacement Preferences</h2>
          <Badge variant="outline">Optional</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Add preferences to refine the results, or leave everything blank to use standard intelligent opportunity monitoring with our Exchange IQ™ technology.
        </p>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {hasCriteria ? "Your optional details are ready" : "Default automatic matching is active"}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Blank fields never exclude or penalize a property. Every match must still fit the platform's financing guardrails and improve projected return on equity.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basic preferences</h3>
          <p className="mt-1 text-xs text-muted-foreground">The most common ways to guide your replacement-property search.</p>
        </div>

        <CurrencyInput
          label="Additional cash available"
          value={criteria.additional_cash_available}
          onChange={(value) => setField("additional_cash_available", value)}
          error={errors.additional_cash_available}
          help="The maximum extra cash you could contribute. The engine uses only the amount a property needs."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <MultiValuePicker
            label="Preferred property types"
            placeholder="Any property type"
            searchPlaceholder="Search property types..."
            selected={criteria.target_asset_types}
            options={ASSET_OPTIONS}
            onChange={setAssetTypes}
          />
          <MultiValuePicker
            label="Preferred states"
            placeholder="Anywhere in the U.S."
            searchPlaceholder="Search states..."
            selected={criteria.target_states}
            options={STATE_OPTIONS}
            onChange={setStates}
          />
        </div>

        {economics.capacity != null && (
          <div className="rounded-lg border bg-muted/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated purchasing capacity</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(economics.capacity)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on {formatCurrency(economics.equity)} of current equity
              {economics.additionalCash > 0 ? ` plus up to ${formatCurrency(economics.additionalCash)} additional cash` : ""}
              {` at a ${economics.maxLtvPercent}% maximum LTV.`}
            </p>
          </div>
        )}
      </section>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between gap-4 p-4 text-left">
            <div>
              <p className="text-sm font-semibold text-foreground">Advanced preferences</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Fine-tune location, financing, return, and cash-flow requirements.</p>
            </div>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", advancedOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-6 border-t p-4">
            <div className="space-y-2">
              <Label htmlFor="criteria-metro-draft">Specific cities or metro areas <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <div className="flex gap-2">
                <Input
                  id="criteria-metro-draft"
                  value={metroDraft}
                  onChange={(event) => setMetroDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addMetro();
                    }
                  }}
                  placeholder="e.g., Tampa or Dallas–Fort Worth"
                />
                <Button type="button" variant="outline" onClick={addMetro} disabled={!metroDraft.trim()}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              {criteria.target_metros.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {criteria.target_metros.map((metro) => (
                    <Badge key={metro} variant="secondary" className="gap-1 pr-1">
                      {metro}
                      <button type="button" className="rounded-full p-0.5 hover:bg-foreground/10" onClick={() => removeMetro(metro)} aria-label={`Remove ${metro}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyInput
                label="Minimum replacement price"
                value={criteria.target_price_min}
                onChange={(value) => setField("target_price_min", value)}
                error={errors.target_price_min}
              />
              <CurrencyInput
                label="Maximum replacement price"
                value={criteria.target_price_max}
                onChange={(value) => setField("target_price_max", value)}
                error={errors.target_price_max}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="criteria-max-ltv">Maximum LTV <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Select value={criteria.max_ltv || "default"} onValueChange={(value) => setField("max_ltv", value === "default" ? "" : value)}>
                  <SelectTrigger id="criteria-max-ltv" className={errors.max_ltv ? "border-destructive" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Platform default - 75%</SelectItem>
                    {[50, 55, 60, 65, 70, 75].map((value) => <SelectItem key={value} value={String(value)}>{value}%</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.max_ltv ? <p className="text-xs text-destructive">{errors.max_ltv}</p> : <p className="text-xs text-muted-foreground">Choose a lower ceiling if less leverage is preferred.</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="criteria-min-roe">Minimum projected ROE <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="relative">
                  <Input
                    id="criteria-min-roe"
                    className={cn("pr-8", errors.min_projected_roe && "border-destructive")}
                    inputMode="decimal"
                    value={criteria.min_projected_roe}
                    onChange={(event) => setField("min_projected_roe", event.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g., 8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                {errors.min_projected_roe ? <p className="text-xs text-destructive">{errors.min_projected_roe}</p> : <p className="text-xs text-muted-foreground">This is the projected annual return on total equity invested.</p>}
              </div>
            </div>

            <CurrencyInput
              label="Minimum projected monthly cash flow"
              value={criteria.preferred_monthly_cash_flow}
              onChange={(value) => setField("preferred_monthly_cash_flow", value)}
              error={errors.preferred_monthly_cash_flow}
              help="Estimated NOI after modeled principal and interest, divided monthly."
            />

            <div className="space-y-3 rounded-lg border bg-muted/25 p-4">
              <p className="text-sm font-medium text-foreground">Required versus preferred</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="require-location">Require a location match</Label>
                  <p className="mt-1 text-xs text-muted-foreground">When off, selected locations improve ranking but do not hide stronger opportunities elsewhere.</p>
                </div>
                <Switch
                  id="require-location"
                  checked={criteria.require_location_match}
                  disabled={!criteria.target_states.length && !criteria.target_metros.length}
                  onCheckedChange={(value) => setField("require_location_match", value)}
                />
              </div>
              <div className="flex items-start justify-between gap-4 border-t pt-3">
                <div>
                  <Label htmlFor="require-asset">Require a property-type match</Label>
                  <p className="mt-1 text-xs text-muted-foreground">When off, selected types improve ranking without excluding other property types.</p>
                </div>
                <Switch
                  id="require-asset"
                  checked={criteria.require_asset_type_match}
                  disabled={!criteria.target_asset_types.length}
                  onCheckedChange={(value) => setField("require_asset_type_match", value)}
                />
              </div>
            </div>

          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          {hasCriteria && (
            <Button type="button" variant="ghost" onClick={() => { onChange({ ...initialCriteriaData }); setErrors({}); setMetroDraft(""); }}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Clear preferences
            </Button>
          )}
          <Button type="button" onClick={handleNext}>{hasCriteria ? "Continue" : "Skip preferences"}</Button>
        </div>
      </div>
    </div>
  );
}
