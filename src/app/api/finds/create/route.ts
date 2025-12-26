// src/app/api/finds/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
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

function asIsoDateOrNow(v: unknown) {
  // Hvis din DB kolonne er DATE, er YYYY-MM-DD bedst.
  // Hvis den er TIMESTAMP, accepterer den også YYYY-MM-DD fint.
  const s = asText(v);
  if (!s) return new Date().toISOString().slice(0, 10);
  const t = Date.parse(s);
  if (Number.isNaN(t)) return new Date().toISOString().slice(0, 10);
  return new Date(t).toISOString().slice(0, 10);
}

function normalizeVisibility(
  v: unknown
): "private" | "friends" | "public_aggregate" {
  return v === "friends" || v === "public_aggregate" ? v : "private";
}

function normalizeGeoPrecision(v: unknown): 1 | 2 | 5 | 10 {
  return v === 2 || v === 5 || v === 10 ? v : 1;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

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
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id ?? null;

    // resolve species_id
    let species_id: string | null = species_id_in || null;

    if (!species_id) {
      const { data: sp, error: spErr } = await supabase
        .from("species")
        .select("id")
        .eq("slug", species_slug_in)
        .maybeSingle();

      if (spErr) {
        return NextResponse.json({ ok: false, error: spErr.message }, { status: 500 });
      }

      if (!sp?.id) {
        return NextResponse.json(
          { ok: false, error: `Unknown species_slug: ${species_slug_in}` },
          { status: 400 }
        );
      }

      species_id = sp.id;
    }

    const observed_at = asIsoDateOrNow(body?.observed_at);
    const notes = typeof body?.notes === "string" ? body.notes : null;

    const visibility = normalizeVisibility(body?.visibility);
    const country = typeof body?.country === "string" ? body.country : "DK";
    const geo_precision_km = normalizeGeoPrecision(body?.geo_precision_km);

    // 🔥 ALDRIG NULL — DB kræver NOT NULL
    const photo_urls = Array.isArray(body?.photo_urls) ? body.photo_urls : [];

    const { data, error } = await supabase
      .from("finds")
      .insert({
        user_id,
        species_id,
        observed_at,
        notes,
        visibility,
        country,
        geo_precision_km,
        photo_urls,
      })
      .select("id, user_id, species_id, observed_at, created_at, photo_urls")
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