import { supabaseServer } from "@/lib/supabase/server";
import FindClient from "./FindClient";
import styles from "./FindPage.module.css";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}
 
type FindDetailPayload = {
  find: {
    id: string;
    user_id: string | null;
    species_id: string | null;
    observed_at: string | null;
    created_at: string | null;
    notes: string | null;
    photo_urls: string[] | null;
    country: string | null;
    spot_id: string | null;
    geo_cell: string | null;
    geo_precision_km: number | null;
    visibility: string | null;
  };
  species: {
    id: string;
    slug: string | null;
    primary_group: string | null;
    scientific_name: string | null;
  } | null;
  translation: {
    locale: string | null;
    common_name: string | null;
    short_description: string | null;
    identification: string | null;
    lookalikes: string | null;
    usage_notes: string | null;
    safety_notes: string | null;
    updated_at: string | null;
  } | null;
  cell: {
    country: string | null;
    geo_cell: string | null;
    precision_km: number | null;
    finds_count: number | null;
    updated_at: string | null;
  } | null;
  related: Array<{
    id: string;
    created_at: string | null;
    observed_at: string | null;
    species_id: string | null;
    notes: string | null;
    photo_url: string | null;
    visibility: string | null;
    user_id: string | null;
    country: string | null;
    spot_id: string | null;
    geo_cell: string | null;
    geo_precision_km: number | null;
  }>;
};

export default async function FindPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = safeLocale(params?.locale);
  const id = params?.id;

  const supabase = await supabaseServer();

  const { data, error } = await supabase.rpc("find_detail", {
    p_find_id: id,
    p_locale: locale,
  });

  // supabase rpc returns jsonb; here it's already an object in JS
  const payload = (data ?? null) as FindDetailPayload | null;

  return (
    <main className={styles.page}>
      <FindClient locale={locale} payload={payload} errorMsg={error?.message ?? null} />
    </main>
  );
}