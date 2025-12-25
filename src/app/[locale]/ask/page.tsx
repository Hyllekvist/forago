// src/app/[locale]/ask/page.tsx
import Link from "next/link";
import styles from "./Ask.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { PostComposer } from "@/components/Posts/PostComposer";

export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string | null;
  locale: string | null;
};

export default async function Ask({ params }: { params: { locale: string } }) {
  const locale = params.locale || "dk";
  const supabase = await supabaseServer();

  // TODO: tilpas table/kolonner hvis dine navne er anderledes
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, created_at, locale")
    .eq("locale", locale)
    .order("created_at", { ascending: false })
    .limit(20);

  const list = (posts ?? []) as PostRow[];

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.h1}>
              {locale === "dk" ? "Spørg fællesskabet" : "Ask the community"}
            </h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Få hjælp til ID, forvekslinger og sikkerhed. Ingen præcise spots."
                : "Get help with ID, look-alikes and safety. No exact spots."}
            </p>
          </div>

          <div className={styles.chips}>
            <span className={styles.chip}>
              {locale === "dk" ? "Sæson" : "Season"}
            </span>
            <span className={styles.chip}>
              {locale === "dk" ? "Habitat" : "Habitat"}
            </span>
            <span className={styles.chip}>
              {locale === "dk" ? "Fotos" : "Photos"}
            </span>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>
            {locale === "dk" ? "Seneste spørgsmål" : "Latest questions"}
          </h2>
        </div>

        {list.length ? (
          <div className={styles.list}>
            {list.map((p) => (
              <Link
                key={p.id}
                href={`/${locale}/ask/${p.id}`}
                className={styles.row}
              >
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>
                    {p.title ||
                      (locale === "dk" ? "Spørgsmål" : "Question")}
                  </div>
                  <div className={styles.rowText}>
                    {(p.body ?? "").slice(0, 120)}
                    {(p.body ?? "").length > 120 ? "…" : ""}
                  </div>
                </div>
                <div className={styles.rowChevron} aria-hidden>
                  →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>
              {locale === "dk" ? "Ingen spørgsmål endnu" : "No questions yet"}
            </div>
            <div className={styles.emptySub}>
              {locale === "dk"
                ? "Bliv den første — spørg om en svamp/plante og få hjælp."
                : "Be the first — ask about a mushroom/plant and get help."}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.h2}>
            {locale === "dk" ? "Stil et spørgsmål" : "Ask a question"}
          </h2>
          <p className={styles.hint}>
            {locale === "dk"
              ? "Skriv sæson + habitat + det du er i tvivl om. Upload klare fotos."
              : "Include season + habitat + what you’re unsure about. Add clear photos."}
          </p>
        </div>

        <div className={styles.composer}>
          <PostComposer />
        </div>
      </section>
    </main>
  );
}