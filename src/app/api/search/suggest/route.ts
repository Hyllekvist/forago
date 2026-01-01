import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ species: [] });
  }

  const supabase = await supabaseServer();

  // simple, safe OR-search
  const { data, error } = await supabase
    .from("species")
    .select("slug, scientific_name, primary_group")
    .or(`slug.ilike.%${q}%,scientific_name.ilike.%${q}%`)
    .order("slug", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ species: [] }, { status: 200 });
  }

  return NextResponse.json({ species: data ?? [] });
}