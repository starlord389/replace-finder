import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import StepRelinquished from "@/components/request/StepRelinquished";
import StepEconomics from "@/components/request/StepEconomics";
import StepGoals from "@/components/request/StepGoals";
import StepGeography from "@/components/request/StepGeography";
import StepTiming from "@/components/request/StepTiming";
import StepReview from "@/components/request/StepReview";
import type { Enums } from "@/integrations/supabase/types";

export interface RequestFormData {
  // Relinquished
  relinquished_address: string;
  relinquished_city: string;
  relinquished_state: string;
  relinquished_zip: string;
  relinquished_asset_type: Enums<"asset_type"> | "";
  relinquished_estimated_value: string;
  relinquished_description: string;
  // Economics
  estimated_equity: string;
  estimated_debt: string;
  exchange_proceeds: string;
  estimated_basis: string;
  // Goals
  target_price_min: string;
  target_price_max: string;
  target_asset_types: Enums<"asset_type">[];
  target_strategies: Enums<"strategy_type">[];
  target_cap_rate_min: string;
  target_cap_rate_max: string;
  additional_notes: string;
  // Geography
  target_states: string[];
  target_metros: string;
  // Timing
  sale_timeline: string;
  identification_deadline: string;
  close_deadline: string;
  urgency: string;
}

const INITIAL: RequestFormData = {
  relinquished_address: "",
  relinquished_city: "",
  relinquished_state: "",
  relinquished_zip: "",
  relinquished_asset_type: "",
  relinquished_estimated_value: "",
  relinquished_description: "",
  estimated_equity: "",
  estimated_debt: "",
  exchange_proceeds: "",
  estimated_basis: "",
  target_price_min: "",
  target_price_max: "",
  target_asset_types: [],
  target_strategies: [],
  target_cap_rate_min: "",
  target_cap_rate_max: "",
  additional_notes: "",
  target_states: [],
  target_metros: "",
  sale_timeline: "",
  identification_deadline: "",
  close_deadline: "",
  urgency: "",
};

const STEPS = [
  { label: "Property", number: 1 },
  { label: "Economics", number: 2 },
  { label: "Goals", number: 3 },
  { label: "Geography", number: 4 },
  { label: "Timing", number: 5 },
  { label: "Review", number: 6 },
];

export default function NewRequest() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RequestFormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (partial: Partial<RequestFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toNum = (v: string) => (v ? Number(v) : null);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data: req, error: reqErr } = await supabase
      .from("exchange_requests")
      .insert({
        user_id: user.id,
        relinquished_address: form.relinquished_address || null,
        relinquished_city: form.relinquished_city || null,
        relinquished_state: form.relinquished_state || null,
        relinquished_zip: form.relinquished_zip || null,
        relinquished_asset_type: form.relinquished_asset_type || null,
        relinquished_estimated_value: toNum(form.relinquished_estimated_value),
        relinquished_description: form.relinquished_description || null,
        estimated_equity: toNum(form.estimated_equity),
        estimated_debt: toNum(form.estimated_debt),
        exchange_proceeds: toNum(form.exchange_proceeds),
        estimated_basis: toNum(form.estimated_basis),
        sale_timeline: form.sale_timeline || null,
        identification_deadline: form.identification_deadline || null,
        close_deadline: form.close_deadline || null,
        urgency: form.urgency || null,
      })
      .select("id")
      .single();

    if (reqErr || !req) {
      toast({ title: "Error", description: reqErr?.message ?? "Failed to create request", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    await supabase.from("exchange_request_preferences").insert({
      request_id: req.id,
      target_price_min: toNum(form.target_price_min),
      target_price_max: toNum(form.target_price_max),
      target_asset_types: form.target_asset_types.length ? form.target_asset_types : null,
      target_strategies: form.target_strategies.length ? form.target_strategies : null,
      target_states: form.target_states.length ? form.target_states : null,
      target_metros: form.target_metros ? form.target_metros.split(",").map((s: string) => s.trim()).filter(Boolean) : null,
      target_cap_rate_min: toNum(form.target_cap_rate_min),
      target_cap_rate_max: toNum(form.target_cap_rate_max),
      additional_notes: form.additional_notes || null,
    });

    setSubmitting(false);
    toast({ title: "Request submitted", description: "We'll review your exchange request and begin matching." });
    navigate("/dashboard");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">New Exchange Request</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us about your exchange so we can find replacement properties.
      </p>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-1">
        {STEPS.map((s) => (
          <div key={s.number} className="flex items-center gap-1">
            <button
              onClick={() => s.number < step && setStep(s.number)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s.number === step
                  ? "bg-primary text-primary-foreground"
                  : s.number < step
                  ? "bg-primary/10 text-primary cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.number < step ? <Check className="h-3.5 w-3.5" /> : s.number}
            </button>
            <span className={`hidden text-xs sm:inline ${s.number === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {s.number < STEPS.length && <div className="mx-1 h-px w-4 bg-border sm:w-8" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8">
        {step === 1 && <StepRelinquished form={form} update={update} />}
        {step === 2 && <StepEconomics form={form} update={update} />}
        {step === 3 && <StepGoals form={form} update={update} />}
        {step === 4 && <StepGeography form={form} update={update} />}
        {step === 5 && <StepTiming form={form} update={update} />}
        {step === 6 && <StepReview form={form} />}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 6 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? "Submitting…" : "Submit Request"} <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
