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

function mapPlaceToSpot(p: any): Spot {
  return {
    id: String(p.slug),
    lat: Number(p.lat),
    lng: Number(p.lng),
    title: (p.name ?? null) as string | null,
    // MVP: vi binder ikke species her; det kommer fra finds/aggregates senere
    species_slug: null,
    last_seen_at: null,
  };
}

function mapSpotsMapToSpot(r: any): Spot {
  return {
    id: String(r.id),
    lat: Number(r.lat),
    lng: Number(r.lng),
    title: (r.title ?? null) as string | null,
    species_slug: (r.species_slug ?? null) as string | null,
    last_seen_at: null,
  };
}

export default async function MapPage({ params }: { params: { locale: string } }) {
  const locParam = params?.locale;
  if (!locParam || !isLocale(locParam)) return notFound();

  const supabase = await supabaseServer();

  // 1) Primary source: places (user + seeded)
  const { data: placesData, error: placesErr } = await supabase
    .from("places")
    .select("slug, name, lat, lng, created_at, source, is_seeded, seed_rank")
    .in("source", ["user", "seed_osm"])
    // user først, seeded bagefter
    .order("is_seeded", { ascending: true })
    // seeded: høj relevans først
    .order("seed_rank", { ascending: false })
    // generelt: nyeste først
    .order("created_at", { ascending: false })
    .limit(800);

  const placesSpots: Spot[] = !placesErr && Array.isArray(placesData) ? placesData.map(mapPlaceToSpot) : [];

  // 2) Fallback: spots_map (legacy/dummy seeded liste) hvis places endnu er tom
  let fallbackSpotsMap: Spot[] = [];
  if (placesSpots.length === 0) {
    const { data: smData, error: smErr } = await supabase
      .from("spots_map")
      .select("id, lat, lng, title, species_slug, created_at")
      .order("created_at", { ascending: false })
      .limit(800);

    fallbackSpotsMap = !smErr && Array.isArray(smData) ? smData.map(mapSpotsMapToSpot) : [];
  }

  const realSpots = placesSpots.length ? placesSpots : fallbackSpotsMap;

  // 3) Dummy policy (samme som før)
  const isProd = process.env.NODE_ENV === "production";
  const spots =
    realSpots.length > 0
      ? realSpots
      : isProd
        ? []
        : DUMMY_SPOTS;

  return <MapClient spots={spots} />;
}
