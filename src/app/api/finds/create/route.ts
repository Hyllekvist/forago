import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const spot_id = String(body?.spot_id ?? "");
    if (!spot_id) {
      return NextResponse.json({ ok: false, error: "Missing spot_id" }, { status: 400 });
    }

    // optional fields
    const notes = typeof body?.notes === "string" ? body.notes : null;
    const observed_at = typeof body?.observed_at === "string" ? body.observed_at : null;

    const supabase = await supabaseServer();

    // Hvis du bruger supabase auth: hent user_id (ellers lad den være null)
    const { data: auth } = await supabase.auth.getUser();
    const user_id = auth?.user?.id ?? null;

    const { data, error } = await supabase
      .from("finds")
      .insert({
        spot_id,
        user_id,
        notes,
        observed_at,
        visibility: "private", // justér hvis du har enum/constraints
      })
      .select("id, spot_id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, find: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}