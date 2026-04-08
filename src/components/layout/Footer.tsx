import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30" role="contentinfo">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-sm font-semibold text-foreground">
            1031<span className="text-primary">ExchangeUp</span>
          </span>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex gap-8">
          <Link to="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Log In
          </Link>
          <span className="text-sm text-muted-foreground cursor-default">Privacy</span>
          <span className="text-sm text-muted-foreground cursor-default">Terms</span>
        </nav>
      </div>
    </footer>
  );
}
