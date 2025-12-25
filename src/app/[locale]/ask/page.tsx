import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Ask.module.css";
import { PostComposer } from "@/components/Posts/PostComposer";
import { PostCard } from "@/components/Posts/PostCard";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  created_at: string;
  locale: string;
  type: string;
  title: string;
  body: string;
  user_id: string | null;
};

export default async function AskPage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const { data: posts } = await supabase
    .from("posts")
    .select("id, created_at, locale, type, title, body, user_id")
    .eq("locale", locale)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className={styles.wrap}>
      <header className={styles.head}>
        <h1 className={styles.h1}>Ask</h1>
        <p className={styles.sub}>
          Be specific: season, habitat, traits, and clear photos. No exact spots.
        </p>
      </header>

      <section className={styles.composer}>
        <h2 className={styles.h2}>Stil et spørgsmål</h2>
        <PostComposer />
      </section>

      <section className={styles.list}>
        <div className={styles.listTop}>
          <h2 className={styles.h2}>Seneste spørgsmål</h2>
          <div className={styles.meta}>Viser {posts?.length ?? 0}</div>
        </div>

        {posts?.length ? (
          <div className={styles.grid}>
            {(posts as PostRow[]).map((p) => (
              <PostCard key={p.id} post={p} isMine={!!uid && p.user_id === uid} locale={locale} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🍄</div>
            <div className={styles.emptyTitle}>Ingen spørgsmål endnu</div>
            <div className={styles.emptyBody}>Vær den første til at spørge.</div>
          </div>
        )}
      </section>
    </main>
  );
}