import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? "5000");
  const country = (searchParams.get("country") ?? "dk").trim();
  const region = (searchParams.get("region") ?? "").trim();
  const species = (searchParams.get("species") ?? "").trim() || null;
  const limit = Number(searchParams.get("limit") ?? "30");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Missing/invalid lat/lng" }, { status: 400 });
  }

const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("places_nearby", {
    in_lat: lat,
    in_lng: lng,
    in_radius_m: Math.max(200, Math.min(radius, 50000)),
    in_country: country,
    in_region: region,
    in_species_slug: species,
    in_limit: Math.max(1, Math.min(limit, 100)),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}