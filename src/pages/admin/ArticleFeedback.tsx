import { Fragment, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageSquareText } from "lucide-react";

type FeedbackRow = {
  id: string;
  user_id: string;
  article_id: string;
  article_type: string;
  article_title: string;
  helpful: boolean;
  comment: string | null;
  created_at: string;
};

type Comment = { text: string; created_at: string; user_email: string };

type ArticleSummary = {
  article_id: string;
  title: string;
  type: string;
  up: number;
  down: number;
  total: number;
  percent: number;
  comments: Comment[];
};

export default function ArticleFeedback() {
  const [summaries, setSummaries] = useState<ArticleSummary[]>([]);
  const [totals, setTotals] = useState({ votes: 0, up: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("article_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      toast({ title: "Failed to load feedback.", description: error?.message, variant: "destructive" });
      setSummaries([]);
      setLoading(false);
      return;
    }
    const rows = data as FeedbackRow[];

    // Resolve emails for rows that left a comment.
    const commenterIds = [...new Set(rows.filter((r) => r.comment).map((r) => r.user_id))];
    const profileMap = new Map<string, string>();
    if (commenterIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", commenterIds);
      (profiles || []).forEach((p: any) => profileMap.set(p.id, p.email || "Unknown"));
    }

    const byArticle = new Map<string, ArticleSummary>();
    for (const r of rows) {
      let s = byArticle.get(r.article_id);
      if (!s) {
        s = { article_id: r.article_id, title: r.article_title, type: r.article_type, up: 0, down: 0, total: 0, percent: 0, comments: [] };
        byArticle.set(r.article_id, s);
      }
      if (r.helpful) s.up += 1;
      else s.down += 1;
      s.total += 1;
      if (r.comment) {
        s.comments.push({ text: r.comment, created_at: r.created_at, user_email: profileMap.get(r.user_id) || "Unknown" });
      }
    }

    const list = [...byArticle.values()].map((s) => ({ ...s, percent: Math.round((s.up / s.total) * 100) }));
    // Worst-landing first: lowest helpful %, then most-voted.
    list.sort((a, b) => a.percent - b.percent || b.total - a.total);

    const votes = rows.length;
    const up = rows.filter((r) => r.helpful).length;

    setSummaries(list);
    setTotals({ votes, up });
    setLoading(false);
  }

  const overallPercent = totals.votes ? Math.round((totals.up / totals.votes) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Help Article Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {summaries.length} article{summaries.length !== 1 ? "s" : ""} rated · {totals.votes} total vote{totals.votes !== 1 ? "s" : ""} ·{" "}
          {overallPercent}% helpful overall. Articles that aren't landing are listed first.
        </p>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No feedback yet. Ratings will appear here as agents use the Help Center.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="w-[90px]">Type</TableHead>
                  <TableHead className="w-[80px] text-center">Helpful</TableHead>
                  <TableHead className="w-[80px] text-center">Not</TableHead>
                  <TableHead className="w-[110px]">Score</TableHead>
                  <TableHead className="w-[90px] text-center">Notes</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => {
                  const isExpanded = expandedId === s.article_id;
                  const scoreColor = s.percent >= 75 ? "text-green-700" : s.percent >= 50 ? "text-amber-700" : "text-red-700";
                  return (
                    <Fragment key={s.article_id}>
                      <TableRow
                        className={`cursor-pointer hover:bg-muted/50 ${s.comments.length ? "" : "cursor-default"}`}
                        onClick={() => s.comments.length && setExpandedId(isExpanded ? null : s.article_id)}
                      >
                        <TableCell className="max-w-[280px] truncate text-sm font-medium">{s.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs uppercase">{s.type}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-green-700">
                            <ThumbsUp className="h-3.5 w-3.5" />{s.up}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm text-red-700">
                            <ThumbsDown className="h-3.5 w-3.5" />{s.down}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-semibold ${scoreColor}`}>{s.percent}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.comments.length ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquareText className="h-3.5 w-3.5" />{s.comments.length}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.comments.length ? (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : null}
                        </TableCell>
                      </TableRow>
                      {isExpanded && s.comments.length > 0 && (
                        <TableRow key={`${s.article_id}-detail`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              What agents were looking for
                            </h4>
                            <ul className="space-y-2">
                              {s.comments.map((c, i) => (
                                <li key={i} className="rounded-md border border-border bg-card p-3 text-sm">
                                  <p className="whitespace-pre-wrap text-foreground">{c.text}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {c.user_email} · {new Date(c.created_at).toLocaleDateString()}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
