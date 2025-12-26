// src/app/[locale]/log/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import LogClient, { type FindRow } from "./LogClient";

export default async function LogPage() {
  const supabase = await supabaseServer();

  // NOTE: species er en single relation (ikke array). Bruger !inner for at få med, ellers kan den være null.
  // Hvis du vil tillade finds uden species, så fjern !inner og behold null-handling i LogClient (den er allerede robust).
  const { data: finds, error } = await supabase
    .from("finds")
    .select(
      `
      id,
      created_at,
      observed_at,
      visibility,
      photo_urls,
      spot_id,
      species:species_id (
        id,
        slug,
        primary_group,
        scientific_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    // fail soft: render empty list
    return <LogClient initial={[]} />;
  }

  // Normalize så client aldrig crasher på nulls
  const initial: FindRow[] = (finds ?? []).map((r: any) => ({
    id: String(r.id),
    created_at: String(r.created_at ?? ""),
    observed_at: String(r.observed_at ?? ""),
    visibility: String(r.visibility ?? ""),
    photo_urls: Array.isArray(r.photo_urls) ? r.photo_urls.map(String) : [],
    spot_id: String(r.spot_id ?? ""),
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