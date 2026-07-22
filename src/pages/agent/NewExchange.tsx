import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { WizardState, initialWizardState } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyAndFinancials from "@/components/exchange/StepPropertyAndFinancials";
import StepReview from "@/components/exchange/StepReview";
import ActivateResultDialog, { ActivateResultState } from "@/components/exchange/ActivateResultDialog";
import { useCreateExchange } from "@/features/exchanges/hooks/useCreateExchange";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { trackEvent } from "@/lib/telemetry";

const STEPS = ["Select Client", "Property & Financials", "Review"];
const MOBILE_STEP_LABELS = ["Client", "Property", "Review"];

export default function NewExchange() {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const navigate = useNavigate();
  const createExchange = useCreateExchange();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("client");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>({
    ...initialWizardState,
    selectedClientId: preselectedClientId ?? initialWizardState.selectedClientId,
  });
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [lastExchangeId, setLastExchangeId] = useState<string | null>(null);
  const [result, setResult] = useState<ActivateResultState | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const clientLocked = Boolean(preselectedClientId);

  useEffect(() => {
    if (!data.selectedClientId) { setClientName(""); return; }
    supabase.from("agent_clients").select("client_name").eq("id", data.selectedClientId).single()
      .then(({ data: c }) => setClientName(c?.client_name || ""));
  }, [data.selectedClientId]);

  const extractErrorCode = (err: any): string => {
    if (err?.context?.response?.status) return String(err.context.response.status);
    if (err?.status) return String(err.status);
    if (err?.code) return String(err.code);
    if (err?.name) return String(err.name);
    return "UNKNOWN";
  };

  const handleSubmit = async (activate: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await createExchange.mutateAsync({ data, activate, clientName, isDemo });
      setLastExchangeId(res.exchange_id ?? null);
      if (activate) {
        const newMatches = Number(res?.matching?.new_matches ?? 0);
        toast.success("Exchange activated.");
        trackEvent("matching_invoked", { exchangeId: res.exchange_id, source: "create-exchange" });
        setResult({ kind: "success", newMatches });
        setResultOpen(true);
      } else {
        toast.success("Exchange saved as draft.");
        navigate("/agent/listings");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      const message = err?.message || "Unknown error";
      if (activate) {
        setResult({ kind: "error", code: extractErrorCode(err), message });
        setResultOpen(true);
      } else {
        toast.error("Failed to save exchange: " + message);
      }
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
          onNext={() => setStep(2)}
          lockedClientName={clientLocked ? (clientName || "Selected client") : undefined} />
      )}
      {step === 2 && (
        <StepPropertyAndFinancials
          property={data.property}
          financials={data.financials}
          images={data.images}
          onChangeProperty={property => setData(d => ({ ...d, property }))}
          onChangeFinancials={financials => setData(d => ({ ...d, financials }))}
          onChangeImages={images => setData(d => ({ ...d, images }))}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepReview data={data} clientName={clientName}
          onBack={() => setStep(2)} onSubmit={handleSubmit} saving={saving}
          onOwnerAuthorizationChange={v => setData(d => ({ ...d, property: { ...d.property, owner_authorization_confirmed: v } }))} />
      )}
    </div>
  );
}
