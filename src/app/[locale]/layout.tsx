// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n/locales";
import { buildHreflangs } from "@/lib/i18n/hreflang";
import { baseMetadata } from "@/lib/seo/metadata";
import { supabaseServer } from "@/lib/supabase/server";
import Shell from "@/components/Shell/Shell";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

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

export default async function LocaleLayout({ children, params }: Props) {
  const locale = params.locale;
  if (!isLocale(locale)) return notFound();

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // hard fail giver bare mere pain i prod – treat as logged out
    // (du kan logge error server-side hvis du vil)
  }
  const user = data?.user ?? null;

  return (
    <Shell locale={locale} user={user}>
      {children}
    </Shell>
  );
}