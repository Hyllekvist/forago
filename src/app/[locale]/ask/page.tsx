import styles from "./Ask.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { PostComposer } from "@/components/Posts/PostComposer";
import { PostCard, type PostItem } from "@/components/Posts/PostCard";
 
type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

export default async function AskPage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const { data: posts } = await supabase.rpc("posts_feed", {
    p_locale: locale,
    p_limit: 30,
  });

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Spørg" : "Ask"}</h1>
        <p className={styles.sub}>
          {locale === "dk"
            ? "Vær konkret: sæson, habitat, kendetegn + klare fotos. Ingen præcise spots."
            : "Be specific: season, habitat, traits + clear photos. No exact spots."}
        </p>
      </header>

      <section className={styles.compose}>
        <PostComposer />
      </section>

      <section className={styles.list} aria-label="Latest questions">
        <div className={styles.listTitle}>
          {locale === "dk" ? "Seneste spørgsmål" : "Latest questions"}
          <span className={styles.count}>{posts?.length ?? 0}</span>
        </div>

        <div className={styles.stack}>
          {(posts as unknown as PostItem[] | null)?.map((p) => (
            <PostCard key={p.id} post={p} locale={locale} />
          ))}
        </div>
      </section>
    </main>
  );
}