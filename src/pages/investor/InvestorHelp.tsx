import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestorHelp() {
  const items = [
    { title: "How are replacement properties chosen?", body: "Matching is automatic. A property must be affordable using your exchange equity at a 75% loan-to-value assumption and must produce a higher projected return on equity than your current property." },
    { title: "Can I browse every property on the platform?", body: "No. The investor workspace only reveals properties that the matching engine qualifies for one of your active exchanges." },
    { title: "Can I manage more than one exchange?", body: "Yes. Add each current property as its own exchange, then use My Exchanges or the listing selector in Matches to move between them." },
    { title: "Can I publish my own property?", body: "Yes. Create a listing, enter the property and financial information, confirm ownership or authorization, and publish it to run matching." },
    { title: "How do I contact a listing agent?", body: "Open a matched property and choose Message Listing Agent. The private conversation and its progress remain attached to that match in your pipeline." },
  ];
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-bold text-foreground">Investor help</h1><p className="mt-1 text-sm text-muted-foreground">Quick answers for managing self-directed exchanges.</p></div><div className="space-y-4">{items.map((item) => <Card key={item.title}><CardHeader className="pb-2"><CardTitle className="text-base">{item.title}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{item.body}</CardContent></Card>)}</div><p className="text-center text-sm text-muted-foreground">Need help? <a className="font-medium text-primary underline" href="mailto:support@1031exchangeup.com">Contact support</a></p></div>;
}
