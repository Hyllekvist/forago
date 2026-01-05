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
  try {
    const { searchParams } = new URL(req.url);
    const bbox = parseBbox(searchParams.get("bbox"));
    const zoom = Number(searchParams.get("zoom") ?? "0");

    if (!bbox) {
      return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
    }

    const requestedLimit = Number(searchParams.get("limit") ?? "0");
    const hardLimit = limitForZoom(Number.isFinite(zoom) ? zoom : 0);

    const limit = requestedLimit ? clamp(requestedLimit, 1, hardLimit) : hardLimit;

    const supabase = await supabaseServer();

    /**
     * ✅ Vigtig: vi filtrerer seedede “places” fra, medmindre de har signal.
     * Forventer at spots_map view indeholder:
     * - is_seeded (bool)
     * - qtr (int) eller total (int) (counts)
     *
     * Hvis dit view ikke har qtr/total endnu: se note nederst.
     */
    const { data, error } = await supabase
      .from("spots_map")
      .select("id, lat, lng, title, species_slug, created_at, is_seeded, qtr, total")
      .gte("lat", bbox.s)
      .lte("lat", bbox.n)
      .gte("lng", bbox.w)
      .lte("lng", bbox.e)
      // ✅ kun vis seeded hvis den har signal
      .or("is_seeded.eq.false,qtr.gt.0,total.gt.0")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=20, stale-while-revalidate=120");

    // vi returnerer stadig kun de felter MapClient forventer
    const items =
      (data ?? []).map((r: any) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        title: r.title,
        species_slug: r.species_slug ?? null,
        created_at: r.created_at ?? null,
      })) ?? [];

    return NextResponse.json({ ok: true, items, limit }, { headers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
