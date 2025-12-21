import type { Locale } from "./locales";
import { DEFAULT_LOCALE, isLocale } from "./locales";

export function parseLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1] ?? "";
  if (isLocale(seg)) return seg;
  return DEFAULT_LOCALE;
}
