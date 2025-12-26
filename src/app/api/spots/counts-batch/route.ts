// src/app/api/spots/counts-batch/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Row = { spot_id: string; total: number; qtr: number };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = String(searchParams.get("spot_ids") ?? "").trim();
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Missing spot_ids" }, { status: 400 });
    }

    const spot_ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 200);

    const supabase = await supabaseServer();
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