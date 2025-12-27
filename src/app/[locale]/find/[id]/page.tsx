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

export type TopSpeciesRow = {
  species_id: string;
  slug: string | null;
  common_name: string | null;
  scientific_name: string | null;
  primary_group: string | null;
  c_total: number;
  c_last30: number;
  c_qtr: number;
};

export type SpotIntelligence = {
  country: string | null;
  spot_id: string | null;
  total: number;
  last30: number;
  qtr: number;
  first_seen: string | null;        // timestamp
  last_seen: string | null;         // timestamp
  last_observed_at: string | null;  // date
  years_active: number;
  stable_over_years: boolean;
  year_counts: Array<{ year: number; count: number }>;
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

  const payload = (data ?? null) as FindDetailPayload | null;

  // ---- Top species widget ----
  let topSpecies: TopSpeciesRow[] = [];
  let topSpeciesError: string | null = null;

  try {
    const country = payload?.find?.country ?? "DK";
    const geo_cell = payload?.cell?.geo_cell ?? null;
    const spot_id = geo_cell ? null : payload?.find?.spot_id ?? null;

    if (geo_cell || spot_id) {
      const { data: ts, error: tsErr } = await supabase.rpc("top_species_area", {
        p_country: country,
        p_geo_cell: geo_cell,
        p_spot_id: spot_id,
        p_locale: locale,
        p_limit: 8,
      });

      if (tsErr) topSpeciesError = tsErr.message;
      topSpecies = (ts ?? []) as any[];
    }
  } catch (e: any) {
    topSpeciesError = e?.message ?? "Unknown";
  }

  // ---- Spot intelligence (simple + safe) ----
  let spotIntel: SpotIntelligence | null = null;
  let spotIntelError: string | null = null;

  try {
    const spot_id = payload?.find?.spot_id ?? null;
    const country = payload?.find?.country ?? "DK";

    if (spot_id) {
      const { data: si, error: siErr } = await supabase.rpc("spot_intelligence", {
        p_spot_id: spot_id,
        p_country: country,
      });

      if (siErr) spotIntelError = siErr.message;
      // nogle RPC’er returnerer { spot_intelligence: {...} } – andre bare {...}
      spotIntel = (si?.spot_intelligence ?? si ?? null) as any;
    }
  } catch (e: any) {
    spotIntelError = e?.message ?? "Unknown";
  }

  return (
    <main className={styles.page}>
      <FindClient
        locale={locale}
        payload={payload}
        errorMsg={error?.message ?? null}
        topSpecies={topSpecies}
        topSpeciesError={topSpeciesError}
        spotIntel={spotIntel}
        spotIntelError={spotIntelError}
      />
    </main>
  );
}
