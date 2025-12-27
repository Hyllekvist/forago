import { supabaseServer } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import styles from "./FeedPage.module.css";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export type FeedFind = {
  id: string;
  created_at: string | null;
  observed_at: string | null;
  species_id: string | null;

  species_slug: string | null;
  scientific_name: string | null;
  primary_group: string | null;
  common_name: string | null;

  notes: string | null;
  photo_url: string | null;

  visibility: "private" | "friends" | "public_aggregate" | string | null;
  user_id: string | null;
  spot_id: string | null;
};

export type TopSpeciesSpot = {
  spot_id: string | null;
  finds_count: number | null;
  species_id: string | null;

  species_slug: string | null;
  scientific_name: string | null;
  common_name: string | null;
  primary_group: string | null;
};

export default async function FeedPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const now = new Date();
  const month = now.getMonth() + 1;

  // Main feed (finds)
  const { data, error } = await supabase.rpc("feed_finds", {
    p_country: "DK",
    p_locale: locale,
    p_limit: 30,
    p_cursor_created_at: null,
    p_cursor_id: null,
  });

  // ✅ Social proof widget: top species per hot spot (last 14 days)
  const { data: topSpecies, error: topErr } = await supabase.rpc("feed_top_species", {
    p_country: "DK",
    p_locale: locale,
    p_days: 14,
    p_limit: 8,
  });

  return (
    <main className={styles.page}>
      <FeedClient
        locale={locale}
        month={month}
        finds={(data ?? []) as FeedFind[]}
        viewerUserId={uid}
        errorMsg={error?.message ?? null}
        topSpecies={(topSpecies ?? []) as TopSpeciesSpot[]}
        topSpeciesError={topErr?.message ?? null}
      />
    </main>
  );
}