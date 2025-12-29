// src/app/api/spots/counts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function quarterStartISO(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3);
  const startMonth = q * 3;
  const start = new Date(d.getFullYear(), startMonth, 1);
  return start.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spot_id = String(searchParams.get("spot_id") ?? "").trim();
    if (!spot_id) {
      return NextResponse.json({ ok: false, error: "Missing spot_id" }, { status: 400 });
    }
    if (!isUuid(spot_id)) {
      return NextResponse.json(
        { ok: false, error: "spot_id must be UUID (places.id)" },
        { status: 400 }
      );
    }

    const fresh = searchParams.get("fresh") === "1";
    const supabase = await supabaseServer();

    const baseCount = () =>
      supabase
        .from("finds")
        .select("id", { count: "exact", head: true })
        .eq("spot_id", spot_id)
        .eq("country", "DK")
        .eq("visibility", "public_aggregate");

    const totalQ = await baseCount();
    if (totalQ.error) {
      return NextResponse.json({ ok: false, error: totalQ.error.message }, { status: 500 });
    }

    const qtrFrom = quarterStartISO();
    const qtrQ = await baseCount().gte("created_at", qtrFrom);
    if (qtrQ.error) {
      return NextResponse.json({ ok: false, error: qtrQ.error.message }, { status: 500 });
    }

    const last30From = daysAgoISO(30);
    const last30Q = await baseCount().gte("created_at", last30From);
    if (last30Q.error) {
      return NextResponse.json({ ok: false, error: last30Q.error.message }, { status: 500 });
    }

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
