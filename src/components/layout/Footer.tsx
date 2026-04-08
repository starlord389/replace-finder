import { Link } from "react-router-dom";

const links = {
  Platform: [
    { label: "How It Works", to: "/how-it-works" },
    { label: "For Agents", to: "/signup" },
  ],
  Legal: [
    { label: "Terms of Service", to: "#" },
    { label: "Privacy Policy", to: "#" },
  ],
  Support: [
    { label: "Contact Us", to: "mailto:support@1031exchangeup.com" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="text-lg font-bold tracking-tight">
              <span className="text-gray-400">1031</span>
              <span className="text-gray-900">ExchangeUp</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              The exchange network for 1031 agents. Automatic matching, boot
              calculations, and exchange tracking — all in one platform.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) =>
                  item.to.startsWith("mailto:") ? (
                    <li key={item.label}>
                      <a
                        href={item.to}
                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 1031ExchangeUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
