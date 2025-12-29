import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapClient from "./MapClient";
import type { Spot } from "./LeafletMap";
import { DUMMY_SPOTS } from "./_dummySpots";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export default async function MapPage({ params }: { params: { locale: string } }) {
  const locParam = params?.locale;
  if (!locParam || !isLocale(locParam)) return notFound();

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("spots_map")
    .select("id, lat, lng, title, species_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(800);

  const realSpots = (data ?? []) as Spot[];

  const isProd = process.env.NODE_ENV === "production";
  const spots =
    !error && realSpots.length > 0
      ? realSpots
      : isProd
        ? [] // ✅ prod: ingen dummy
        : DUMMY_SPOTS; // ✅ dev: ok at have dummy

  return <MapClient spots={spots} />;
}
