import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

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
  // grov prioritering: forest/wetland/heath/coast lidt højere end park
  const cat = osmCategory(tags);
  if (cat === "wetland" || cat === "heath" || cat === "forest") return 80;
  if (cat === "coast" || cat === "waterway" || cat === "meadow") return 65;
  if (cat === "park" || cat === "scrub") return 45;
  return 25;
}

function cleanName(tags: Record<string, any>, fallback: string) {
  const n = typeof tags.name === "string" ? tags.name.trim() : "";
  return n || fallback;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bbox = parseBbox(searchParams.get("bbox"));
    const zoom = Number(searchParams.get("zoom") ?? "0");

    if (!bbox) return NextResponse.json({ ok: false, error: "Missing/invalid bbox" }, { status: 400 });

    // beskyt overpass + jer selv: tillad kun seed ved zoom >= 12 og begræns bbox-størrelse
    if (!Number.isFinite(zoom) || zoom < 12) {
      return NextResponse.json({ ok: true, inserted: 0, reason: "zoom_too_low" });
    }

    const supabase = await supabaseServer();

    // OSM Overpass: kun natur/habitat
    const query = `
[out:json][timeout:25];
(
  nwr["natural"~"wood|heath|wetland|scrub|water|beach"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["landuse"~"forest|meadow"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["waterway"~"river|stream"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
  nwr["leisure"="park"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
);
out center tags qt;
`.trim();

    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const r = await fetch(overpassUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Overpass error: ${r.status}`, detail: txt.slice(0, 300) }, { status: 502 });
    }

    const json = await r.json();
    const elements: any[] = Array.isArray(json?.elements) ? json.elements : [];

    // map til places upsert rows
    const rows = elements
      .map((el) => {
        const lat = Number(el?.lat ?? el?.center?.lat);
        const lng = Number(el?.lon ?? el?.center?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const tags = (el?.tags ?? {}) as Record<string, any>;
        const category = osmCategory(tags);
        if (category === "unknown") return null;

        // noise-killer: skip hvis det ligner “amenity/shop/building”
        if (tags.amenity || tags.shop || tags.building) return null;

        const source_id = `${String(el?.type ?? "x")}/${String(el?.id ?? "")}`;
        if (!source_id.includes("/") || source_id.endsWith("/")) return null;

        const name = cleanName(tags, category === "forest" ? "Skov" : "Naturspot");

        // slug: deterministic ud fra source_id (så vi ikke laver duplicates)
        // (slug behøver ikke være “pænt” for seeded)
        const slug = `osm-${source_id.replace("/", "-")}`;

        return {
          slug,
          name,
          lat,
          lng,
          country: "dk",
          region: "",
          habitat: category, // bruger habitat feltet til samme taksonomi i MVP
          description: "",
          source: "seed_osm",
          source_id,
          category,
          is_seeded: true,
          seed_rank: seedRank(tags),
        };
      })
      .filter(Boolean) as any[];

    // cap for safety
    const capped = rows.slice(0, 250);

    if (!capped.length) return NextResponse.json({ ok: true, inserted: 0 });

    // upsert på (source, source_id) kræver din unique index fra migrationen
    const { data: up, error } = await supabase
      .from("places")
      .upsert(capped, { onConflict: "source,source_id" })
      .select("slug")
      .limit(250);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, inserted: up?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
