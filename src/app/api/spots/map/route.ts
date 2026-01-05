// src/app/api/spots/map/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Bbox = { s: number; w: number; n: number; e: number };
type ParseBboxResult = Bbox | "too_big" | null;

function parseBbox(raw: string | null): ParseBboxResult {
  if (!raw) return null;

  const parts = raw.split(",").map((x) => Number(x.trim()));
  if (parts.length !== 4) return null;

  const [s, w, n, e] = parts;
  if (![s, w, n, e].every(Number.isFinite)) return null;
  if (n <= s || e <= w) return null;

  // ✅ fail-soft på gigantiske bbox (fx zoom 6 / Danmark)
  // 12 grader er “rigtigt stort” men stadig safe.
  const maxSpan = 12;
  if (Math.abs(n - s) > maxSpan || Math.abs(e - w) > maxSpan) return "too_big";

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

  const bboxParsed = parseBbox(searchParams.get("bbox"));
  const zoom = Number(searchParams.get("zoom") ?? "0");

  // ✅ hvis bbox er alt for stor → returnér tomt (ingen 400)
  if (bboxParsed === "too_big") {
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    return NextResponse.json({ ok: true, items: [], limit: 0, reason: "bbox_too_big" }, { headers });
  }

  // ✅ invalid bbox → stadig 400 (reelt client-bug)
  if (!bboxParsed) {
    return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
  }

  const bbox = bboxParsed;

  const requestedLimit = Number(searchParams.get("limit") ?? "0");
  const hardLimit = limitForZoom(Number.isFinite(zoom) ? zoom : 0);
  const limit = requestedLimit ? clamp(requestedLimit, 1, hardLimit) : hardLimit;

  try {
    const supabase = await supabaseServer();

    // ✅ Brug view'et der allerede filtrerer på total>0
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

    // ✅ fail-soft: UI skal ikke dø
    if (error) {
      const headers = new Headers();
      headers.set("Cache-Control", "no-store");
      return NextResponse.json(
        { ok: true, items: [], limit, reason: "db_error", db_error: error.message },
        { headers }
      );
    }

    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");

    // returnér kun det MapClient forventer
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      lat: Number(r.lat),
      lng: Number(r.lng),
      title: String(r.title ?? ""),
      species_slug: r.species_slug ?? null,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, items, limit }, { headers });
  } catch (e: any) {
    // ✅ fail-soft
    const headers = new Headers();
    headers.set("Cache-Control", "no-store");
    return NextResponse.json(
      { ok: true, items: [], limit, reason: "exception", error: e?.message ?? "Unknown error" },
      { headers }
    );
  }
}
