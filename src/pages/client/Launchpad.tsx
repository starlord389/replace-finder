import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, FileText, Search, BarChart3, HelpCircle, Check } from "lucide-react";

interface StepState {
  profileComplete: boolean;
  hasExchange: boolean;
  hasMatches: boolean;
}

export default function Launchpad() {
  const { user } = useAuth();
  const [state, setState] = useState<StepState>({ profileComplete: false, hasExchange: false, hasMatches: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
      supabase.from("exchange_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("matched_property_access").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([profileRes, exchRes, matchRes]) => {
      const p = profileRes.data;
      setState({
        profileComplete: !!(p?.full_name && p?.phone),
        hasExchange: (exchRes.count ?? 0) > 0,
        hasMatches: (matchRes.count ?? 0) > 0,
      });
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const steps = [
    {
      icon: User,
      title: "Complete your profile",
      description: "Add your name, phone, and company so we can reach you about your exchange.",
      done: state.profileComplete,
      cta: "Complete Profile",
      to: "/dashboard/settings",
    },
    {
      icon: FileText,
      title: "Submit your first exchange request",
      description: "Tell us about the property you're selling and what you're looking for.",
      done: state.hasExchange,
      cta: "Start Exchange",
      to: "/dashboard/exchanges/new",
    },
    {
      icon: Search,
      title: "Review your matches",
      description: "Once we find matching properties, you'll review and respond here.",
      done: state.hasMatches,
      cta: "View Matches",
      to: "/dashboard/matches",
    },
    {
      icon: BarChart3,
      title: "Track your exchange progress",
      description: "Monitor deadlines, status updates, and timelines from the Overview page.",
      done: false,
      cta: "Go to Overview",
      to: "/dashboard/overview",
    },
    {
      icon: HelpCircle,
      title: "Need help?",
      description: "Learn how 1031 exchanges work and get answers to common questions.",
      done: false,
      cta: "Visit Help",
      to: "/dashboard/help",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Let's get your 1031 exchange started
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete these steps to make the most of the platform.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4 p-5">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    step.done ? "bg-green-500/10" : "bg-primary/10"
                  }`}
                >
                  {step.done ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Icon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="shrink-0 self-center">
                  {step.done ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                      <Check className="h-3 w-3" /> Done
                    </span>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link to={step.to}>{step.cta}</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{completed} of {steps.length} complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
