// src/app/api/spots/counts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// qtr = "recent" (default: current quarter). Skift nemt til last_30d hvis du vil.

function quarterStartISO(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3); // 0..3
  const startMonth = q * 3; // 0,3,6,9
  const start = new Date(d.getFullYear(), startMonth, 1);
  return start.toISOString();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spot_id = String(searchParams.get("spot_id") ?? "").trim();
    if (!spot_id) {
      return NextResponse.json({ ok: false, error: "Missing spot_id" }, { status: 400 });
    }

    const fresh = searchParams.get("fresh") === "1";
    const supabase = await supabaseServer();

    // Total public_aggregate for spot
    const totalQ = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", spot_id)
      .eq("visibility", "public_aggregate");

    if (totalQ.error) {
      return NextResponse.json({ ok: false, error: totalQ.error.message }, { status: 500 });
    }

    // "qtr" public_aggregate for spot (current quarter)
    const qtrFrom = quarterStartISO();
    const qtrQ = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", spot_id)
      .eq("visibility", "public_aggregate")
      .gte("created_at", qtrFrom);

    if (qtrQ.error) {
      return NextResponse.json({ ok: false, error: qtrQ.error.message }, { status: 500 });
    }

    const res = {
      ok: true,
      total: Number(totalQ.count ?? 0),
      qtr: Number(qtrQ.count ?? 0),
    };

    // cache hint (du kan ignorere – men den gør ingen skade)
    const headers = new Headers();
    headers.set("Cache-Control", fresh ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300");

    return NextResponse.json(res, { headers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}