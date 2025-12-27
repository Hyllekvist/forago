import styles from "./Ask.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { PostComposer } from "@/components/Posts/PostComposer";
import { PostCard, type PostItem } from "@/components/Posts/PostCard";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

const STARTERS_DK = [
  "Hvor finder man de bedste østers på Sjælland?",
  "Hvilken varmepumpe giver bedst mening i et 70’er hus?",
  "God børnevenlig strand nær Kalundborg?",
  "Bedste kaffebar til at arbejde i København?",
  "Hvad er den mest undervurderede restaurant i Aarhus?",
];

export default async function AskPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { q?: string };
}) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const { data: posts } = await supabase.rpc("posts_feed", {
    p_locale: locale,
    p_limit: 30,
  });

  // Vi bruger kun q til UI / deep-linking (ingen PostComposer props)
  const q = (searchParams?.q ?? "").slice(0, 180);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Stil et spørgsmål" : "Ask a question"}</h1>
        <p className={styles.sub}>
          {locale === "dk"
            ? "Hold det konkret. Jo mere praktisk, jo bedre svar."
            : "Keep it practical. The clearer the question, the better the answers."}
        </p>
      </header>

      {/* ONBOARDING: eksempler før composer */}
      <section className={styles.starters} aria-label="Examples">
        <div className={styles.startersTitle}>
          {locale === "dk" ? "Start med et eksempel" : "Start with an example"}
        </div>

        <div className={styles.startersGrid}>
          {STARTERS_DK.map((s) => (
            <a
              key={s}
              className={styles.starter}
              href={`/${locale}/ask?q=${encodeURIComponent(s)}`}
            >
              <div className={styles.starterQ}>{s}</div>
              <div className={styles.starterCta}>{locale === "dk" ? "Brug denne →" : "Use this →"}</div>
            </a>
          ))}
        </div>

        {/* Hvis der er q i URL, viser vi det som “valgt” uden at påvirke composer */}
        {q ? (
          <div className={styles.selectedHint}>
            {locale === "dk" ? "Valgt eksempel:" : "Selected example:"} <span className={styles.selectedText}>{q}</span>
          </div>
        ) : null}
      </section>

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
