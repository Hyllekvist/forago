// src/app/api/finds/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  spot_id?: string | null;    // ✅ slug (foretrukket)
  spot_uuid?: string | null;  // hvis nogen stadig sender uuid
  species_id?: string | null;
  species_slug?: string | null;
  observed_at?: string | null;
  notes?: string | null;
  visibility?: "private" | "friends" | "public_aggregate" | string | null;
  country?: string | null;
  geo_precision_km?: number | null;
  photo_urls?: string[] | null;
};

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function isValidPlaceSlug(s: string) {
  // stop “d6”/garbage, men allow jeres p-uuid style
  if (!s) return false;
  if (s.length < 10) return false;
  return /^[a-z0-9-]+$/i.test(s);
}

function asIsoDateOrNow(v: unknown) {
  // finds.observed_at er DATE → YYYY-MM-DD
  const s = asText(v);
  if (!s) return new Date().toISOString().slice(0, 10);
  const t = Date.parse(s);
  if (Number.isNaN(t)) return new Date().toISOString().slice(0, 10);
  return new Date(t).toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const spotRaw = asText(body?.spot_id) || asText(body?.spot_uuid);
    if (!spotRaw) {
      return NextResponse.json({ ok: false, error: "Missing spot_id" }, { status: 400 });
    }

    const species_id_in = asText(body?.species_id);
    const species_slug_in = asText(body?.species_slug).toLowerCase();

    if (!species_id_in && !species_slug_in) {
      return NextResponse.json(
        { ok: false, error: "Missing species_id or species_slug" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();

    // auth user
    const { data: auth, error: authErr } = await supabase
      .auth
      .getUser();

    if (authErr) {
      return NextResponse.json({ ok: false, error: authErr.message }, { status: 401 });
    }
    const user_id = auth?.user?.id ?? null;
    if (!user_id) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // ✅ Resolve place
    // UI bruger slug (spots_map.id = places.slug)
    let place_id: string | null = null;
    let place_slug: string | null = null;

    if (isUuid(spotRaw)) {
      const { data: p, error: pErr } = await supabase
        .from("places")
        .select("id, slug")
        .eq("id", spotRaw)
        .maybeSingle();

      if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
      if (!p?.id || !p?.slug) {
        return NextResponse.json({ ok: false, error: "Unknown spot_id (place not found)" }, { status: 400 });
      }
      place_id = p.id;
      place_slug = p.slug;
    } else {
      if (!isValidPlaceSlug(spotRaw)) {
        return NextResponse.json({ ok: false, error: "spot_id must be a valid place slug" }, { status: 400 });
      }

      const { data: p, error: pErr } = await supabase
        .from("places")
        .select("id, slug")
        .eq("slug", spotRaw)
        .maybeSingle();

      if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
      if (!p?.id || !p?.slug) {
        return NextResponse.json({ ok: false, error: "Unknown spot_id (place not found)" }, { status: 400 });
      }
      place_id = p.id;
      place_slug = p.slug;
    }

    // resolve species_id
    let species_id = species_id_in || null;

    if (!species_id) {
      const { data: sp, error: spErr } = await supabase
        .from("species")
        .select("id, slug")
        .eq("slug", species_slug_in)
        .maybeSingle();

      if (spErr) return NextResponse.json({ ok: false, error: spErr.message }, { status: 500 });
      if (!sp?.id) {
        return NextResponse.json({ ok: false, error: `Unknown species_slug: ${species_slug_in}` }, { status: 400 });
      }
      species_id = sp.id;
    }

    // normalize optional fields
    const observed_at = asIsoDateOrNow(body?.observed_at);
    const notes = typeof body?.notes === "string" ? body.notes : null;

    const visibility =
      body?.visibility === "private" ||
      body?.visibility === "friends" ||
      body?.visibility === "public_aggregate"
        ? body.visibility
        : "private";

    const country = typeof body?.country === "string" ? body.country : "DK";

    const geo_precision_km =
      body?.geo_precision_km === 1 ||
      body?.geo_precision_km === 2 ||
      body?.geo_precision_km === 5 ||
      body?.geo_precision_km === 10
        ? body.geo_precision_km
        : 1;

    // photo_urls er NOT NULL → default []
    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : [];

    // ✅ insert: finds.spot_id = place slug (match spots_map.id + counts + spot page)
    const { data, error } = await supabase
      .from("finds")
      .insert({
        user_id,
        spot_id: place_slug,
        species_id,
        observed_at,
        notes,
        visibility,
        country,
        geo_precision_km,
        photo_urls,
      })
      .select("id, user_id, spot_id, species_id, observed_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // ✅ optional: hvis stedet ikke har en “best” species endnu, så giv det en (low risk MVP)
    if (place_id && species_id) {
  const { data: existing, error: exErr } = await supabase
    .from("place_species")
    .select("place_id, species_id")
    .eq("place_id", place_id)
    .eq("species_id", species_id)
    .maybeSingle();

  if (!exErr && !existing) {
    await supabase.from("place_species").insert({
      place_id,
      species_id,
      confidence: 60,
      note: "",
    });
  }
}


    return NextResponse.json({ ok: true, find: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
