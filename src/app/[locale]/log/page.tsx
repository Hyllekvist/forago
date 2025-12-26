// src/app/[locale]/log/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import LogClient, { type FindRow } from "./LogClient";

export default async function LogPage() {
  const supabase = await supabaseServer();

  // auth
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  if (!userId) {
    return <LogClient initial={[]} />;
  }

  // IMPORTANT:
  // alias: species:species_id(...) => giver species som object (ikke array)
  const { data: finds, error } = await supabase
    .from("finds")
    .select(
      `
        id,
        created_at,
        observed_at,
        notes,
        visibility,
        photo_urls,
        spot_id,
        species_id,
        species:species_id (
          id,
          slug,
          primary_group,
          scientific_name
        )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  // fail-soft
  if (error) {
    console.error("[log/page] supabase error", error.message);
    return <LogClient initial={[]} />;
  }

  // Normalize så client aldrig crasher på nulls
  const initial: FindRow[] = (finds ?? []).map((r: any) => ({
    id: String(r.id),
    created_at: String(r.created_at),
    observed_at: String(r.observed_at ?? ""),
    notes: typeof r.notes === "string" ? r.notes : "",
    visibility: String(r.visibility ?? "private"),
    photo_urls: Array.isArray(r.photo_urls) ? r.photo_urls : [],
    spot_id: String(r.spot_id ?? ""),
    species_id: r.species_id ? String(r.species_id) : null,
    species: r.species
      ? {
          id: String(r.species.id),
          slug: String(r.species.slug),
          primary_group: String(r.species.primary_group),
          scientific_name: r.species.scientific_name ? String(r.species.scientific_name) : null,
        }
      : null,
  }));

  return <LogClient initial={initial} />;
}