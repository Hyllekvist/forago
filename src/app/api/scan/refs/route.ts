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

    // ✅ supabaseServer() er async i dit setup → await
    const supabase = await supabaseServer();

    // Forventet: slug, name (evt name_da), latin, image_path, kind
    let q = supabase
      .from("species")
      .select("slug,name,latin,image_path,kind")
      .not("image_path", "is", null);

    if (kind !== "all") q = q.eq("kind", kind);

    const { data, error } = await q.order("slug", { ascending: true }).limit(5000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, refs: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "REFS_FAILED" }, { status: 500 });
  }
}
