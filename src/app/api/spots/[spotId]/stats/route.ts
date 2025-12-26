import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { spotId: string } }
) {
  const supabase = await supabaseServer();
  const spotId = params.spotId;

  // total
  const { count: totalCount, error: totalErr } = await supabase
    .from("finds")
    .select("*", { count: "exact", head: true })
    .eq("spot_id", spotId);

  if (totalErr) {
    return NextResponse.json({ ok: false, error: totalErr.message }, { status: 500 });
  }

  // sidste 30 dage
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { count: recentCount, error: recentErr } = await supabase
    .from("finds")
    .select("*", { count: "exact", head: true })
    .eq("spot_id", spotId)
    .gte("created_at", since.toISOString());

  if (recentErr) {
    return NextResponse.json({ ok: false, error: recentErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    stats: {
      spot_id: spotId,
      total_count: totalCount ?? 0,
      last_30d_count: recentCount ?? 0,
    },
  });
}