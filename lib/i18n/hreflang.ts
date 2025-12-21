import type { Locale } from "./locales";

export function buildHreflangs(locale: Locale | string, path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const clean = path.startsWith("/") ? path : `/${path}`;
  // keep list small in MVP; add all locales later
  return [
    { hrefLang: "x-default", href: `${base}/dk${clean}` },
    { hrefLang: "da-DK", href: `${base}/dk${clean}` },
    { hrefLang: "en", href: `${base}/en${clean}` },
  ];
}
