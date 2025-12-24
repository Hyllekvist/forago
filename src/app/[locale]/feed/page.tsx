import { supabaseServer } from "@/lib/supabase/server";
import FeedClient from "./FeedClient"; 
import styles from "./FeedPage.module.css";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export default async function FeedPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const now = new Date();
  const month = now.getMonth() + 1;

  // Latest logs (public + dine egne)
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const { data: logs } = await supabase
    .from("logs")
    .select("id, created_at, title, species_query, photo_path, visibility, user_id")
    .order("created_at", { ascending: false })
    .limit(30);

  // Filter: vis public + dine private
  const feed =
    (logs ?? []).filter((l: any) => l.visibility === "public" || (uid && l.user_id === uid));

  return (
    <main className={styles.page}>
      <FeedClient
        locale={locale}
        month={month}
        logs={feed as any[]}
        viewerUserId={uid}
      />
    </main>
  );
}