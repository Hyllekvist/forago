import { supabaseServer } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import styles from "./FeedPage.module.css";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

type FeedFind = {
  id: string;
  created_at?: string | null;
  observed_at?: string | null; // date comes as string
  species_id?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  visibility?: "private" | "friends" | "public_aggregate" | string | null;
  user_id?: string | null;
  spot_id?: string | null;
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

  // ✅ Secure feed from finds: public_aggregate + mine
  const { data, error } = await supabase.rpc("feed_finds", {
    p_country: "DK",
    p_limit: 30,
    p_cursor_created_at: null,
    p_cursor_id: null,
  });

  const feed = (data ?? []) as FeedFind[];

  return (
    <main className={styles.page}>
      <FeedClient
        locale={locale}
        month={month}
        finds={feed}
        viewerUserId={uid}
        errorMsg={error?.message ?? null}
      />
    </main>
  );
}