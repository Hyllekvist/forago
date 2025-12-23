import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n/locales";
import { buildHreflangs } from "@/lib/i18n/hreflang";
import { Shell } from "@/components/Shell/Shell";
import { baseMetadata } from "@/lib/seo/metadata";

type Props = { children: React.ReactNode; params: { locale: string } };

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  if (!isLocale(locale)) return {};

  const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const href = `${urlBase}/${locale}`;

  return baseMetadata({
    title: "Forago",
    description:
      "Find, understand, and use wild food — season-first, privacy-first knowledge and community.",
    url: href,
    locale,
    hreflangs: buildHreflangs(locale, "/"),
  });
}

export default function LocaleLayout({ children, params }: Props) {
  if (!isLocale(params.locale)) return notFound();

  return <Shell locale={params.locale}>{children}</Shell>;
}
