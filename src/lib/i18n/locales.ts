export const LOCALES = ["dk", "en", "se", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || "dk";

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}
