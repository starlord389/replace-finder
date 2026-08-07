import { useCallback, useEffect, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Representation } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageRow { id: string; sender_id: string; content: string; created_at: string }

export function ClientAgentConversation({ representation, counterpartName }: { representation: Representation; counterpartName: string }) {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data: thread } = await (supabase.from("client_agent_threads" as any).select("id").eq("representation_id", representation.id).is("exchange_id", null).is("match_id", null).maybeSingle() as any);
    setThreadId(thread?.id ?? null);
    if (!thread?.id) return setMessages([]);
    const { data } = await (supabase.from("client_agent_messages" as any).select("id, sender_id, content, created_at").eq("thread_id", thread.id).order("created_at") as any);
    setMessages((data ?? []) as MessageRow[]);
  }, [representation.id]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function send() {
    if (!user || !draft.trim() || !representation.investor_id || !representation.agent_id) return;
    setSending(true);
    let targetThread = threadId;
    if (!targetThread) {
      const { data, error } = await (supabase.from("client_agent_threads" as any).insert({
        representation_id: representation.id,
        investor_id: representation.investor_id,
        agent_id: representation.agent_id,
      }).select("id").single() as any);
      if (error) { setSending(false); return toast.error(error.message); }
      targetThread = data.id;
      setThreadId(targetThread);
    }
    const { error } = await (supabase.from("client_agent_messages" as any).insert({ thread_id: targetThread, sender_id: user.id, content: draft.trim() }) as any);
    setSending(false);
    if (error) return toast.error(error.message);
    setDraft("");
    await load();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageSquareText className="h-5 w-5" />Messages with {counterpartName}</CardTitle><CardDescription>This conversation is private to you and {counterpartName}. The agent on the other side cannot see it.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-3">
          {messages.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Use this space to discuss matches, timing, and next steps.</p> : messages.map((message) => <div key={message.id} className={cn("flex", message.sender_id === user?.id ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-sm", message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "border bg-background")}><p>{message.content}</p><p className={cn("mt-1 text-[10px]", message.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{new Date(message.created_at).toLocaleString()}</p></div></div>)}
        </div>
        <div className="flex items-end gap-2"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={4000} placeholder={`Message ${counterpartName}…`} /><Button size="icon" onClick={send} disabled={sending || !draft.trim()}><Send className="h-4 w-4" /><span className="sr-only">Send message</span></Button></div>
      </CardContent>
    </Card>
  );
}
