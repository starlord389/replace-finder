import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30" role="contentinfo">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 sm:py-10">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
        </p>
        <nav aria-label="Footer navigation" className="flex gap-6">
          <Link to="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Log In
          </Link>
        </nav>
      </div>
    </footer>
  );
}
