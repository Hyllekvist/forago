import { supabaseServer } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import styles from "./FeedPage.module.css";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

type LogItem = { 
  id: string;
  created_at?: string | null;
  locale?: string | null;
  species_query?: string | null;
  note?: string | null;
  photo_path?: string | null;
  photo_width?: number | null;
  photo_height?: number | null;
  visibility?: "public" | "private" | string | null;
  user_id?: string | null;
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

  // ✅ secure: DB returns only public + mine (via RPC + RLS)
  const { data: logs, error } = await supabase.rpc("feed_logs", {
    p_locale: locale,
    p_limit: 30,
    p_cursor_created_at: null,
    p_cursor_id: null,
  });

  const feed = (logs ?? []) as LogItem[];

  return (
    <main className={styles.page}>
      <FeedClient
        locale={locale}
        month={month}
        logs={feed}
        viewerUserId={uid}
        errorMsg={error?.message ?? null}
      />
    </main>
  );
}