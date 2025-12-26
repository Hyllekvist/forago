import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const spotId = String(params?.spotId ?? "").trim();
    if (!spotId) {
      return NextResponse.json({ ok: false, error: "Missing spotId" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("spot_find_stats", { p_spot_id: spotId });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) && data.length ? data[0] : null;

    return NextResponse.json({
      ok: true,
      stats: row ?? { spot_id: spotId, total_count: 0, last_14d_count: 0, last_30d_count: 0 },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}