// src/app/api/finds/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const species_id = String(body?.species_id ?? "");
    if (!species_id) {
      return NextResponse.json({ ok: false, error: "Missing species_id" }, { status: 400 });
    }

    const notes = typeof body?.notes === "string" ? body.notes : null;
    const observed_at =
      typeof body?.observed_at === "string" ? body.observed_at : new Date().toISOString();

    const country = typeof body?.country === "string" ? body.country : "DK";
    const geo_cell = typeof body?.geo_cell === "string" ? body.geo_cell : null;
    const geo_precision_km =
      typeof body?.geo_precision_km === "number" ? body.geo_precision_km : 1;

    const visibility =
      body?.visibility === "public" || body?.visibility === "private" ? body.visibility : "private";

    const supabase = await supabaseServer();

    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id ?? null;

    const { data, error } = await supabase
      .from("finds")
      .insert({
        user_id,
        species_id,
        observed_at,
        notes,
        country,
        geo_cell,
        geo_precision_km,
        visibility,
        quality_score: 1, // default MVP
        photo_urls: [],
      })
      .select("id, user_id, species_id, observed_at, visibility, created_at")
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