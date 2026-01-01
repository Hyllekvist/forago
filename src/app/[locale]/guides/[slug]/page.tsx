import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function pickTranslation<T extends { locale: string }>(list: T[], locale: string) {
  return (
    list.find((t) => t.locale === locale) ??
    list.find((t) => t.locale === "dk") ??
    list[0] ??
    null
  );
}

function normalizeMarkdown(raw: string) {
  // DB har ofte literal "\n" (to tegn). Det skal blive til rigtige linjeskift.
  // Også typisk Windows-linjeskift og trailing spaces.
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function estimateReadingMinutes(text: string) {
  // ~180 ord/min (konservativt på mobil)
  const words = text
    .replace(/[`*_>#$begin:math:display$$end:math:display$$begin:math:text$$end:math:text$\-!\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const min = Math.max(1, Math.round(words / 180));
  return { words, min };
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

  const md = normalizeMarkdown(t?.body || "");
  const { words, min } = estimateReadingMinutes(md);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
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

        <section className={styles.hero} aria-labelledby="guide-title">
          <div className={styles.heroInner}>
            <div className={styles.metaRow}>
              <span className={styles.kicker}>GUIDE</span>
              <span className={styles.dot}>•</span>
              <span className={styles.meta}>{min} min læsning</span>
              <span className={styles.dot}>•</span>
              <span className={styles.meta}>{words} ord</span>
              <span className={styles.dot}>•</span>
              <span className={styles.slug}>/{g.slug}</span>
            </div>

            <h1 id="guide-title" className={styles.h1}>
              {title}
            </h1>

            {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}
          </div>

          <div className={styles.heroGlow} aria-hidden="true" />
        </section>

        <article className={styles.article}>
          <div className={styles.contentCard}>
            {md ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children, ...props }) => (
                    <h2 className={styles.h2} {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className={styles.h3} {...props}>
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p className={styles.p} {...props}>
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className={styles.ul} {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className={styles.ol} {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className={styles.li} {...props}>
                      {children}
                    </li>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote className={styles.quote} {...props}>
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children, ...props }) => (
                    <a
                      className={styles.a}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  hr: () => <div className={styles.rule} />,
                  strong: ({ children, ...props }) => (
                    <strong className={styles.strong} {...props}>
                      {children}
                    </strong>
                  ),
                  code: ({ className, children, ...props }) => {
                    // inline code har typisk ingen className
                    const inline = !className;
                    return inline ? (
                      <code className={styles.codeInline} {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={`${styles.codeBlock} ${className}`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre className={styles.pre} {...props}>
                      {children}
                    </pre>
                  ),
                }}
              >
                {md}
              </ReactMarkdown>
            ) : (
              <p className={styles.muted}>Ingen guide-tekst endnu.</p>
            )}
          </div>
        </article>

        <nav className={styles.stickyCta} aria-label="Guide actions">
          <Link className={styles.ctaGhost} href={`/${locale}/guides`}>
            ← Tilbage
          </Link>
          <Link className={styles.ctaPrimary} href={`/${locale}/season`}>
            Se sæson →
          </Link>
        </nav>
      </div>
    </main>
  );
}