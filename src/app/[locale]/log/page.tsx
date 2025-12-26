// src/app/[locale]/log/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import LogClient, { type FindRow } from "./LogClient";

export default async function LogPage() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  if (!userId) {
    return <LogClient initial={[]} />;
  }

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
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    // hellere tom liste end build-crash
    return <LogClient initial={[]} />;
  }

  // Normalize: hvis supabase/postgrest alligevel giver array, tag første element
  const initial: FindRow[] = (finds ?? [])
    .map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      observed_at: r.observed_at,
      visibility: r.visibility,
      photo_urls: Array.isArray(r.photo_urls) ? r.photo_urls : [],
      spot_id: r.spot_id,
      species: Array.isArray(r.species) ? r.species[0] : r.species,
    }))
    .filter((r) => !!r.species);

  return <LogClient initial={initial} />;
}