// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers"; // ✅ add
import { LOCALES, isLocale } from "@/lib/i18n/locales";
import { buildHreflangs } from "@/lib/i18n/hreflang";
import { baseMetadata } from "@/lib/seo/metadata";
import { supabaseServerReadOnly } from "@/lib/supabase/server-readonly";
import Shell from "@/components/Shell/Shell";

export const dynamic = "force-dynamic"; // ✅ add

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

  cookies(); // ✅ “touch” cookies so Next won't cache this layout

  const supabase = supabaseServerReadOnly();
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;

  return (
    <Shell locale={locale} user={user}>
      {children}
    </Shell>
  );
}