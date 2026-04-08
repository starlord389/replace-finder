import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/40" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <span className="text-lg font-bold text-foreground">
              1031<span className="text-primary">ExchangeUp</span>
            </span>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              The private agent network for 1031 exchange matching.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-foreground">Platform</h4>
              <ul className="mt-3 space-y-2">
                <li><Link to="/how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">How It Works</Link></li>
                <li><span className="text-muted-foreground cursor-default">For Agents</span></li>
                <li><span className="text-muted-foreground cursor-default">Pricing</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li><span className="text-muted-foreground cursor-default">Terms</span></li>
                <li><span className="text-muted-foreground cursor-default">Privacy</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="mailto:support@1031exchangeup.com" className="text-muted-foreground transition-colors hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
