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

type RowAny = Record<string, any>;

function pickName(row: RowAny) {
  return (
    row.name ??
    row.name_da ??
    row.name_en ??
    row.title ??
    row.common_name ??
    row.display_name ??
    null
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = normKind(searchParams.get("kind"));

    const supabase = await supabaseServer();

    // Hvis du bruger storage public urls, kan du sætte bucket-navn her:
    // (valgfrit) SPECIES_BUCKET eller NEXT_PUBLIC_SPECIES_BUCKET
    const BUCKET =
      process.env.SPECIES_BUCKET ||
      process.env.NEXT_PUBLIC_SPECIES_BUCKET ||
      "species";

    const base = (select: string) => {
      let q = supabase.from("species").select(select).not("image_path", "is", null);
      if (kind !== "all") q = q.eq("kind", kind);
      return q.order("slug", { ascending: true }).limit(5000);
    };

    // 1) Prøv med "name"
    let data: RowAny[] | null = null;

    {
      const { data: d, error } = await base("slug,name,latin,image_path,kind");
      if (!error) data = d ?? [];
    }

    // 2) Fallback: prøv med "name_da"
    if (!data) {
      const { data: d, error } = await base("slug,name_da,latin,image_path,kind");
      if (!error) data = d ?? [];
    }

    // 3) Sidste fallback: uden navn-kolonne
    if (!data) {
      const { data: d, error } = await base("slug,latin,image_path,kind");
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      data = d ?? [];
    }

    const refs = (data ?? []).map((r) => {
      // Lav public url hvis du bruger Supabase Storage
      // Hvis dine image_path allerede er en fuld URL, så bliver den bare brugt som fallback
      let image_url: string | null = null;

      const p = r.image_path as string | null;
      if (p) {
        if (p.startsWith("http://") || p.startsWith("https://")) {
          image_url = p;
        } else {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(p);
          image_url = pub?.publicUrl ?? null;
        }
      }

      return {
        slug: r.slug,
        kind: r.kind ?? null,
        latin: r.latin ?? null,
        image_path: r.image_path ?? null,
        image_url,
        name: pickName(r),
      };
    });

    return NextResponse.json({ ok: true, refs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "REFS_FAILED" }, { status: 500 });
  }
}
