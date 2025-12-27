import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function quarterStartISO(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3); // 0..3
  const startMonth = q * 3; // 0,3,6,9
  const start = new Date(d.getFullYear(), startMonth, 1);
  return start.toISOString();
}

function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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

    // Base filter (keep consistent everywhere)
    const base = supabase
      .from("finds")
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate");

    // Total count
    const totalQ = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate");

    if (totalQ.error) {
      return NextResponse.json({ ok: false, error: totalQ.error.message }, { status: 500 });
    }

    // qtr count (current quarter)
    const qtrFrom = quarterStartISO();
    const qtrQ = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate")
      .gte("created_at", qtrFrom);

    if (qtrQ.error) {
      return NextResponse.json({ ok: false, error: qtrQ.error.message }, { status: 500 });
    }

    // last30 count
    const last30From = daysAgoISO(30);
    const last30Q = await supabase
      .from("finds")
      .select("id", { count: "exact", head: true })
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate")
      .gte("created_at", last30From);

    if (last30Q.error) {
      return NextResponse.json({ ok: false, error: last30Q.error.message }, { status: 500 });
    }

    // first_seen
    const firstQ = await supabase
      .from("finds")
      .select("created_at")
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate")
      .order("created_at", { ascending: true })
      .limit(1);

    if (firstQ.error) {
      return NextResponse.json({ ok: false, error: firstQ.error.message }, { status: 500 });
    }

    // last_seen
    const lastQ = await supabase
      .from("finds")
      .select("created_at")
      .eq("spot_id", spot_id)
      .eq("country", "DK")
      .eq("visibility", "public_aggregate")
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastQ.error) {
      return NextResponse.json({ ok: false, error: lastQ.error.message }, { status: 500 });
    }

    const res = {
      ok: true,
      total: Number(totalQ.count ?? 0),
      qtr: Number(qtrQ.count ?? 0),
      last30: Number(last30Q.count ?? 0),
      first_seen: firstQ.data?.[0]?.created_at ?? null,
      last_seen: lastQ.data?.[0]?.created_at ?? null,
    };

    const headers = new Headers();
    headers.set(
      "Cache-Control",
      fresh ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300"
    );

    return NextResponse.json(res, { headers });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}