import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves legacy /agent/matches/:id deep links into the unified Matches inbox
 * URL: /agent/matches?listing=:exchangeId&match=:matchId.
 *
 * The :id param could be either a match id or a connection id (the unified
 * relationships use connection.id when present, else match.id).
 */
export default function MatchRedirect() {
  const { id } = useParams<{ id: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      // Try as match id first
      const { data: m } = await supabase
        .from("matches")
        .select("id, buyer_exchange_id")
        .eq("id", id)
        .maybeSingle();
      if (m?.buyer_exchange_id) {
        if (!cancelled) {
          setTarget(`/agent/matches?listing=${m.buyer_exchange_id}&match=${m.id}`);
          setDone(true);
        }
        return;
      }
      // Fall back to connection id
      const { data: c } = await supabase
        .from("exchange_connections")
        .select("match_id")
        .eq("id", id)
        .maybeSingle();
      if (c?.match_id) {
        const { data: m2 } = await supabase
          .from("matches")
          .select("id, buyer_exchange_id")
          .eq("id", c.match_id)
          .maybeSingle();
        if (m2?.buyer_exchange_id && !cancelled) {
          setTarget(`/agent/matches?listing=${m2.buyer_exchange_id}&match=${m2.id}`);
          setDone(true);
          return;
        }
      }
      if (!cancelled) {
        setTarget("/agent/pipeline");
        setDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!done || !target) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <Navigate to={target} replace />;
}
