import { HelpCircle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I add a client?", a: "Navigate to My Clients and click 'Add Client'. Fill in their contact information and any relevant notes about their exchange goals." },
  { q: "How does matching work?", a: "Once you create an exchange for a client and pledge their property, the platform will automatically find matching properties from other agents in the network based on price, location, asset type, and other criteria." },
  { q: "What are the 1031 exchange deadlines?", a: "After the sale of the relinquished property closes, you have 45 days to identify replacement properties and 180 days to close on them. The platform tracks these deadlines automatically." },
  { q: "How does agent verification work?", a: "Agents self-certify at signup by providing their license or MLS information and confirming it is accurate. Your workspace becomes active without any manual approval queue." },
  { q: "How do connections work?", a: "When you find a match you're interested in, you can initiate a connection with the other agent. Both parties must agree before any client details are shared." },
];

export default function AgentHelp() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Help & FAQ</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 py-5">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Need more help?</p>
            <p className="text-xs text-muted-foreground">Contact us at support@1031exchangeup.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
