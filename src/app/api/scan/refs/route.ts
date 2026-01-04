// src/app/api/scan/refs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Group = "plant" | "mushroom" | "tree" | "weed" | "all";

function normGroup(x: string | null): Group {
  const g = (x || "").toLowerCase();
  if (g === "plant" || g === "mushroom" || g === "tree" || g === "weed" || g === "all") return g;
  return "all";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const group = normGroup(searchParams.get("group"));

    const supabase = await supabaseServer();
    const BUCKET = process.env.NEXT_PUBLIC_SPECIES_BUCKET || "species";

    let q = supabase
      .from("species")
      .select("slug,primary_group,scientific_name,image_path")
      .not("image_path", "is", null);

    if (group !== "all") {
      q = q.eq("primary_group", group);
    }

    const { data, error } = await q.order("slug").limit(5000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const refs = (data ?? []).map((r) => {
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(r.image_path);

      return {
        slug: r.slug,
        group: r.primary_group,
        scientific_name: r.scientific_name,
        image_url: pub.publicUrl,
      };
    });

    return NextResponse.json({ ok: true, refs });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "REFS_FAILED" },
      { status: 500 }
    );
  }
}
