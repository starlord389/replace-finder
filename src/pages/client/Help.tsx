import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Phone, HelpCircle } from "lucide-react";

export default function Help() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
      <p className="mt-1 text-sm text-muted-foreground">Find answers to common questions or get in touch with our team.</p>

      <div className="mt-6 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">How does 1031 Exchange matching work?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  After you submit an exchange request, our team reviews your criteria and runs a matching algorithm against our curated property inventory. You'll be notified when matches are available for your review.
                </p>
                <Link to="/how-it-works" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Learn more <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">What happens after I express interest?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  When you mark a match as "Interested," our team will reach out to coordinate next steps including property details, financials, and scheduling tours or calls with the listing broker.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@1031exchangeup.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>(555) 123-4567</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
