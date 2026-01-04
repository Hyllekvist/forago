import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // start simpelt: kun svampe i V1
  const kind = searchParams.get("kind") ?? "mushroom";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "40", 10) || 40, 80);

  const supabase = supabaseServer();

  // Tilpas felter til jeres schema
  // Forventet: slug, name_da (eller name), latin, image_path, kind/category
  const { data, error } = await supabase
    .from("species")
    .select("slug,name,latin,image_path,kind")
    .eq("kind", kind)
    .not("image_path", "is", null)
    .limit(limit);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return NextResponse.json({ ok: false, error: "NO_SUPABASE_URL" }, { status: 500 });

  const refs = (data ?? []).map((s) => ({
    slug: s.slug,
    name: s.name,
    latin: s.latin ?? undefined,
    imageUrl: `${base}/storage/v1/object/public/species/${s.image_path}`,
    // checks kan komme fra DB senere; i V1 kan du returnere tom og hydrate i /api/scan
    checks: [],
  }));

  return NextResponse.json({ ok: true, refs });
}
