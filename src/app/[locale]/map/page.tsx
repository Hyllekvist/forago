// src/app/[locale]/map/page.tsx
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

  try {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("spots_map") // ✅ VIEW
      .select("id, lat, lng, title, species_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return <MapClient spots={DUMMY_SPOTS} />;
    }

    const realSpots = (Array.isArray(data) ? data : []).map((r: any) => ({
      id: String(r.id), // uuid-string
      lat: Number(r.lat),
      lng: Number(r.lng),
      title: r.title ?? null,
      species_slug: r.species_slug ?? null,
    })) as Spot[];

    const spots = realSpots.length > 0 ? realSpots : DUMMY_SPOTS;
    return <MapClient spots={spots} />;
  } catch {
    return <MapClient spots={DUMMY_SPOTS} />;
  }
}
