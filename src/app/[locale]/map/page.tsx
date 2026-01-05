// src/app/[locale]/map/page.tsx
import { notFound } from "next/navigation";
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

  // ✅ Vigtigt:
  // - Ingen Supabase-kald her (undgår 500 på document request)
  // - Client står for at hente spots via /api/spots/map + /api/places/seed

  const isProd = process.env.NODE_ENV === "production";

  const initialSpots: Spot[] = isProd ? [] : (DUMMY_SPOTS as Spot[]);

  return <MapClient spots={initialSpots} />;
}
