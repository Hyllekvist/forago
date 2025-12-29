// src/app/api/places/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  lat?: number;
  lng?: number;
  name?: string | null;
  country?: string | null;  // default dk
  region?: string | null;   // default ""
  habitat?: string | null;  // default unknown
  description?: string | null; // default ""
  species_slug?: string | null; // optional (for place_species)
  confidence?: number | null;   // optional (default 60)
  note?: string | null;         // optional
};

function asNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function makeSlug() {
  // unique constraint på places.slug → vi bruger uuid-baseret slug
  // (slug er appens offentlige spotId)
  const u = crypto.randomUUID(); // node runtime
  return `p-${u}`;
}

function isValidSlug(s: string) {
  // stop “d6”/garbage
  if (!s) return false;
  if (s.length < 10) return false;
  return /^[a-z0-9-]+$/i.test(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const lat = asNum(body?.lat);
    const lng = asNum(body?.lng);
    if (lat === null || lng === null) {
      return NextResponse.json({ ok: false, error: "Missing lat/lng" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const name = asText(body?.name) || "Nyt spot";
    const country = (asText(body?.country) || "dk").toLowerCase();
    const region = asText(body?.region) || "";
    const habitat = (asText(body?.habitat) || "unknown").toLowerCase();
    const description = asText(body?.description) || "";

    // generate slug (retry få gange hvis ekstrem kollision)
    let slug = makeSlug();
    for (let i = 0; i < 3; i++) {
      if (isValidSlug(slug)) break;
      slug = makeSlug();
    }
    if (!isValidSlug(slug)) {
      return NextResponse.json({ ok: false, error: "Failed to generate slug" }, { status: 500 });
    }

    const { data: place, error: insErr } = await supabase
      .from("places")
      .insert({
        slug,
        name,
        country,
        region,
        habitat,
        lat,
        lng,
        description,
      })
      .select("id, slug, name, lat, lng, created_at")
      .single();

    if (insErr || !place?.id) {
      return NextResponse.json(
        { ok: false, error: insErr?.message ?? "Failed to create place" },
        { status: 500 }
      );
    }

    // optional: attach species guess
    const speciesSlug = asText(body?.species_slug).toLowerCase();
    if (speciesSlug) {
      const { data: sp, error: spErr } = await supabase
        .from("species")
        .select("id, slug")
        .eq("slug", speciesSlug)
        .maybeSingle();

      if (!spErr && sp?.id) {
        const confidence =
          typeof body?.confidence === "number" && Number.isFinite(body.confidence)
            ? Math.max(0, Math.min(100, Math.round(body.confidence)))
            : 60;

        const note = asText(body?.note) || "";

        // no unique constraint info her → bare insert
        await supabase.from("place_species").insert({
          place_id: place.id,
          species_id: sp.id,
          confidence,
          note,
        });
      }
    }

    return NextResponse.json({ ok: true, place });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
