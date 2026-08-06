import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { WizardState, initialWizardState } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyAndFinancials from "@/components/exchange/StepPropertyAndFinancials";
import StepCriteria from "@/components/exchange/StepCriteria";
import StepReview from "@/components/exchange/StepReview";
import ActivateResultDialog, { ActivateResultState } from "@/components/exchange/ActivateResultDialog";
import { useCreateExchange } from "@/features/exchanges/hooks/useCreateExchange";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { trackEvent } from "@/lib/telemetry";

const AGENT_STEPS = ["Select Client", "Property & Financials", "Preferences", "Review"];
const AGENT_MOBILE_STEP_LABELS = ["Client", "Property", "Prefs", "Review"];
const INVESTOR_STEPS = ["Property & Financials", "Preferences", "Review"];
const INVESTOR_MOBILE_STEP_LABELS = ["Property", "Prefs", "Review"];

export default function NewExchange({ ownerType = "agent" }: { ownerType?: "agent" | "investor" }) {
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
  const isInvestor = ownerType === "investor";
  const basePath = isInvestor ? "/investor" : "/agent";
  const steps = isInvestor ? INVESTOR_STEPS : AGENT_STEPS;
  const mobileStepLabels = isInvestor ? INVESTOR_MOBILE_STEP_LABELS : AGENT_MOBILE_STEP_LABELS;
  const clientLocked = Boolean(preselectedClientId);
  const propertyStep = isInvestor ? 1 : 2;
  const criteriaStep = propertyStep + 1;
  const reviewStep = criteriaStep + 1;

  useEffect(() => {
    if (isInvestor) { setClientName("Your property"); return; }
    if (!data.selectedClientId) { setClientName(""); return; }
    supabase.from("agent_clients").select("client_name").eq("id", data.selectedClientId).single()
      .then(({ data: c }) => setClientName(c?.client_name || ""));
  }, [data.selectedClientId, isInvestor]);

  const extractErrorCode = (err: unknown): string => {
    const value = typeof err === "object" && err !== null
      ? err as { context?: { response?: { status?: unknown } }; status?: unknown; code?: unknown; name?: unknown }
      : {};
    if (value.context?.response?.status) return String(value.context.response.status);
    if (value.status) return String(value.status);
    if (value.code) return String(value.code);
    if (value.name) return String(value.name);
    return "UNKNOWN";
  };

  const handleSubmit = async (activate: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await createExchange.mutateAsync({ data, activate, clientName, isDemo, ownerType });
      setLastExchangeId(res.exchange_id ?? null);
      if (activate) {
        const newMatches = Number(res?.matching?.new_matches ?? 0);
        toast.success("Exchange activated.");
        trackEvent("matching_invoked", { exchangeId: res.exchange_id, source: "create-exchange" });
        setResult({ kind: "success", newMatches });
        setResultOpen(true);
      } else {
        toast.success("Exchange saved as draft.");
        navigate(`${basePath}/listings`);
      }
    } catch (err: unknown) {
      console.error("Save error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
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
        <p className="text-sm text-muted-foreground">
          {isInvestor
            ? "List your current property and let the matching engine find higher-return exchange opportunities."
            : "Create a 1031 exchange for one of your clients."}
        </p>
      </div>

      {/* Step Progress */}
      <nav className="flex items-center gap-1">
        {steps.map((label, i) => {
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
                <span className="sm:hidden">{mobileStepLabels[i]}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step Content */}
      {!isInvestor && step === 1 && (
        <StepSelectClient selectedClientId={data.selectedClientId}
          onChange={id => setData(d => ({ ...d, selectedClientId: id }))}
          onNext={() => setStep(2)}
          lockedClientName={clientLocked ? (clientName || "Selected client") : undefined} />
      )}
      {step === propertyStep && (
        <StepPropertyAndFinancials
          property={data.property}
          financials={data.financials}
          images={data.images}
          onChangeProperty={property => setData(d => ({ ...d, property }))}
          onChangeFinancials={financials => setData(d => ({ ...d, financials }))}
          onChangeImages={images => setData(d => ({ ...d, images }))}
          onNext={() => setStep(criteriaStep)}
          onBack={() => setStep(1)}
          ownerType={ownerType}
          showBack={!isInvestor}
        />
      )}
      {step === criteriaStep && (
        <StepCriteria
          criteria={data.criteria}
          financials={data.financials}
          onChange={criteria => setData(d => ({ ...d, criteria }))}
          onNext={() => setStep(reviewStep)}
          onBack={() => setStep(propertyStep)}
        />
      )}
      {step === reviewStep && (
        <StepReview data={data} clientName={clientName}
          onBack={() => setStep(criteriaStep)} onSubmit={handleSubmit} saving={saving}
          ownerType={ownerType}
          onOwnerAuthorizationChange={v => setData(d => ({ ...d, property: { ...d.property, owner_authorization_confirmed: v } }))} />
      )}

      <ActivateResultDialog
        open={resultOpen}
        state={result}
        onClose={() => setResultOpen(false)}
        onViewListing={() => {
          setResultOpen(false);
          navigate(`${basePath}/listings`);
        }}
        onGoToMatches={() => {
          setResultOpen(false);
          navigate(lastExchangeId ? `${basePath}/matches?listing=${lastExchangeId}` : `${basePath}/matches`);
        }}
        onRetry={() => setResultOpen(false)}
        onSaveAsDraft={() => {
          setResultOpen(false);
          handleSubmit(false);
        }}
      />
    </div>
  );
}
