// src/app/api/spots/counts-batch/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Row = { spot_id: string; total: number; qtr: number };

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = String(searchParams.get("spot_ids") ?? "").trim();
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Missing spot_ids" }, { status: 400 });
    }

   const spot_ids = raw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 200);


    if (!spot_ids.length) {
      return NextResponse.json({ ok: true, rows: [], map: {} });
    }

    const supabase = await supabaseServer();

    // kræver at din RPC forventer text[] med uuid-strings (spot_id)
    const { data, error } = await supabase.rpc("spot_counts_many", { p_spot_ids: spot_ids });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const rows = (Array.isArray(data) ? data : []) as any[];
    const normalized: Row[] = rows.map((r) => ({
      spot_id: String(r.spot_id),
      total: Number(r.total ?? 0),
      qtr: Number(r.qtr ?? 0),
    }));

    const map: Record<string, { total: number; qtr: number }> = {};
    for (const r of normalized) map[r.spot_id] = { total: r.total, qtr: r.qtr };

    return NextResponse.json({ ok: true, rows: normalized, map });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
