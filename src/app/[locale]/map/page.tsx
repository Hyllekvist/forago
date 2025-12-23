import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapClient from "./MapClient"; 

export const dynamic = "force-dynamic";
export const revalidate = 300;

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
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const supabase = supabaseServer();

  // Tilpas felter til din tabel (jeg antager: spots)
  const { data: spots, error } = await supabase
    .from("spots")
    .select("id, lat, lng, title, species_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  return <MapClient locale={locale} spots={(spots ?? []) as any[]} />;
}