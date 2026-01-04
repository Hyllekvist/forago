// src/app/api/scan/refs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Kind = "mushroom" | "plant" | "tree" | "weed" | "all";

function normKind(x: string | null): Kind {
  const k = (x || "").toLowerCase();
  if (k === "mushroom" || k === "plant" || k === "tree" || k === "weed" || k === "all") return k;
  return "all";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = normKind(searchParams.get("kind"));

    const supabase = await supabaseServer();

    let q = supabase
      .from("species")
      .select("slug,name,latin,image_path,kind")
      .not("image_path", "is", null);

    if (kind !== "all") q = q.eq("kind", kind);

    const { data, error } = await q.order("slug", { ascending: true }).limit(500);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) {
      return NextResponse.json({ ok: false, error: "NO_SUPABASE_URL" }, { status: 500 });
    }

    const refs = (data ?? []).map((s) => ({
      slug: s.slug,
      name: s.name,
      latin: s.latin ?? undefined,
      image_url: `${base}/storage/v1/object/public/species/${s.image_path}`,
    }));

    return NextResponse.json({ ok: true, refs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "REFS_FAILED" }, { status: 500 });
  }
}
