import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  HelpCircle, Mail, Phone, FileText, ArrowRight,
  BarChart3, Search, Shield, Send, Clock, CheckCircle2,
  AlertCircle, Loader2,
} from "lucide-react";

const faqCategories = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is 1031ExchangeUp?",
        a: "1031ExchangeUp is a private platform that helps real estate investors find replacement properties for their 1031 exchange. Unlike public marketplaces, we curate an off-market inventory and use a proprietary matching algorithm to surface properties that fit your specific exchange criteria — including price range, asset type, geography, investment strategy, and financial profile.",
      },
      {
        q: "How do I get started?",
        a: "After creating your account, navigate to your Dashboard and click \"New Exchange Request.\" You'll be guided through a multi-step form that captures details about the property you're selling (the relinquished property) and what you're looking for in a replacement. Once submitted, our team reviews your request and begins matching.",
      },
      {
        q: "What information do I need to submit a request?",
        a: "At minimum, you'll need the address and estimated value of your relinquished property, your target asset types and geographic preferences, and your price range. For the best matches, also provide financial details like NOI, cap rate, occupancy, debt information, and your exchange deadlines (identification and close dates).",
      },
      {
        q: "How long does the review process take?",
        a: "Most exchange requests are reviewed within 1–2 business days. Complex requests with specific criteria may take slightly longer. You'll see your request status update from \"Submitted\" to \"Under Review\" to \"Active\" as our team processes it.",
      },
      {
        q: "Is there a cost to use the platform?",
        a: "Creating an account and submitting exchange requests is free. Our fee structure is tied to successful exchanges — your advisor will discuss specific terms when you express interest in a matched property.",
      },
    ],
  },
  {
    title: "Exchange Requests",
    items: [
      {
        q: "Can I have multiple active exchange requests?",
        a: "Yes. If you're selling multiple properties, you can submit a separate exchange request for each one. Each request is matched independently against our inventory, and your matches are organized by request on your dashboard.",
      },
      {
        q: "Can I edit my request after submitting?",
        a: "You can edit requests that are in \"Submitted\" or \"Draft\" status. Once a request moves to \"Under Review\" or \"Active,\" contact our support team to make changes — this ensures your existing matches remain accurate.",
      },
      {
        q: "What do the request statuses mean?",
        a: "Draft: You started but haven't submitted yet. Submitted: Received and awaiting review. Under Review: Our team is evaluating your criteria. Active: Your request is live and being matched against inventory. Closed: The exchange is complete or the request has been withdrawn.",
      },
      {
        q: "How are my exchange deadlines tracked?",
        a: "When you provide your identification deadline (45 days from close of relinquished property) and close deadline (180 days), we factor these into our matching urgency scoring. Properties that can close within your timeline score higher.",
      },
      {
        q: "What happens if my request expires?",
        a: "If your exchange deadlines pass, our team will reach out to discuss next steps. You can close the request or update it if your timeline has changed (e.g., if your relinquished property sale was delayed).",
      },
    ],
  },
  {
    title: "Matching & Properties",
    items: [
      {
        q: "How does the matching algorithm work?",
        a: "Our matching engine scores every property in our inventory against your request across 6 dimensions: Price/Scale Fit (25%), Geography (20%), Asset Type (20%), Investment Strategy (15%), Financial Profile (10%), and Timing (10%). Properties scoring above our threshold are surfaced as matches for admin review before being sent to you.",
      },
      {
        q: "What do the match scores mean?",
        a: "Each match receives a score from 0 to 100. Scores of 85+ (green) indicate a strong fit across most dimensions. 70–84 (amber) means a good fit with some trade-offs. Below 70 (red) indicates notable gaps — these are included only when they offer unique value in other areas.",
      },
      {
        q: "Why do some matches score higher than others?",
        a: "Scores reflect how closely a property aligns with ALL of your criteria simultaneously. A property might score 100 on geography and asset type but lower on price if it's at the edge of your range. The breakdown on each match detail page shows exactly where scores are strong or weak.",
      },
      {
        q: "How often is matching run?",
        a: "Matching runs are triggered by our team when new inventory is added or when a new request becomes active. This is not a continuous real-time process — it's a curated, admin-reviewed workflow to ensure quality.",
      },
      {
        q: "What if no matches are found?",
        a: "If our current inventory doesn't have strong matches for your criteria, your request stays active and will be matched again as new properties are added. We'll notify you as soon as suitable matches are identified.",
      },
    ],
  },
  {
    title: "Reviewing Matches",
    items: [
      {
        q: "What happens after I express interest in a match?",
        a: "When you click \"Express Interest,\" our team is notified and will reach out to coordinate next steps. This typically includes sharing additional property details, financial documentation, and scheduling a call or tour with the listing broker.",
      },
      {
        q: "Can I change my mind after passing on a match?",
        a: "Currently, once you pass on a match, the response is recorded. If you change your mind, reach out to our support team and we can discuss re-opening the match.",
      },
      {
        q: "How do I read the financial analysis on a match?",
        a: "Each match detail page includes an Exchange Comparison showing your property vs. the replacement side-by-side, a Detailed Analysis section with operating statements and charts, and a Property Deep Dive with standalone metrics. Green indicators mean improvement, red means a trade-off. The analysis is designed to flow from simple to complex as you scroll.",
      },
      {
        q: "Who do I contact about a specific property?",
        a: "Use the \"Express Interest\" button on the match page, or submit a support ticket from this page referencing the property. Our team will connect you with the right contact.",
      },
    ],
  },
  {
    title: "Account & Privacy",
    items: [
      {
        q: "Is my data confidential?",
        a: "Yes. Your financial information, property details, and exchange criteria are strictly confidential. Only authorized admins on our platform can view your data for the purpose of facilitating your exchange. We never share your information with other clients or third parties without your consent.",
      },
      {
        q: "How do I update my profile?",
        a: "Navigate to Settings from your dashboard sidebar. You can update your name, email, phone number, and company information at any time.",
      },
      {
        q: "Who can see my information?",
        a: "Your exchange requests and financial data are visible only to you and our authorized admin team. Other clients on the platform cannot see your information. Property matches are private to each client.",
      },
      {
        q: "Can I delete my account?",
        a: "To delete your account and all associated data, please submit a support ticket from this page. Our team will process the request and confirm deletion within 5 business days.",
      },
    ],
  },
];

const howToGuides = [
  {
    title: "Submit Your First Exchange Request",
    description: "Walk through the multi-step intake form to tell us about your relinquished property and what you're looking for.",
    icon: FileText,
    link: "/dashboard/exchanges/new",
    linkText: "Start a Request",
  },
  {
    title: "Review & Respond to Matches",
    description: "Learn how to evaluate matched properties, read the comparison data, and express interest or pass.",
    icon: Search,
    link: "/dashboard/matches",
    linkText: "View Matches",
  },
  {
    title: "Understanding Match Scores",
    description: "Each match is scored across 6 dimensions. Learn what the scores mean and how to interpret the breakdown.",
    icon: BarChart3,
    link: null,
    content: "Match scores range from 0–100 and are weighted across Price (25%), Geography (20%), Asset Type (20%), Strategy (15%), Financial (10%), and Timing (10%). A score of 85+ means a strong fit. Open any match detail page to see the full breakdown with explanations for each dimension.",
  },
  {
    title: "Reading the Financial Analysis",
    description: "The match detail page provides a full investment memo. Here's how to navigate the comparison and analysis sections.",
    icon: BarChart3,
    link: null,
    content: "Start with the Exchange Comparison section for a quick side-by-side view. The summary cards show your equity position, cash flow change, and scale change at a glance. For deeper analysis, expand the Detailed Analysis section to see operating statements, exchange economics, and visual charts. The Property Deep Dive section provides standalone metrics with health indicators.",
  },
];

const ticketCategories = [
  { value: "general", label: "General Question" },
  { value: "technical", label: "Technical Issue" },
  { value: "match", label: "Match Question" },
  { value: "account", label: "Account Issue" },
  { value: "other", label: "Other" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "outline" },
};

export default function Help() {
  const { user } = useAuth();
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  async function loadTickets() {
    setLoadingTickets(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets(data || []);
    setLoadingTickets(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimSubject = subject.trim();
    const trimMessage = message.trim();
    if (!trimSubject || !trimMessage) {
      toast({ title: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (trimSubject.length > 200) {
      toast({ title: "Subject must be under 200 characters.", variant: "destructive" });
      return;
    }
    if (trimMessage.length > 5000) {
      toast({ title: "Message must be under 5,000 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: trimSubject,
      message: trimMessage,
      category,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit ticket.", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Support ticket submitted!", description: "Our team will respond shortly." });
      setSubject("");
      setMessage("");
      setCategory("general");
      loadTickets();
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find answers to common questions, learn how to use the platform, or reach out to our team.
      </p>

      {/* Section A: FAQs */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqCategories.map((cat) => (
            <Card key={cat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {cat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="multiple">
                  {cat.items.map((item, i) => (
                    <AccordionItem key={i} value={`${cat.title}-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section B: How-To Guides */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">How-To Guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {howToGuides.map((guide, i) => (
            <Card key={i} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">{guide.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{guide.description}</p>
                  </div>
                </div>
                {guide.link ? (
                  <Link
                    to={guide.link}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {guide.linkText} <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setExpandedGuide(expandedGuide === i ? null : i)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline text-left"
                    >
                      {expandedGuide === i ? "Hide details" : "Read more"} <ArrowRight className="h-3 w-3" />
                    </button>
                    {expandedGuide === i && guide.content && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t pt-2">
                        {guide.content}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section C: Contact & Support */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Support Form */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-1">Submit a Support Ticket</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Our team typically responds within 1 business day.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="ticket-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketCategories.map((c) => (
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
                    placeholder="Brief summary of your question"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-message">Message</Label>
                  <Textarea
                    id="ticket-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or issue in detail..."
                    rows={5}
                    maxLength={5000}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Ticket</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Other Ways to Reach Us</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@1031exchangeup.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Mon–Fri, 9am–5pm PT</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Past Tickets */}
      <section className="mt-8 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Support Tickets</h2>
        {loadingTickets ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No support tickets yet. Submit one above if you need help.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => {
              const sc = statusConfig[t.status] || statusConfig.open;
              return (
                <Card key={t.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{t.subject}</span>
                        <Badge variant={sc.variant} className="text-xs shrink-0">{sc.label}</Badge>
                        <Badge variant="outline" className="text-xs shrink-0 capitalize">{t.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
