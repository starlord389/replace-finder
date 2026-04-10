import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { WizardState, initialWizardState } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyDetails from "@/components/exchange/StepPropertyDetails";
import StepFinancials from "@/components/exchange/StepFinancials";
import StepCriteria from "@/components/exchange/StepCriteria";
import StepReview from "@/components/exchange/StepReview";
import { useCreateExchange } from "@/features/exchanges/hooks/useCreateExchange";
import { trackEvent } from "@/lib/telemetry";

const STEPS = ["Select Client", "Property Details", "Financials", "Criteria", "Review"];
const MOBILE_STEP_LABELS = ["Client", "Property", "Financials", "Criteria", "Review"];

export default function NewExchange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createExchange = useCreateExchange();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(initialWizardState);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");

  // resolve client name when selected
  useEffect(() => {
    if (!data.selectedClientId) { setClientName(""); return; }
    supabase.from("agent_clients").select("client_name").eq("id", data.selectedClientId).single()
      .then(({ data: c }) => setClientName(c?.client_name || ""));
  }, [data.selectedClientId]);

  const handleSubmit = async (activate: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const result = await createExchange.mutateAsync({ data, activate, clientName });
      if (activate) {
        toast.success("Exchange activated and matching queued.");
        trackEvent("matching_invoked", { exchangeId: result.exchange_id, source: "create-exchange" });
      } else {
        toast.success("Exchange saved as draft.");
      }
      navigate(`/agent/exchanges/${result.exchange_id}`);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save exchange: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Exchange</h1>
        <p className="text-sm text-muted-foreground">Create a 1031 exchange for one of your clients.</p>
      </div>

      {/* Step Progress */}
      <nav className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => isCompleted && setStep(stepNum)}
                disabled={!isCompleted}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full justify-center
                  ${isCurrent ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer" : "bg-muted text-muted-foreground"}`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{stepNum}</span>}
                <span className="sm:hidden">{MOBILE_STEP_LABELS[i]}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step Content */}
      {step === 1 && (
        <StepSelectClient selectedClientId={data.selectedClientId}
          onChange={id => setData(d => ({ ...d, selectedClientId: id }))}
          onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepPropertyDetails data={data.property}
          onChange={property => setData(d => ({ ...d, property }))}
          onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepFinancials data={data.financials}
          onChange={financials => setData(d => ({ ...d, financials }))}
          onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <StepCriteria data={data.criteria} loanBalance={data.financials.loan_balance}
          onChange={criteria => setData(d => ({ ...d, criteria }))}
          onNext={() => setStep(5)} onBack={() => setStep(3)} />
      )}
      {step === 5 && (
        <StepReview data={data} clientName={clientName}
          onBack={() => setStep(4)} onSubmit={handleSubmit} saving={saving} />
      )}
    </div>
  );
}
