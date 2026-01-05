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
  // ✅ din regel: “maks 20 når brugeren zoomer ind”
  if (z >= 13) return 20;
  if (z >= 12) return 40;
  if (z >= 11) return 80;
  if (z >= 10) return 140;
  return 220; // zoomet langt ud → stadig capped
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

    // hvis client sender limit, så cap vi den stadig hårdt
    const limit = requestedLimit
      ? clamp(requestedLimit, 1, hardLimit)
      : hardLimit;

    const supabase = await supabaseServer();

    const { data, error } = await supabase
      .from("spots_map")
      .select("id, lat, lng, title, species_slug, created_at")
      .gte("lat", bbox.s)
      .lte("lat", bbox.n)
      .gte("lng", bbox.w)
      .lte("lng", bbox.e)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // cache kort (det er bbox/zoom afhængigt)
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=20, stale-while-revalidate=120");

    return NextResponse.json({ ok: true, items: data ?? [], limit }, { headers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
