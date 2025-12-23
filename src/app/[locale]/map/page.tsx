// src/app/[locale]/map/page.tsx
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapClient from "./MapClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export default async function MapPage({
  params,
}: {
  params: { locale: string };
}) {
  const locParam = params?.locale;
  if (!locParam || !isLocale(locParam)) return notFound();
  const locale = locParam;

  // Fail-safe: ingen throw på server
  try {
    const supabase = await supabaseServer();

    const { data: spots, error } = await supabase
      .from("spots")
      .select("id, lat, lng, title, species_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      // fallback til tomt map
      return <MapClient locale={locale} spots={[]} />;
    }

    return <MapClient locale={locale} spots={(spots ?? []) as any} />;
  } catch {
    return <MapClient locale={locale} spots={[]} />;
  }
}