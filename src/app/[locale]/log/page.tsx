import { supabaseServer } from "@/lib/supabase/server";
import LogClient from "./LogClient";

export default async function LogPage() {
  const supabase = await supabaseServer();

  const { data: finds } = await supabase
    .from("finds")
    .select(`
      id,
      created_at,
      observed_at,
      notes,
      photo_urls,
      visibility,
      spot_id,
      species:species_id (
        id,
        slug,
        primary_group,
        scientific_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return <LogClient initial={finds ?? []} />;
}