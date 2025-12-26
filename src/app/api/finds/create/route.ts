// src/app/api/finds/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  species_id?: string | null;
  species_slug?: string | null;
  observed_at?: string | null;
  notes?: string | null;
  visibility?: "private" | "public" | string | null;
  country?: string | null;
  geo_cell?: string | null;
  geo_precision_km?: number | null;
  photo_urls?: string[] | null;
  quality_score?: number | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const supabase = await supabaseServer();

    // auth (optional)
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id ?? null;

    // 1) Resolve species_id (from species_id OR species_slug)
    let species_id = (body?.species_id ?? null)?.toString().trim() || null;

    const species_slug =
      (body?.species_slug ?? null)?.toString().trim().toLowerCase() || null;

    if (!species_id && species_slug) {
      // 🔧 HER: hvis din tabel/kolonne ikke hedder species/slug, ret her
      const { data: sp, error: spErr } = await supabase
        .from("species")
        .select("id")
        .eq("slug", species_slug)
        .maybeSingle();

      if (spErr) {
        return NextResponse.json(
          { ok: false, error: spErr.message },
          { status: 500 }
        );
      }
      species_id = sp?.id ?? null;
    }

    if (!species_id) {
      return NextResponse.json(
        { ok: false, error: "Missing species_id" },
        { status: 400 }
      );
    }

    // 2) Optional fields
    const notes = typeof body?.notes === "string" ? body.notes : null;
    const observed_at =
      typeof body?.observed_at === "string" && body.observed_at
        ? body.observed_at
        : new Date().toISOString();

    const visibility =
      typeof body?.visibility === "string" && body.visibility
        ? body.visibility
        : "private";

    const country = typeof body?.country === "string" ? body.country : null;
    const geo_cell = typeof body?.geo_cell === "string" ? body.geo_cell : null;

    const geo_precision_km =
      typeof body?.geo_precision_km === "number" ? body.geo_precision_km : null;

    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : null;

    const quality_score =
      typeof body?.quality_score === "number" ? body.quality_score : null;

    // 3) Insert
    const { data, error } = await supabase
      .from("finds")
      .insert({
        user_id,
        species_id,
        observed_at,
        notes,
        visibility,
        country,
        geo_cell,
        geo_precision_km,
        photo_urls,
        quality_score,
      })
      .select("id, species_id, observed_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, find: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}