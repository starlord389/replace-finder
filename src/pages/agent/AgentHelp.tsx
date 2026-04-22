import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Search, Compass, Users, ArrowLeftRight, Handshake, Link2,
  MessageSquare, BookOpen, LifeBuoy, Loader2, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AGENT_FAQS } from "@/content/helpFaqs";
import { AGENT_DOCS, GLOSSARY } from "@/content/helpDocs";
import { useSubmitTicket } from "@/features/support/hooks/useSubmitTicket";
import { useMyTickets } from "@/features/support/hooks/useMyTickets";
import {
  TICKET_CATEGORIES, TICKET_STATUS_COLORS, TICKET_STATUS_LABELS,
  type TicketCategory, type TicketStatus,
} from "@/features/support/types";

const QUICK_START = [
  { icon: Users, title: "Set up your profile", description: "Add your brokerage and license info so counter-party agents recognize you.", to: "/agent/settings" },
  { icon: Users, title: "Add your first client", description: "Capture client contact info and exchange goals.", to: "/agent/clients" },
  { icon: ArrowLeftRight, title: "Create an exchange", description: "Walk the 4-step wizard to define the relinquished property and replacement criteria.", to: "/agent/exchanges/new" },
  { icon: Compass, title: "Pledge a property", description: "List your client's relinquished property to enter the matching network.", to: "/agent/exchanges" },
  { icon: Handshake, title: "Review matches", description: "See scored properties from other agents in the network.", to: "/agent/matches" },
  { icon: Link2, title: "Connect with another agent", description: "Initiate a connection to share details and chat.", to: "/agent/connections" },
];

export default function AgentHelp() {
  const initialTab = (typeof window !== "undefined" && window.location.hash.replace("#", "")) || "getting-started";
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guides, FAQs, and direct support — everything you need to run your exchanges smoothly.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); window.history.replaceState(null, "", `#${v}`); }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="getting-started"><Compass className="mr-2 h-4 w-4" />Getting Started</TabsTrigger>
          <TabsTrigger value="faqs"><LifeBuoy className="mr-2 h-4 w-4" />FAQs</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="mr-2 h-4 w-4" />Documentation</TabsTrigger>
          <TabsTrigger value="tickets"><MessageSquare className="mr-2 h-4 w-4" />Submit a Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start</CardTitle>
              <CardDescription>Six steps to your first connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUICK_START.map((step, i) => (
                  <Link
                    key={i}
                    to={step.to}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1">
                        {i + 1}. {step.title}
                        <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">1031 Glossary</CardTitle>
              <CardDescription>Common terms used throughout the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {GLOSSARY.map((g) => (
                  <div key={g.term} className="border-l-2 border-border pl-3">
                    <dt className="text-sm font-semibold text-foreground">{g.term}</dt>
                    <dd className="mt-0.5 text-sm text-muted-foreground">{g.definition}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <FaqsPanel />
        </TabsContent>

        <TabsContent value="docs" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentation</CardTitle>
              <CardDescription>Long-form guides for the most-used parts of the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {AGENT_DOCS.map((doc) => (
                  <AccordionItem key={doc.id} value={doc.id}>
                    <AccordionTrigger className="text-left text-sm font-medium">{doc.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                        {doc.body.split("\n\n").map((para, i) => (
                          <p key={i} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/\n/g, "<br/>") }} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6 space-y-6">
          <SubmitTicketForm />
          <MyTicketsList />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="flex items-center gap-3 py-5">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Still need help?</p>
            <p className="text-xs text-muted-foreground">Email support@1031exchangeup.com — we typically reply within one business day.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FaqsPanel() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AGENT_FAQS;
    return AGENT_FAQS
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No FAQs match "{query}".</CardContent></Card>
      ) : (
        filtered.map((cat) => (
          <Card key={cat.category}>
            <CardHeader>
              <CardTitle className="text-sm">{cat.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {cat.items.map((it, i) => (
                  <AccordionItem key={i} value={`${cat.category}-${i}`}>
                    <AccordionTrigger className="text-left text-sm">{it.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{it.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function SubmitTicketForm() {
  const [category, setCategory] = useState<TicketCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const submit = useSubmitTicket();

  const subjectError = subject.length > 120 ? "Subject must be 120 characters or fewer." : "";
  const messageError = message.length > 2000 ? "Message must be 2000 characters or fewer." : "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Please enter a subject.");
    if (!message.trim()) return toast.error("Please enter a message.");
    if (subjectError || messageError) return;
    submit.mutate(
      { subject, message, category },
      {
        onSuccess: () => {
          toast.success("Ticket submitted — we'll get back to you soon.");
          setSubject("");
          setMessage("");
          setCategory("general");
        },
        onError: (err: any) => toast.error(err?.message ?? "Failed to submit ticket."),
      },
    );
  }

  const messagePlaceholder =
    category === "bug"
      ? "Describe what happened, what you expected, and the steps to reproduce. Include the page URL if possible."
      : "Tell us as much as you can — the more context, the faster we can help.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Submit a Ticket</CardTitle>
        <CardDescription>Report a bug, request a feature, or ask a question.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
              <SelectTrigger id="ticket-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={140}
              placeholder="Briefly summarize your issue"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={subjectError ? "text-destructive" : ""}>{subjectError}</span>
              <span>{subject.length}/120</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-message">Message</Label>
            <Textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={2200}
              placeholder={messagePlaceholder}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={messageError ? "text-destructive" : ""}>{messageError}</span>
              <span>{message.length}/2000</span>
            </div>
          </div>

          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : "Submit Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MyTicketsList() {
  const { data: tickets, isLoading } = useMyTickets();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Tickets</CardTitle>
        <CardDescription>Track the status of your past submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !tickets || tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">You haven't submitted any tickets yet.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {tickets.map((t) => {
              const status = t.status as TicketStatus;
              const catLabel = TICKET_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category;
              return (
                <AccordionItem key={t.id} value={t.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium text-foreground">{t.subject}</span>
                        <span className="text-xs text-muted-foreground">
                          {catLabel} · {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${TICKET_STATUS_COLORS[status]}`}>
                        {TICKET_STATUS_LABELS[status] ?? t.status}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your message</p>
                        <p className="mt-1 whitespace-pre-wrap text-foreground">{t.message}</p>
                      </div>
                      {t.admin_notes && (
                        <div className="rounded-md border border-border bg-muted/40 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support reply</p>
                          <p className="mt-1 whitespace-pre-wrap text-foreground">{t.admin_notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Last updated {new Date(t.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
