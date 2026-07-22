import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";

const SUPABASE_URL = "https://mosuewptjslfrcibjtwc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vld3B0anNsZnJjaWJqdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDcyNDQsImV4cCI6MjA5MDI4MzI0NH0.o9wZGKJ3TXYSSNVNLhcNsk8Ju7s_qC4zYCEDNVAlysc";

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "already" }
  | { kind: "ready" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json();
        if (!res.ok) return setState({ kind: "invalid" });
        if (data.reason === "already_unsubscribed") return setState({ kind: "already" });
        if (data.valid) return setState({ kind: "ready" });
        setState({ kind: "invalid" });
      } catch {
        setState({ kind: "error", message: "Couldn't reach the server. Please try again." });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ kind: "error", message: data.error ?? "Something went wrong." });
      if (data.reason === "already_unsubscribed") return setState({ kind: "already" });
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server. Please try again." });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            {state.kind === "done" || state.kind === "already" ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : state.kind === "invalid" || state.kind === "error" ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Mail className="h-5 w-5 text-primary" />
            )}
            <CardTitle>
              {state.kind === "done" || state.kind === "already"
                ? "You're unsubscribed"
                : state.kind === "invalid"
                ? "Link invalid"
                : state.kind === "error"
                ? "Something went wrong"
                : "Unsubscribe from emails"}
            </CardTitle>
          </div>
          <CardDescription>
            {state.kind === "loading" && "Checking your link…"}
            {state.kind === "ready" &&
              "Confirm below and we'll stop sending you emails from 1031ExchangeUp."}
            {state.kind === "submitting" && "Processing…"}
            {state.kind === "done" &&
              "We've removed your email from our list. You won't receive further messages."}
            {state.kind === "already" && "This email address is already unsubscribed."}
            {state.kind === "invalid" && "This unsubscribe link is invalid or has expired."}
            {state.kind === "error" && state.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          {state.kind === "ready" && (
            <Button onClick={confirm} className="w-full">
              Confirm unsubscribe
            </Button>
          )}
          {state.kind === "submitting" && (
            <Button disabled className="w-full">
              Unsubscribing…
            </Button>
          )}
          {(state.kind === "done" ||
            state.kind === "already" ||
            state.kind === "invalid" ||
            state.kind === "error") && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
