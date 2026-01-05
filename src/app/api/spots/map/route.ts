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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bbox = parseBbox(searchParams.get("bbox"));
    const limit = Math.max(1, Math.min(Number(searchParams.get("limit") ?? "800"), 1200));

    if (!bbox) {
      return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
    }

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

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
