import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Guides.module.css";

export const dynamic = "force-dynamic";

type Params = { locale: string };

type GuideRow = {
  slug: string;
  is_published: boolean;
  guide_translations: Array<{
    locale: string;
    title: string | null;
    excerpt: string | null;
  }>;
};

export const metadata = {
  title: "Guides · Forago",
};

function pickTranslation<T extends { locale: string }>(
  list: T[],
  locale: string
) {
  return (
    list.find((t) => t.locale === locale) ??
    list.find((t) => t.locale === "dk") ??
    list[0] ??
    null
  );
}

export default async function GuidesPage({ params }: { params: Params }) {
  const locale = params.locale || "dk";
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("guides")
    .select("slug, is_published, guide_translations(locale, title, excerpt)")
    .eq("is_published", true)
    .order("slug", { ascending: true });

  if (error) notFound();

  const rows = (data as unknown as GuideRow[]) ?? [];

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Guides</h1>
          <p className={styles.sub}>
            Korte, praktiske guides til foraging, sikkerhed og sæson.
          </p>
        </div>

        <div className={styles.actions}>
          <Link className={styles.pill} href={`/${locale}/feed`}>
            Feed
          </Link>
          <Link className={styles.pill} href={`/${locale}/season`}>
            Sæson
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <section className={styles.emptyCard}>
          <div className={styles.emptyTitle}>Ingen guides endnu</div>
          <div className={styles.emptyText}>
            Opret rækker i <code>guides</code> og <code>guide_translations</code>,
            og sæt <code>is_published=true</code>.
          </div>
        </section>
      ) : (
        <section className={styles.grid}>
          {rows.map((g) => {
            const t = pickTranslation(g.guide_translations ?? [], locale);
            const title = t?.title || g.slug;
            const excerpt =
              t?.excerpt ||
              "Åbn guiden for konkrete tips, forvekslinger og sikkerhed.";

            return (
              <Link
                key={g.slug}
                href={`/${locale}/guides/${encodeURIComponent(g.slug)}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>{title}</div>
                  <div className={styles.badge}>Guide</div>
                </div>

                <div className={styles.cardExcerpt}>{excerpt}</div>

                <div className={styles.cardMeta}>
                  <span className={styles.cardSlug}>/{g.slug}</span>
                  <span className={styles.cardArrow} aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}