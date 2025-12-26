import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spot_id = String(searchParams.get("spot_id") ?? "").trim();
    if (!spot_id) {
      return NextResponse.json({ ok: false, error: "Missing spot_id" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("spot_counts", { p_spot_id: spot_id });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // rpc returnerer typisk en række
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, total: row?.total ?? 0, qtr: row?.qtr ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}