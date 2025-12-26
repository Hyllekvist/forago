import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { spotId: string } }
) {
  try {
    const spotId = (params?.spotId ?? "").trim();
    if (!spotId) {
      return NextResponse.json({ ok: false, error: "Missing spotId" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase.rpc("spot_counts", { p_spot_id: spotId });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : null;
    return NextResponse.json({ ok: true, counts: row ?? { total: 0, qtr: 0 } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}