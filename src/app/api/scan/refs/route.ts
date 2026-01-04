// src/app/api/scan/refs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Kind = "mushroom" | "plant" | "tree" | "weed" | "all";
type RowAny = Record<string, any>;

function normKind(x: string | null): Kind {
  const k = (x || "").toLowerCase();
  if (k === "mushroom" || k === "plant" || k === "tree" || k === "weed" || k === "all") return k;
  return "all";
}

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

function pickLatin(row: RowAny) {
  return (
    row.latin ??
    row.latin_name ??
    row.scientific_name ??
    row.binomial ??
    null
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = normKind(searchParams.get("kind"));

    const supabase = await supabaseServer();

    const BUCKET =
      process.env.SPECIES_BUCKET ||
      process.env.NEXT_PUBLIC_SPECIES_BUCKET ||
      "species";

    const run = async (select: string) => {
      let q = supabase.from("species").select(select).not("image_path", "is", null);
      if (kind !== "all") q = q.eq("kind", kind);
      return q.order("slug", { ascending: true }).limit(5000);
    };

    // Vi prøver i faldende “righed”
    const attempts = [
      "slug,kind,image_path,name,latin",
      "slug,kind,image_path,name,scientific_name",
      "slug,kind,image_path,name,latin_name",
      "slug,kind,image_path,name,binomial",
      "slug,kind,image_path,name_da,scientific_name",
      "slug,kind,image_path,name_da,latin_name",
      "slug,kind,image_path,name_da,binomial",
      "slug,kind,image_path,name_da",
      "slug,kind,image_path",
    ];

    let data: RowAny[] | null = null;
    let lastErr: string | null = null;

    for (const sel of attempts) {
      const { data: d, error } = await run(sel);
      if (!error) {
        data = d ?? [];
        lastErr = null;
        break;
      }
      lastErr = error.message;
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: lastErr || "REFS_FAILED" }, { status: 500 });
    }

    const refs = data.map((r) => {
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
        slug: r.slug ?? null,
        kind: r.kind ?? null,
        image_path: r.image_path ?? null,
        image_url,
        name: pickName(r),
        latin: pickLatin(r),
      };
    });

    return NextResponse.json({ ok: true, refs });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "REFS_FAILED" }, { status: 500 });
  }
}
