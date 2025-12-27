import { supabaseServer } from "@/lib/supabase/server";
import FindClient from "./FindClient";
import styles from "./FindPage.module.css";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

type FindRow = {
  id: string;
  user_id: string | null;
  species_id: string | null;
  observed_at: string | null; // date
  created_at: string | null;  // timestamptz
  notes: string | null;
  photo_urls: string[] | null;
  country: string | null;
  geo_cell: string | null;
  geo_precision_km: number | null;
  visibility: "private" | "friends" | "public_aggregate" | string | null;
  spot_id: string | null;
};

type SpeciesRow = {
  id: string;
  slug: string | null;
  primary_group: string | null;
  scientific_name: string | null;
};

export type FindDetail = {
  find: FindRow;
  species: SpeciesRow | null;
  viewerUserId: string | null;
};

export default async function FindPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = safeLocale(params?.locale);
  const id = params?.id;

  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const viewerUserId = auth.user?.id ?? null;

  const { data: find, error: findErr } = await supabase
    .from("finds")
    .select(
      "id,user_id,species_id,observed_at,created_at,notes,photo_urls,country,geo_cell,geo_precision_km,visibility,spot_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (findErr || !find) {
    // keep it simple: client renders error card
    return (
      <main className={styles.page}>
        <FindClient
          locale={locale}
          data={null}
          errorMsg={findErr?.message ?? "Not found"}
        />
      </main>
    );
  }

  let species: SpeciesRow | null = null;
  if (find.species_id) {
    const { data: s } = await supabase
      .from("species")
      .select("id,slug,primary_group,scientific_name")
      .eq("id", find.species_id)
      .maybeSingle();
    species = (s as any) ?? null;
  }

  const data: FindDetail = { find: find as any, species, viewerUserId };

  return (
    <main className={styles.page}>
      <FindClient locale={locale} data={data} errorMsg={null} />
    </main>
  );
}