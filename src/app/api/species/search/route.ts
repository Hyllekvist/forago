import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const locale = (searchParams.get("locale") ?? "dk").toLowerCase();

  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

  const supabase = await supabaseServer();

  // 1) find matches in translations (common_name)
  const { data: hits, error: e1 } = await supabase
    .from("species_translations")
    .select("species_id, common_name")
    .eq("locale", locale)
    .ilike("common_name", `%${q}%`)
    .limit(20);

  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 400 });
  if (!hits?.length) return NextResponse.json({ ok: true, items: [] });

  const ids = Array.from(new Set(hits.map((h) => h.species_id)));

  // 2) map species_id -> slug
  const { data: species, error: e2 } = await supabase
    .from("species")
    .select("id,slug")
    .in("id", ids);

  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 400 });

  const slugById = new Map((species ?? []).map((s) => [s.id, s.slug]));

  const items = hits
    .map((h) => ({
      slug: slugById.get(h.species_id),
      name: h.common_name,
    }))
    .filter((x): x is { slug: string; name: string } => !!x.slug)
    .slice(0, 12);

  return NextResponse.json({ ok: true, items });
}
