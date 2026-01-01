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
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function estimateReadingMinutes(text: string) {
  const words = text
    .replace(/[`*_>#$\-\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  const min = Math.max(1, Math.round(words / 180));
  return { words, min };
}

function slugifyHeading(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, " og ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

type TocItem = { id: string; text: string; level: 2 | 3 };

function extractToc(md: string): TocItem[] {
  // Kun ## og ### (H2/H3) i markdown
  const lines = md.split("\n");
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;

    const level = m[1].length === 2 ? 2 : 3;
    const text = m[2].replace(/\s+#+\s*$/, "").trim();
    if (!text) continue;

    let id = slugifyHeading(text);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;

    items.push({ id, text, level });
  }
  return items;
}

function isInternalHref(href?: string) {
  if (!href) return false;
  return href.startsWith("/") || href.startsWith("#");
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
  const excerpt = (t?.excerpt || "").trim() || null;

  const md = normalizeMarkdown(t?.body || "");
  const { words, min } = estimateReadingMinutes(md);
  const toc = md ? extractToc(md) : [];

  // Byg en stabil mapping fra heading-text -> id (inkl duplicates) til ReactMarkdown headings
  const headingMap = new Map<string, { base: string; count: number }>();

  function idForHeadingText(text: string) {
    const base = slugifyHeading(text);
    const entry = headingMap.get(base) ?? { base, count: 0 };
    entry.count += 1;
    headingMap.set(base, entry);
    return entry.count > 1 ? `${base}-${entry.count}` : base;
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <Link className={styles.back} href={`/${locale}/guides`}>
              <span className={styles.backIcon} aria-hidden>
                ←
              </span>
              <span className={styles.backText}>Guides</span>
            </Link>
          </div>

          <div className={styles.topbarRight}>
            <Link className={styles.topLink} href={`/${locale}/species`}>
              Arter
            </Link>
            <Link className={styles.topLink} href={`/${locale}/season`}>
              Sæson
            </Link>
            <Link className={styles.topLink} href={`/${locale}/log`}>
              Log
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className={styles.hero} aria-labelledby="guide-title">
          <div className={styles.heroBg} aria-hidden="true" />

          <div className={styles.heroInner}>
            <div className={styles.heroMetaRow}>
              <span className={styles.pillMeta}>GUIDE</span>
              <span className={styles.metaSep} aria-hidden>
                •
              </span>
              <span className={styles.metaText}>{min} min</span>
              <span className={styles.metaSep} aria-hidden>
                •
              </span>
              <span className={styles.metaText}>{words} ord</span>
              <span className={styles.metaSep} aria-hidden>
                •
              </span>
              <span className={styles.metaSlug}>/{g.slug}</span>
            </div>

            <h1 id="guide-title" className={styles.h1}>
              {title}
            </h1>

            {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href={`/${locale}/species`}>
                Udforsk arter →
              </Link>
              <Link className={styles.secondaryCta} href={`/${locale}/season`}>
                Se sæson
              </Link>
              <Link className={styles.ghostCta} href={`/${locale}/guides`}>
                Alle guides
              </Link>
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className={styles.grid}>
          {/* ASIDE (desktop) */}
          <aside className={styles.aside} aria-label="Indhold">
            <div className={styles.asideCard}>
              <div className={styles.asideTitle}>Indhold</div>

              {toc.length === 0 ? (
                <div className={styles.asideMuted}>
                  Tilføj <code>##</code> overskrifter i guiden, så får du automatisk en flot indholdsoversigt.
                </div>
              ) : (
                <nav className={styles.toc}>
                  {toc.map((it) => (
                    <a
                      key={`${it.level}-${it.id}`}
                      href={`#${it.id}`}
                      className={it.level === 2 ? styles.tocItem : styles.tocItemSub}
                    >
                      {it.text}
                    </a>
                  ))}
                </nav>
              )}

              <div className={styles.asideDivider} />

              <div className={styles.quickLinks}>
                <Link className={styles.quickLink} href={`/${locale}/feed`}>
                  Feed
                </Link>
                <Link className={styles.quickLink} href={`/${locale}/season`}>
                  Sæson
                </Link>
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <article className={styles.article}>
            {/* MOBILE TOC */}
            {toc.length > 0 ? (
              <details className={styles.mobileToc}>
                <summary className={styles.mobileTocSummary}>
                  <span>Indhold</span>
                  <span className={styles.mobileTocHint}>{toc.length} punkter</span>
                </summary>
                <div className={styles.mobileTocList}>
                  {toc.map((it) => (
                    <a
                      key={`${it.level}-${it.id}-m`}
                      href={`#${it.id}`}
                      className={it.level === 2 ? styles.mobileTocItem : styles.mobileTocItemSub}
                    >
                      {it.text}
                    </a>
                  ))}
                </div>
              </details>
            ) : null}

            <div className={styles.contentCard}>
              {md ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children, ...props }) => {
                      const text = String(children ?? "").trim();
                      const id = idForHeadingText(text);
                      return (
                        <h2 id={id} className={styles.h2} {...props}>
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children, ...props }) => {
                      const text = String(children ?? "").trim();
                      const id = idForHeadingText(text);
                      return (
                        <h3 id={id} className={styles.h3} {...props}>
                          {children}
                        </h3>
                      );
                    },
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
                    hr: () => <div className={styles.rule} />,
                    strong: ({ children, ...props }) => (
                      <strong className={styles.strong} {...props}>
                        {children}
                      </strong>
                    ),
                    a: ({ href, children, ...props }) => {
                      if (isInternalHref(href)) {
                        return (
                          <Link className={styles.a} href={href || "#"} {...(props as any)}>
                            {children}
                          </Link>
                        );
                      }
                      return (
                        <a
                          className={styles.a}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    code: ({ className, children, ...props }) => {
                      const inline = !className;
                      return inline ? (
                        <code className={styles.codeInline} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={styles.codeBlock} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children, ...props }) => (
                      <pre className={styles.pre} {...props}>
                        {children}
                      </pre>
                    ),
                    table: ({ children, ...props }) => (
                      <div className={styles.tableWrap}>
                        <table className={styles.table} {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className={styles.th} {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className={styles.td} {...props}>
                        {children}
                      </td>
                    ),
                  }}
                >
                  {md}
                </ReactMarkdown>
              ) : (
                <p className={styles.muted}>Ingen guide-tekst endnu.</p>
              )}
            </div>

            {/* FOOT CTA */}
            <div className={styles.footerCtas}>
              <Link className={styles.footerGhost} href={`/${locale}/guides`}>
                ← Alle guides
              </Link>
              <Link className={styles.footerPrimary} href={`/${locale}/species`}>
                Find arter →
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}