import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Search, Compass, Users, ArrowLeftRight, Handshake, Link2,
  MessageSquare, BookOpen, LifeBuoy, Loader2, ChevronRight, X,
  FileText, BookMarked, HelpCircle,
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
import { ArticleFeedback } from "@/features/feedback/components/ArticleFeedback";
import { faqArticleId, docArticleId } from "@/features/feedback/types";
import {
  TICKET_CATEGORIES, TICKET_STATUS_COLORS, TICKET_STATUS_LABELS,
  type TicketCategory, type TicketStatus,
} from "@/features/support/types";

const QUICK_START = [
  { icon: Users, title: "Set up your profile", description: "Add your brokerage and license info so counter-party agents recognize you.", to: "/agent/settings" },
  { icon: Users, title: "Add your first client", description: "Capture client contact info and exchange goals.", to: "/agent/clients" },
  { icon: ArrowLeftRight, title: "Create a listing", description: "Walk the 4-step wizard to define the relinquished property and replacement criteria.", to: "/agent/exchanges/new" },
  { icon: Compass, title: "Browse your pipeline", description: "See every active match across your clients in one stage board.", to: "/agent/pipeline" },
  { icon: Handshake, title: "Work a match", description: "Open a property in the Workspace to review, message, and send to client.", to: "/agent/pipeline" },
  { icon: Link2, title: "Connect with another agent", description: "Initiate a connection to share details and chat.", to: "/agent/pipeline?filter=client_interested" },
];

type SearchHit = {
  kind: "faq" | "doc" | "term";
  title: string;
  body: string;
  tag: string;
  docId?: string;
};

const HIT_META: Record<SearchHit["kind"], { label: string; icon: typeof FileText; className: string }> = {
  faq: { label: "FAQ", icon: HelpCircle, className: "bg-blue-50 text-blue-700 border-blue-200" },
  doc: { label: "Guide", icon: FileText, className: "bg-primary/10 text-primary border-primary/20" },
  term: { label: "Term", icon: BookMarked, className: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function AgentHelp() {
  const initialTab = (typeof window !== "undefined" && window.location.hash.replace("#", "")) || "getting-started";
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [openDocs, setOpenDocs] = useState<string[]>([]);
  const [ticketPrefill, setTicketPrefill] = useState("");

  const trimmed = query.trim();

  const goToTab = (v: string) => {
    setTab(v);
    window.history.replaceState(null, "", `#${v}`);
  };

  /** Switch to the Support tab, optionally pre-filling the ticket subject. */
  const openSupport = (prefill = "") => {
    setQuery("");
    setTicketPrefill(prefill);
    goToTab("tickets");
  };

  /** Switch to the Guides tab and expand a specific guide. */
  const openGuide = (docId: string) => {
    setOpenDocs([docId]);
    goToTab("docs");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero + global search */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <LifeBuoy className="h-4 w-4" />
          Help Center
        </div>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">How can we help?</h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Search guides, FAQs, and 1031 terms — or reach our team directly. Everything you need to run your exchanges smoothly.
        </p>
        <div className="relative mt-5 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            placeholder="Search the help center…"
            className="h-12 rounded-xl border-border bg-background pl-10 pr-10 text-base shadow-sm"
            aria-label="Search the help center"
          />
          {trimmed && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {trimmed ? (
        <SearchResults query={trimmed} onClear={() => setQuery("")} onOpenSupport={openSupport} />
      ) : (
        <Tabs value={tab} onValueChange={goToTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5">
            <TabsTrigger value="getting-started" className="py-2"><Compass className="mr-2 h-4 w-4" />Get Started</TabsTrigger>
            <TabsTrigger value="faqs" className="py-2"><LifeBuoy className="mr-2 h-4 w-4" />FAQs</TabsTrigger>
            <TabsTrigger value="docs" className="py-2"><BookOpen className="mr-2 h-4 w-4" />Guides</TabsTrigger>
            <TabsTrigger value="glossary" className="py-2"><BookMarked className="mr-2 h-4 w-4" />Glossary</TabsTrigger>
            <TabsTrigger value="tickets" className="col-span-2 py-2 sm:col-span-1"><MessageSquare className="mr-2 h-4 w-4" />Support</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <SectionHeader icon={Compass} title="Quick Start" description="Six steps to your first connection." />
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {QUICK_START.map((step, i) => (
                    <Link
                      key={i}
                      to={step.to}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <step.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="flex items-center gap-1 text-sm font-medium text-foreground">
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
                <SectionHeader icon={BookOpen} title="Popular guides" description="The most-read walkthroughs." />
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {AGENT_DOCS.slice(0, 4).map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openGuide(doc.id)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {doc.title}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs" className="mt-6">
            <FaqsPanel />
          </TabsContent>

          <TabsContent value="docs" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <SectionHeader icon={BookOpen} title="Guides" description="Long-form walkthroughs for the most-used parts of the platform." />
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" value={openDocs} onValueChange={setOpenDocs} className="w-full">
                  {AGENT_DOCS.map((doc) => (
                    <AccordionItem key={doc.id} value={doc.id}>
                      <AccordionTrigger className="text-left text-sm font-medium">{doc.title}</AccordionTrigger>
                      <AccordionContent>
                        <RichText body={doc.body} />
                        <ArticleFeedback articleId={docArticleId(doc.id)} articleType="doc" articleTitle={doc.title} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="glossary" className="mt-6">
            <GlossaryPanel />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6 space-y-6">
            <SubmitTicketForm key={ticketPrefill} initialSubject={ticketPrefill} />
            <MyTicketsList />
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Still need help?</p>
              <p className="text-xs text-muted-foreground">Email support@1031exchangeup.com — we typically reply within one business day.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => openSupport()}>
            <MessageSquare className="mr-1.5 h-4 w-4" />Contact support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: typeof Compass; title: string; description: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="mt-0.5">{description}</CardDescription>
      </div>
    </div>
  );
}

/** Highlights every case-insensitive occurrence of `query` within `text`. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = q.toLowerCase();
  const parts: JSX.Element[] = [];
  let rest = text;
  let key = 0;
  while (rest) {
    const i = rest.toLowerCase().indexOf(lower);
    if (i === -1) {
      parts.push(<span key={key++}>{rest}</span>);
      break;
    }
    if (i > 0) parts.push(<span key={key++}>{rest.slice(0, i)}</span>);
    parts.push(
      <mark key={key++} className="rounded bg-primary/15 px-0.5 text-foreground">{rest.slice(i, i + q.length)}</mark>,
    );
    rest = rest.slice(i + q.length);
  }
  return <>{parts}</>;
}

/** Renders the lightweight markdown used in help content: **bold** inline, paragraphs, and "- " bullet lists. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function RichText({ body }: { body: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {body.split("\n\n").map((block, bi) => {
        const lines = block.split("\n");
        const out: JSX.Element[] = [];
        let bullets: string[] = [];
        const flush = (key: string) => {
          if (bullets.length) {
            const items = bullets;
            out.push(
              <ul key={key} className="list-disc space-y-1 pl-5">
                {items.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
              </ul>,
            );
            bullets = [];
          }
        };
        lines.forEach((line, i) => {
          const t = line.trim();
          if (t.startsWith("- ")) {
            bullets.push(t.slice(2));
          } else {
            flush(`ul-${bi}-${i}`);
            if (t) out.push(<p key={`p-${bi}-${i}`}>{renderInline(t)}</p>);
          }
        });
        flush(`ul-${bi}-end`);
        return out;
      })}
    </div>
  );
}

function SearchResults({ query, onClear, onOpenSupport }: { query: string; onClear: () => void; onOpenSupport: (prefill?: string) => void }) {
  const hits = useMemo<SearchHit[]>(() => {
    const q = query.toLowerCase();
    const matches = (...fields: string[]) => fields.some((f) => f.toLowerCase().includes(q));
    const res: SearchHit[] = [];
    AGENT_FAQS.forEach((cat) =>
      cat.items.forEach((it) => {
        if (matches(it.q, it.a)) res.push({ kind: "faq", title: it.q, body: it.a, tag: cat.category });
      }),
    );
    AGENT_DOCS.forEach((doc) => {
      if (matches(doc.title, doc.body)) res.push({ kind: "doc", title: doc.title, body: doc.body, tag: "Guide", docId: doc.id });
    });
    GLOSSARY.forEach((g) => {
      if (matches(g.term, g.definition)) res.push({ kind: "term", title: g.term, body: g.definition, tag: "Glossary" });
    });
    // Rank title/term matches above body-only matches (stable within each group).
    return res.sort((a, b) => Number(b.title.toLowerCase().includes(q)) - Number(a.title.toLowerCase().includes(q)));
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hits.length === 0
            ? <>No results for <span className="font-medium text-foreground">"{query}"</span></>
            : <><span className="font-semibold text-foreground">{hits.length}</span> result{hits.length === 1 ? "" : "s"} for <span className="font-medium text-foreground">"{query}"</span></>}
        </p>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-muted-foreground">
          <X className="mr-1.5 h-3.5 w-3.5" />Clear
        </Button>
      </div>

      {hits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Nothing matched your search. Try a different term, or send us the question directly and we'll help.
            </p>
            <Button size="sm" onClick={() => onOpenSupport(query)}>
              <MessageSquare className="mr-1.5 h-4 w-4" />Submit a ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-2">
              <Accordion type="single" collapsible className="w-full">
                {hits.map((hit, i) => {
                  const meta = HIT_META[hit.kind];
                  const Icon = meta.icon;
                  return (
                    <AccordionItem key={`${hit.kind}-${i}`} value={`${hit.kind}-${i}`} className="px-2">
                      <AccordionTrigger className="gap-3 text-left text-sm hover:no-underline">
                        <span className="flex flex-1 items-center gap-3">
                          <Badge variant="outline" className={`shrink-0 gap-1 text-xs ${meta.className}`}>
                            <Icon className="h-3 w-3" />{meta.label}
                          </Badge>
                          <span className="font-medium text-foreground">
                            <Highlight text={hit.title} query={query} />
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <RichText body={hit.body} />
                        <p className="mt-3 text-xs text-muted-foreground">In {hit.tag}</p>
                        {hit.kind === "faq" && (
                          <ArticleFeedback articleId={faqArticleId(hit.title)} articleType="faq" articleTitle={hit.title} />
                        )}
                        {hit.kind === "doc" && hit.docId && (
                          <ArticleFeedback articleId={docArticleId(hit.docId)} articleType="doc" articleTitle={hit.title} />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            Can't find what you're looking for?
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onOpenSupport(query)}>
              Submit a ticket
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function FaqsPanel() {
  return (
    <div className="space-y-4">
      {AGENT_FAQS.map((cat) => (
        <Card key={cat.category}>
          <CardHeader>
            <CardTitle className="text-sm">{cat.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {cat.items.map((it, i) => (
                <AccordionItem key={i} value={`${cat.category}-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{it.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {it.a}
                    <ArticleFeedback articleId={faqArticleId(it.q)} articleType="faq" articleTitle={it.q} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GlossaryPanel() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
    if (!q) return sorted;
    return sorted.filter((g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q));
  }, [query]);

  return (
    <Card>
      <CardHeader>
        <SectionHeader icon={BookMarked} title="1031 Glossary" description="Common terms used throughout the platform." />
        <div className="relative pt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter terms…"
            className="pl-9"
            aria-label="Filter glossary terms"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No terms match "{query}".</p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {filtered.map((g) => (
              <div key={g.term} className="rounded-xl border border-border bg-card p-4">
                <dt className="text-sm font-semibold text-foreground">
                  <Highlight text={g.term} query={query} />
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitTicketForm({ initialSubject = "" }: { initialSubject?: string }) {
  const [category, setCategory] = useState<TicketCategory>("general");
  const [subject, setSubject] = useState(initialSubject);
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
        <SectionHeader icon={MessageSquare} title="Submit a Ticket" description="Report a bug, request a feature, or ask a question." />
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
        <SectionHeader icon={LifeBuoy} title="Your Tickets" description="Track the status of your past submissions." />
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
