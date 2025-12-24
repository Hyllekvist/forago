import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./GuidePage.module.css";

export const dynamic = "force-dynamic";

type Params = { locale: string; slug: string };

type GuideOne = {
  slug: string;
  is_published: boolean;
  guide_translations: Array<{
    locale: string;
    title: string | null;
    excerpt: string | null;
    body: string | null;
  }>;
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

export async function generateMetadata({ params }: { params: Params }) {
  const locale = params.locale || "dk";
  const slug = params.slug;

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("guides")
    .select("slug, is_published, guide_translations(locale, title, excerpt)")
    .eq("slug", slug)
    .maybeSingle();

  const g = data as unknown as GuideOne | null;
  const t = g ? pickTranslation(g.guide_translations ?? [], locale) : null;

  return {
    title: `${t?.title || slug} · Guide · Forago`,
    description: t?.excerpt || "Guide på Forago.",
  };
}

export default async function GuideDetailPage({ params }: { params: Params }) {
  const locale = params.locale || "dk";
  const slug = params.slug;

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("guides")
    .select("slug, is_published, guide_translations(locale, title, excerpt, body)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) notFound();

  const g = data as unknown as GuideOne | null;
  if (!g || !g.is_published) notFound();

  const t = pickTranslation(g.guide_translations ?? [], locale);
  const title = t?.title || slug;
  const excerpt = t?.excerpt || null;
  const body = t?.body || "";

  return (
    <main className={styles.wrap}>
      <header className={styles.topbar}>
        <Link className={styles.back} href={`/${locale}/guides`}>
          ← Guides
        </Link>

        <div className={styles.topActions}>
          <Link className={styles.pill} href={`/${locale}/feed`}>
            Feed
          </Link>
          <Link className={styles.pill} href={`/${locale}/log`}>
            Log
          </Link>
        </div>
      </header>

      <article className={styles.article}>
        <h1 className={styles.h1}>{title}</h1>
        {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

        <div className={styles.rule} />

        {/* body forventes at være ren tekst/markdown-ish.
            Hvis du gemmer HTML, så skift til dangerouslySetInnerHTML. */}
        <div className={styles.body}>
          {body.split("\n").map((p, i) =>
            p.trim() ? (
              <p key={i} className={styles.p}>
                {p}
              </p>
            ) : (
              <div key={i} className={styles.spacer} />
            )
          )}
        </div>
      </article>
    </main>
  );
}