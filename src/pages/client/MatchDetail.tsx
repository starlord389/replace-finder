import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Building2, Calendar, TrendingUp, Ruler, Users, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  INVENTORY_STATUS_LABELS,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [access, setAccess] = useState<any>(null);
  const [property, setProperty] = useState<Tables<"inventory_properties"> | null>(null);
  const [financials, setFinancials] = useState<Tables<"inventory_financials"> | null>(null);
  const [images, setImages] = useState<Tables<"inventory_images">[]>([]);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showChangeResponse, setShowChangeResponse] = useState(false);

  const viewTracked = useRef(false);

  useEffect(() => {
    if (!id || !user) return;
    loadData();
  }, [id, user]);

  // Track view
  useEffect(() => {
    if (!matchResult || viewTracked.current) return;
    if (matchResult.client_viewed_at) {
      viewTracked.current = true;
      return;
    }
    viewTracked.current = true;
    supabase
      .from("match_results")
      .update({ client_viewed_at: new Date().toISOString() })
      .eq("id", matchResult.id)
      .select()
      .then(({ data, error }) => {
        console.log("View tracking result:", { data, error });
        if (data && data.length > 0) {
          setMatchResult((prev: any) => prev ? { ...prev, client_viewed_at: new Date().toISOString() } : prev);
        }
      });
  }, [matchResult]);

  const loadData = async () => {
    const { data: accessData } = await supabase
      .from("matched_property_access")
      .select("*")
      .eq("id", id!)
      .eq("user_id", user!.id)
      .single();

    if (!accessData) {
      setLoading(false);
      return;
    }
    setAccess(accessData);

    const [propRes, finRes, imgRes, matchRes] = await Promise.all([
      supabase.from("inventory_properties").select("*").eq("id", accessData.property_id).single(),
      supabase.from("inventory_financials").select("*").eq("property_id", accessData.property_id).maybeSingle(),
      supabase.from("inventory_images").select("*").eq("property_id", accessData.property_id).order("sort_order"),
      supabase.from("match_results").select("*").eq("id", accessData.match_result_id).single(),
    ]);

    setProperty(propRes.data);
    setFinancials(finRes.data);
    setImages(imgRes.data ?? []);
    setMatchResult(matchRes.data);
    setLoading(false);
  };

  const submitResponse = async (response: "interested" | "passed") => {
    if (!matchResult) return;
    setSubmitting(true);
    const updates = {
      client_response: response,
      client_response_at: new Date().toISOString(),
      client_response_note: responseNote.trim() || null,
    };
    const { data, error } = await supabase
      .from("match_results")
      .update(updates)
      .eq("id", matchResult.id)
      .select();

    console.log("Response update result:", { data, error });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (!data || data.length === 0) {
      toast({ title: "Error", description: "Unable to save response. Please try again or contact support.", variant: "destructive" });
    } else {
      setMatchResult((prev: any) => ({ ...prev, ...updates }));
      setShowChangeResponse(false);
      toast({
        title: response === "interested" ? "Interest expressed" : "Property passed",
        description: response === "interested"
          ? "Your advisor has been notified."
          : "Your response has been recorded.",
      });
    }
    setSubmitting(false);
    setInterestDialogOpen(false);
    setPassDialogOpen(false);
    setResponseNote("");
  };

  const currency = (v: number | null) =>
    v ? `$${Number(v).toLocaleString()}` : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!access || !property) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Match not found or access denied.
      </p>
    );
  }

  const hasResponded = !!matchResult?.client_response;
  const showButtons = !hasResponded || showChangeResponse;

  return (
    <div>
      <button
        onClick={() => navigate("/dashboard/matches")}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </button>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-64 overflow-hidden">
            {images.slice(0, 3).map((img) => {
              const url = supabase.storage
                .from("inventory-images")
                .getPublicUrl(img.storage_path).data.publicUrl;
              return (
                <img key={img.id} src={url} alt={img.file_name || "Property"} className="h-64 w-full object-cover" />
              );
            })}
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {property.name || property.address || "Replacement Property"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {(property.city || property.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[property.address, property.city, property.state, property.zip].filter(Boolean).join(", ")}
                  </span>
                )}
                {property.asset_type && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {ASSET_TYPE_LABELS[property.asset_type]}
                  </span>
                )}
                {property.year_built && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Built {property.year_built}
                  </span>
                )}
              </div>
            </div>

            {/* Response actions — top */}
            <ResponseArea
              matchResult={matchResult}
              hasResponded={hasResponded}
              showButtons={showButtons}
              onInterest={() => { setResponseNote(""); setInterestDialogOpen(true); }}
              onPass={() => { setResponseNote(""); setPassDialogOpen(true); }}
              onChangeResponse={() => setShowChangeResponse(true)}
            />
          </div>

          {property.description && (
            <p className="mt-4 text-sm text-foreground leading-relaxed">{property.description}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Property Details */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {property.asset_type && <Detail icon={<Building2 className="h-4 w-4" />} label="Asset Type" value={ASSET_TYPE_LABELS[property.asset_type]} />}
            {property.strategy_type && <Detail icon={<TrendingUp className="h-4 w-4" />} label="Strategy" value={STRATEGY_TYPE_LABELS[property.strategy_type]} />}
            {property.square_footage && <Detail icon={<Ruler className="h-4 w-4" />} label="Square Footage" value={Number(property.square_footage).toLocaleString() + " SF"} />}
            {property.units && <Detail icon={<Users className="h-4 w-4" />} label="Units" value={String(property.units)} />}
            {property.year_built && <Detail icon={<Calendar className="h-4 w-4" />} label="Year Built" value={String(property.year_built)} />}
            <Detail label="Status" value={INVENTORY_STATUS_LABELS[property.status] || property.status} />
          </div>
        </div>

        {/* Financials */}
        {financials && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {financials.asking_price && <Detail label="Asking Price" value={currency(financials.asking_price)} highlight />}
              {financials.cap_rate && <Detail label="Cap Rate" value={`${Number(financials.cap_rate).toFixed(2)}%`} highlight />}
              {financials.noi && <Detail label="NOI" value={currency(financials.noi)} />}
              {financials.annual_revenue && <Detail label="Annual Revenue" value={currency(financials.annual_revenue)} />}
              {financials.annual_expenses && <Detail label="Annual Expenses" value={currency(financials.annual_expenses)} />}
              {financials.occupancy_rate && <Detail label="Occupancy" value={`${Number(financials.occupancy_rate).toFixed(1)}%`} />}
              {financials.debt_amount && <Detail label="Debt" value={currency(financials.debt_amount)} />}
              {financials.debt_rate && <Detail label="Debt Rate" value={`${Number(financials.debt_rate).toFixed(2)}%`} />}
              {financials.cash_on_cash && <Detail label="Cash on Cash" value={`${Number(financials.cash_on_cash).toFixed(2)}%`} />}
            </div>
            {financials.notes && <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{financials.notes}</p>}
          </div>
        )}
      </div>

      {/* All images */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photos ({images.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => {
                const url = supabase.storage.from("inventory-images").getPublicUrl(img.storage_path).data.publicUrl;
                return <img key={img.id} src={url} alt={img.file_name || "Property"} className="h-40 w-full rounded-lg object-cover" />;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Interested in this property?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Let your advisor know your thoughts.</p>
          </div>
          <ResponseArea
            matchResult={matchResult}
            hasResponded={hasResponded}
            showButtons={showButtons}
            onInterest={() => { setResponseNote(""); setInterestDialogOpen(true); }}
            onPass={() => { setResponseNote(""); setPassDialogOpen(true); }}
            onChangeResponse={() => setShowChangeResponse(true)}
          />
        </div>
      </div>

      {/* Interest Dialog */}
      <AlertDialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Express Interest</AlertDialogTitle>
            <AlertDialogDescription>
              Your advisor will be notified that you're interested in this property and will reach out to discuss next steps. This does not create any binding commitment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="e.g., I'd like to schedule a call to discuss this property..."
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              rows={3}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Add a note for your advisor (optional)</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => { e.preventDefault(); submitResponse("interested"); }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? "Submitting…" : "Confirm Interest"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pass Dialog */}
      <AlertDialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pass on This Property</AlertDialogTitle>
            <AlertDialogDescription>
              This property will be marked as passed. Your advisor will see your response. You can change your mind later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="e.g., Cap rate too low for my targets..."
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              rows={3}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Reason for passing (optional)</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => { e.preventDefault(); submitResponse("passed"); }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {submitting ? "Submitting…" : "Confirm Pass"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ResponseArea({
  matchResult,
  hasResponded,
  showButtons,
  onInterest,
  onPass,
  onChangeResponse,
}: {
  matchResult: any;
  hasResponded: boolean;
  showButtons: boolean;
  onInterest: () => void;
  onPass: () => void;
  onChangeResponse: () => void;
}) {
  if (!matchResult || matchResult.status !== "approved") return null;

  if (showButtons) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Button onClick={onInterest} className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
          <Check className="h-4 w-4" /> Express Interest
        </Button>
        <Button variant="outline" onClick={onPass} className="gap-1.5">
          <X className="h-4 w-4" /> Pass
        </Button>
      </div>
    );
  }

  if (hasResponded) {
    const isInterested = matchResult.client_response === "interested";
    return (
      <div className="text-right shrink-0">
        <Badge className={isInterested ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-muted text-muted-foreground hover:bg-muted"}>
          {isInterested ? (
            <><Check className="mr-1 h-3 w-3" /> You expressed interest</>
          ) : (
            "You passed on this property"
          )}
        </Badge>
        {matchResult.client_response_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            Responded on {new Date(matchResult.client_response_at).toLocaleDateString()}
          </p>
        )}
        {matchResult.client_response_note && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground justify-end">
            <MessageSquare className="h-3 w-3" />
            {matchResult.client_response_note}
          </p>
        )}
        <button
          onClick={onChangeResponse}
          className="mt-1 text-xs text-primary hover:underline"
        >
          Change your response
        </button>
      </div>
    );
  }

  return null;
}

function Detail({ icon, label, value, highlight }: { icon?: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
