import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How It Works
          </Link>
        </div>
      </div>
    </footer>
  );
}
