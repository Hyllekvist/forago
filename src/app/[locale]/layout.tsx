// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/lib/i18n/locales";
import { buildHreflangs } from "@/lib/i18n/hreflang";
import { baseMetadata } from "@/lib/seo/metadata";
import { supabaseServerReadOnly } from "@/lib/supabase/server-readonly";
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
  if (!isLocale(locale)) notFound();

  // ✅ read-only client (never sets cookies)
  const supabase = supabaseServerReadOnly();

  // ✅ do NOT use getUser() here (can try cookies().set in some setups)
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;

  return (
    <Shell locale={locale} user={user}>
      {children}
    </Shell>
  );
}