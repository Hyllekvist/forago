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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const bbox = parseBbox(searchParams.get("bbox"));
    const zoom = Number(searchParams.get("zoom") ?? "0");

    if (!bbox) {
      return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
    }

    // Hard rule: ingen spots før man zoomer ind
    if (!Number.isFinite(zoom) || zoom < 12) {
      return NextResponse.json({ ok: true, items: [], reason: "zoom_in" });
    }

    // limit policy
    const limitPolicy = zoom >= 13 ? 20 : 10;
    const limit = clamp(Number(searchParams.get("limit") ?? String(limitPolicy)), 1, limitPolicy);

    const supabase = await supabaseServer();

    /**
     * Vi joiner til places for at få:
     * - is_seeded (hvis du har den kolonne)
     * - habitat (hvis du har den)
     * - source (hvis du har den)
     *
     * Og vi joiner til finds (FK findes ikke) via spot_id = places.slug
     * ved at lave en "head count" kan vi ikke pr række.
     * Derfor laver vi 2-step:
     *  1) hent kandidater i bbox (capped)
     *  2) hent counts for de kandidater via din eksisterende RPC spot_counts_many
     *  3) rank og return top 10/20
     */

    // 1) Kandidater i bbox (capped for performance)
    const CANDIDATE_CAP = 600;

    const { data: candidates, error: candErr } = await supabase
      .from("spots_map")
      .select("id, lat, lng, title, species_slug, created_at")
      .gte("lat", bbox.s)
      .lte("lat", bbox.n)
      .gte("lng", bbox.w)
      .lte("lng", bbox.e)
      .limit(CANDIDATE_CAP);

    if (candErr) {
      return NextResponse.json({ ok: false, error: candErr.message }, { status: 500 });
    }

    const items = (candidates ?? []).map((x) => ({
      id: String(x.id),
      lat: Number(x.lat),
      lng: Number(x.lng),
      title: x.title ?? null,
      species_slug: x.species_slug ?? null,
      created_at: x.created_at ?? null,
    }));

    if (!items.length) return NextResponse.json({ ok: true, items: [] });

    // 2) Counts via eksisterende RPC (spot_counts_many forventer uuid-strings? -> du har ændret til slug strings)
    // Din counts-batch route bruger: supabase.rpc("spot_counts_many", { p_spot_ids: spot_ids })
    // Så her kalder vi RPC direkte.
    const ids = items.map((x) => x.id).slice(0, 200); // sikkerhed

    let countsMap: Record<string, { total: number; qtr: number }> = {};
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("spot_counts_many", {
        p_spot_ids: ids,
      });
      if (!rpcErr && Array.isArray(rpcData)) {
        for (const r of rpcData as any[]) {
          const sid = String(r.spot_id);
          countsMap[sid] = {
            total: Number(r.total ?? 0),
            qtr: Number(r.qtr ?? 0),
          };
        }
      }
    } catch {
      // fail-soft: counts bliver bare 0
    }

    // 3) Rank: fund > qtr > fallback
    // (du kan senere tilføje habitat / seed_rank)
    const ranked = items
      .map((s) => {
        const c = countsMap[s.id] ?? { total: 0, qtr: 0 };
        const score = c.total * 1.0 + c.qtr * 2.5;
        return { ...s, _score: score, _total: c.total, _qtr: c.qtr };
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        // hvis samme score: nyeste først
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return bt - at;
      })
      .slice(0, limit)
      .map(({ _score, _total, _qtr, ...rest }) => rest);

    return NextResponse.json({ ok: true, items: ranked, limit, zoom });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
