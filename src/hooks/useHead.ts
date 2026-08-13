import { useEffect } from "react";

export const SITE_URL = "https://1031exchangeup.com";

/**
 * Lightweight document head manager - no external dependency needed.
 * Sets document.title and updates/creates meta tags on mount.
 */
export function useHead({
  title,
  description,
  canonical,
  noindex,
}: {
  title?: string;
  description?: string;
  /** Route path (e.g. "/agents") or an absolute URL. */
  canonical?: string;
  /** Utility routes that should stay out of search results. */
  noindex?: boolean;
}) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    if (title) {
      upsertMeta("property", "og:title", title);
      upsertMeta("name", "twitter:title", title);
    }
    if (canonical) {
      const href = canonical.startsWith("http") ? canonical : `${SITE_URL}${canonical}`;
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = href;
      upsertMeta("property", "og:url", href);
    }

    upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");

    if (noindex) {
      // Utility routes must not claim a canonical URL of their own.
      document.querySelector('link[rel="canonical"]')?.remove();
    }
  }, [title, description, canonical, noindex]);
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}
