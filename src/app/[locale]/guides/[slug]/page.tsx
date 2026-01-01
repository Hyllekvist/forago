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

function slugToTitle(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function estimateReadingTime(text: string) {
  const words = (text.trim().match(/\S+/g) || []).length;
  const minutes = Math.max(1, Math.round(words / 200)); // ~200 wpm
  return { words, minutes };
}

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!$begin:math:display$\[\^$end:math:display$]*]$begin:math:text$\[\^\)\]\*$end:math:text$/g, " ")
    .replace(/$begin:math:display$\[\^$end:math:display$]*]$begin:math:text$\[\^\)\]\*$end:math:text$/g, " ")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type TocItem = { id: string; label: string; level: 2 | 3 };

function slugifyHeading(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const raw of lines) {
    const m = raw.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;

    const level = m[1].length as 2 | 3;
    const label = m[2].replace(/\s+#*$/, "").trim();
    if (!label) continue;

    let id = slugifyHeading(label);
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;

    items.push({ id, label, level });
  }

  return items.slice(0, 24);
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
    title: `${t?.title || slugToTitle(slug)} · Guide · Forago`,
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
  const title = t?.title || slugToTitle(slug);
  const excerpt = t?.excerpt || null;
  const body = (t?.body || "").trim();

  const plain = stripMarkdown(body);
  const rt = estimateReadingTime(plain);
  const toc = extractToc(body);

  return (
    <main className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <Link className={styles.back} href={`/${locale}/guides`}>
            <span className={styles.backArrow} aria-hidden>
              ←
            </span>
            <span>Guides</span>
          </Link>
        </div>

        <div className={styles.topRight}>
          <Link className={styles.topPill} href={`/${locale}/feed`}>
            Feed
          </Link>
          <Link className={styles.topPill} href={`/${locale}/log`}>
            Log
          </Link>
        </div>
      </header>

      <div className={styles.shell}>
        {/* Hero */}
        <section className={styles.hero} aria-labelledby="guide-title">
          <div className={styles.heroGlow} aria-hidden="true" />

          <div className={styles.heroMeta}>
            <span className={styles.kicker}>GUIDE</span>
            <span className={styles.dot} aria-hidden="true">
              •
            </span>
            <span className={styles.metaText}>{rt.minutes} min læsning</span>
            <span className={styles.dot} aria-hidden="true">
              •
            </span>
            <span className={styles.metaText}>{rt.words} ord</span>
            <span className={styles.dot} aria-hidden="true">
              •
            </span>
            <span className={styles.metaText}>/{g.slug}</span>
          </div>

          <h1 id="guide-title" className={styles.h1}>
            {title}
          </h1>

          {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

          {toc.length > 0 ? (
            <nav className={styles.chips} aria-label="Sektioner">
              {toc
                .filter((x) => x.level === 2)
                .slice(0, 6)
                .map((x) => (
                  <a key={x.id} className={styles.chip} href={`#${x.id}`}>
                    {x.label}
                  </a>
                ))}
            </nav>
          ) : null}
        </section>

        {/* Content grid */}
        <section className={styles.grid}>
          {/* Desktop TOC */}
          <aside className={styles.aside} aria-label="Indhold">
            {toc.length > 0 ? (
              <div className={styles.tocCard}>
                <div className={styles.tocTitle}>Indhold</div>
                <div className={styles.tocList}>
                  {toc.map((x) => (
                    <a
                      key={x.id}
                      className={x.level === 3 ? styles.tocItemSub : styles.tocItem}
                      href={`#${x.id}`}
                    >
                      {x.label}
                    </a>
                  ))}
                </div>

                <div className={styles.tocActions}>
                  <Link className={styles.secondaryBtn} href={`/${locale}/guides`}>
                    Tilbage
                  </Link>
                  <Link className={styles.primaryBtn} href={`/${locale}/season`}>
                    Se sæson →
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.tocCard}>
                <div className={styles.tocTitle}>Guide</div>
                <div className={styles.tocMuted}>Ingen sektioner endnu.</div>
                <div className={styles.tocActions}>
                  <Link className={styles.secondaryBtn} href={`/${locale}/guides`}>
                    Tilbage
                  </Link>
                  <Link className={styles.primaryBtn} href={`/${locale}/season`}>
                    Se sæson →
                  </Link>
                </div>
              </div>
            )}
          </aside>

          {/* Article */}
          <article className={styles.article}>
            <div className={styles.contentCard}>
              {body ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => {
                      const label = String(children ?? "");
                      const id = slugifyHeading(label);
                      return (
                        <h2 id={id} className={styles.h2}>
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children }) => {
                      const label = String(children ?? "");
                      const id = slugifyHeading(label);
                      return (
                        <h3 id={id} className={styles.h3}>
                          {children}
                        </h3>
                      );
                    },
                    p: ({ children }) => <p className={styles.p}>{children}</p>,
                    ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
                    ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
                    li: ({ children }) => <li className={styles.li}>{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className={styles.quote}>{children}</blockquote>
                    ),
                    hr: () => <div className={styles.rule} />,
                    strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
                    a: ({ href, children, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.a}
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // FIX: ingen "inline" prop i types her. Vi detekterer inline via className.
                    code: ({ className, children, ...props }) => {
                      const isBlock = typeof className === "string" && className.includes("language-");
                      if (!isBlock) {
                        return (
                          <code className={styles.codeInline} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={styles.codeInline} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <pre className={styles.pre}>{children}</pre>,
                    table: ({ children }) => (
                      <div className={styles.tableWrap}>
                        <table className={styles.table}>{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className={styles.th}>{children}</th>,
                    td: ({ children }) => <td className={styles.td}>{children}</td>,
                  }}
                >
                  {body}
                </ReactMarkdown>
              ) : (
                <p className={styles.muted}>Ingen guide-tekst endnu.</p>
              )}
            </div>

            {/* Mobile bottom CTA */}
            <div className={styles.mobileCta}>
              <Link className={styles.secondaryBtn} href={`/${locale}/guides`}>
                ← Tilbage til Guides
              </Link>
              <Link className={styles.primaryBtn} href={`/${locale}/season`}>
                Se sæson →
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}