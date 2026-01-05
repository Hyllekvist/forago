// src/app/api/spots/map/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function parseBbox(raw: string | null) {
  // bbox = south,west,north,east
  if (!raw) return null;
  const parts = raw.split(",").map((x) => Number(x.trim()));
  if (parts.length !== 4) return null;

  const [s, w, n, e] = parts;
  if (![s, w, n, e].every(Number.isFinite)) return null;
  if (n <= s || e <= w) return null;

  // safety: undgå kæmpe bbox
  const maxSpan = 1.25; // ~140 km lat – ok til kort, men ikke “hele Europa”
  if (Math.abs(n - s) > maxSpan || Math.abs(e - w) > maxSpan) return null;

  return { s, w, n, e };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function limitForZoom(z: number) {
  if (z >= 13) return 20;
  if (z >= 12) return 40;
  if (z >= 11) return 80;
  if (z >= 10) return 140;
  return 220;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bbox = parseBbox(searchParams.get("bbox"));
  const zoom = Number(searchParams.get("zoom") ?? "0");

  if (!bbox) {
    return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
  }

  const requestedLimit = Number(searchParams.get("limit") ?? "0");
  const hardLimit = limitForZoom(Number.isFinite(zoom) ? zoom : 0);

  const limit = requestedLimit ? clamp(requestedLimit, 1, hardLimit) : hardLimit;

  try {
    const supabase = await supabaseServer();

    // ✅ VIGTIGT: Brug view'et der allerede filtrerer på total>0
    const { data, error } = await supabase
      .from("spots_map_with_finds")
      .select("id, lat, lng, title, species_slug, created_at, total, qtr")
      .gte("lat", bbox.s)
      .lte("lat", bbox.n)
      .gte("lng", bbox.w)
      .lte("lng", bbox.e)
      .order("qtr", { ascending: false })
      .order("total", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // fail-soft: UI skal ikke dø
      return NextResponse.json({
        ok: true,
        items: [],
        limit,
        reason: "db_error",
        db_error: error.message,
      });
    }

    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");

    // returnér kun det MapClient forventer (drop total/qtr)
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      title: r.title,
      species_slug: r.species_slug ?? null,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, items, limit }, { headers });
  } catch (e: any) {
    // fail-soft
    return NextResponse.json({
      ok: true,
      items: [],
      limit,
      reason: "exception",
      error: e?.message ?? "Unknown error",
    });
  }
}
