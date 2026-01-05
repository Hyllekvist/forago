// src/app/api/places/seed/route.ts
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

  // safety: undgå kæmpe bbox (overpass kan dø)
  const maxSpan = 0.25; // ~27 km i lat
  if (Math.abs(n - s) > maxSpan || Math.abs(e - w) > maxSpan) return null;

  return { s, w, n, e };
}

function osmCategory(tags: Record<string, any>) {
  const natural = String(tags.natural ?? "");
  const landuse = String(tags.landuse ?? "");
  const waterway = String(tags.waterway ?? "");
  const leisure = String(tags.leisure ?? "");

  if (natural === "wood") return "forest";
  if (landuse === "forest") return "forest";
  if (landuse === "meadow") return "meadow";
  if (natural === "heath") return "heath";
  if (natural === "wetland") return "wetland";
  if (natural === "scrub") return "scrub";
  if (natural === "beach") return "coast";
  if (natural === "water") return "water";
  if (waterway === "river" || waterway === "stream") return "waterway";
  if (leisure === "park") return "park";
  return "unknown";
}

function seedRank(tags: Record<string, any>) {
  const cat = osmCategory(tags);
  if (cat === "wetland" || cat === "heath" || cat === "forest") return 80;
  if (cat === "coast" || cat === "waterway" || cat === "meadow") return 65;
  if (cat === "park" || cat === "scrub") return 45;
  return 25;
}

function pickName(tags: Record<string, any>) {
  const cand = [
    tags["name:da"],
    tags.name,
    tags["official_name"],
    tags["short_name"],
    tags["loc_name"],
  ];
  for (const v of cand) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
  }
  return "";
}

function gridKey(lat: number, lng: number, meters = 900) {
  // ~111_320m per grad lat. lon skaleres med cos(lat)
  const dLat = meters / 111_320;
  const dLng = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const a = Math.round(lat / dLat);
  const b = Math.round(lng / dLng);
  return `${a}:${b}`;
}

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
];

async function fetchOverpass(query: string) {
  const body = `data=${encodeURIComponent(query)}`;

  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body,
      });
      if (!r.ok) continue;

      try {
        return await r.json();
      } catch {
        continue;
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bbox = parseBbox(searchParams.get("bbox"));
    const zoom = Number(searchParams.get("zoom") ?? "0");

    if (!bbox) {
      return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });
    }

    // ✅ seed først ved zoom >= 13 (mindre aggressiv)
    if (!Number.isFinite(zoom) || zoom < 13) {
      return NextResponse.json({ ok: true, inserted: 0, reason: "zoom_too_low" });
    }

    const query = `
[out:json][timeout:20];
(
  nwr["natural"~"wood|heath|wetland|scrub|water|beach"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["landuse"~"forest|meadow"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["waterway"~"river|stream"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["leisure"="park"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
);
out center tags qt;
`.trim();

    const json = await fetchOverpass(query);
    if (!json) {
      return NextResponse.json({ ok: true, inserted: 0, reason: "overpass_all_down" });
    }

    const elements: any[] = Array.isArray(json?.elements) ? json.elements : [];
    if (!elements.length) {
      return NextResponse.json({ ok: true, inserted: 0, reason: "overpass_empty" });
    }

    const seenCells = new Set<string>();
    const seenSource = new Set<string>();
    const rows: any[] = [];

    for (const el of elements) {
      // drop nodes (støj)
      const t = String(el?.type ?? "");
      if (t === "node") continue;

      const lat = Number(el?.lat ?? el?.center?.lat);
      const lng = Number(el?.lon ?? el?.center?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const tags = (el?.tags ?? {}) as Record<string, any>;
      if (tags.amenity || tags.shop || tags.building) continue;

      const category = osmCategory(tags);
      if (category === "unknown") continue;

      // ✅ kræv “rigtigt” navn (drop fallback Skov/Naturspot)
      const name = pickName(tags);
      if (!name) continue;

      const source_id = `${String(el?.type ?? "x")}/${String(el?.id ?? "")}`;
      if (!source_id.includes("/") || source_id.endsWith("/")) continue;
      if (seenSource.has(source_id)) continue;
      seenSource.add(source_id);

      // spatial dedupe (stærkere)
      const cell = gridKey(lat, lng, 900);
      if (seenCells.has(cell)) continue;
      seenCells.add(cell);

      const slug = `osm-${source_id.replace("/", "-")}`;

      rows.push({
        slug,
        name,
        lat,
        lng,
        country: "dk",
        region: "",
        habitat: category,
        description: "",
        source: "seed_osm",
        source_id,
        category,
        is_seeded: true,
        seed_rank: seedRank(tags),
      });

      // ✅ lavere cap
      if (rows.length >= 60) break;
    }

    if (!rows.length) {
      return NextResponse.json({ ok: true, inserted: 0, reason: "no_candidates_after_filters" });
    }

    const supabase = await supabaseServer();

    const { data: up, error } = await supabase
      .from("places")
      .upsert(rows, { onConflict: "slug" })
      .select("slug")
      .limit(60);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: up?.length ?? 0, candidates: rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
