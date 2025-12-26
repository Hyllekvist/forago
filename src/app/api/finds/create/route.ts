// src/app/api/finds/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  species_id?: string;
  observed_at?: string; // ISO
  notes?: string;
  photo_urls?: string[]; // valgfrit
  visibility?: "private" | "public";
  quality_score?: number; // valgfrit
  country?: string; // valgfrit
  geo_cell?: string; // valgfrit
  geo_precision_km?: number; // valgfrit
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const species_id = String(body?.species_id ?? "");
    if (!species_id) {
      return NextResponse.json(
        { ok: false, error: "Missing species_id" },
        { status: 400 }
      );
    }

    const notes = typeof body?.notes === "string" ? body.notes : null;

    // observed_at: brug nu hvis ikke sendt
    const observed_at =
      typeof body?.observed_at === "string" && body.observed_at
        ? body.observed_at
        : new Date().toISOString();

    const visibility: "private" | "public" =
      body?.visibility === "public" ? "public" : "private";

    const quality_score =
      typeof body?.quality_score === "number" ? body.quality_score : null;

    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : null;

    const country = typeof body?.country === "string" ? body.country : null;
    const geo_cell = typeof body?.geo_cell === "string" ? body.geo_cell : null;
    const geo_precision_km =
      typeof body?.geo_precision_km === "number" ? body.geo_precision_km : null;

    const supabase = await supabaseServer();

    // Auth user (kan være null hvis ikke logget ind)
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id ?? null;

    const { data, error } = await supabase
      .from("finds")
      .insert({
        user_id,
        species_id,
        observed_at,
        notes,
        photo_urls,
        visibility,
        quality_score,
        country,
        geo_cell,
        geo_precision_km,
      })
      .select("id, species_id, observed_at, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, find: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}