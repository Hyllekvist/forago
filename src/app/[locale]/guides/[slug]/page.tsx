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

function normalizeBody(raw: string) {
  // Fix hvis der ligger bogstavelige "\n" i databasen
  return (raw || "")
    .trim()
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function slugifyHeading(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " og ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type TocItem = { depth: 2 | 3; text: string; id: string };

function buildToc(markdown: string): TocItem[] {
  const md = markdown || "";
  const lines = md.split("\n");

  // Fjern overskrifter inde i code fences (simpel state machine)
  let inCode = false;
  const items: TocItem[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const fence = line.trim().startsWith("```");
    if (fence) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;

    const depth = (m[1].length as 2 | 3);
    const text = m[2].replace(/\s+#*$/, "").trim();
    if (!text) continue;

    let id = slugifyHeading(text);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;

    items.push({ depth, text, id });
  }

  return items.slice(0, 24);
}

function estimateReadingTime(text: string) {
  const words = (text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\-$begin:math:display$$end:math:display$()`]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 180));
  return { words, minutes };
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

  const body = normalizeBody(t?.body || "");
  const toc = buildToc(body);
  const rt = estimateReadingTime(body);

  const pillLabel =
    locale === "dk"
      ? `${rt.minutes} min læsning · ${rt.words} ord`
      : `${rt.minutes} min read · ${rt.words} words`;

  return (
    <main className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.back} href={`/${locale}/guides`}>
            <span className={styles.backArrow} aria-hidden>←</span>
            <span>Guides</span>
          </Link>

          <div className={styles.topActions}>
            <Link className={styles.pill} href={`/${locale}/feed`}>Feed</Link>
            <Link className={styles.pill} href={`/${locale}/log`}>Log</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroMeta}>
            <span className={styles.kicker}>Guide</span>
            <span className={styles.dot} aria-hidden>•</span>
            <span className={styles.reading}>{pillLabel}</span>
          </div>

          <h1 id="guide-title" className={styles.h1}>
            {title}
          </h1>

          {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

          <div className={styles.heroChips}>
            <span className={styles.chip}>Sikkerhed</span>
            <span className={styles.chip}>Forvekslinger</span>
            <span className={styles.chip}>Tjekliste</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={styles.shell}>
        <div className={styles.grid}>
          <article className={styles.article}>
            {body ? (
              <div className={styles.surface}>
                <div className={styles.md}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a href={href} target="_blank" rel="noreferrer" {...props}>
                          {children}
                        </a>
                      ),
                      h2: ({ children }) => {
                        const text = String(children ?? "").trim();
                        const id = slugifyHeading(text);
                        return (
                          <h2 id={id} className={styles.h2}>
                            <a className={styles.anchor} href={`#${id}`} aria-hidden>
                              #
                            </a>
                            {children}
                          </h2>
                        );
                      },
                      h3: ({ children }) => {
                        const text = String(children ?? "").trim();
                        const id = slugifyHeading(text);
                        return (
                          <h3 id={id} className={styles.h3}>
                            <a className={styles.anchor} href={`#${id}`} aria-hidden>
                              #
                            </a>
                            {children}
                          </h3>
                        );
                      },
                      blockquote: ({ children }) => (
                        <blockquote className={styles.callout}>{children}</blockquote>
                      ),
                      code: ({ children }) => <code className={styles.codeInline}>{children}</code>,
                      pre: ({ children }) => <pre className={styles.codeBlock}>{children}</pre>,
                    }}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className={styles.surface}>
                <p className={styles.muted}>Ingen guide-tekst endnu.</p>
              </div>
            )}

            <div className={styles.bottomNav}>
              <Link className={styles.bottomLink} href={`/${locale}/guides`}>
                ← Tilbage til Guides
              </Link>
              <Link className={styles.bottomLink} href={`/${locale}/season`}>
                Se sæson → 
              </Link>
            </div>
          </article>

          {/* TOC */}
          <aside className={styles.aside} aria-label="Indhold">
            <div className={styles.asideCard}>
              <div className={styles.asideTitle}>
                {locale === "dk" ? "På siden" : "On this page"}
              </div>

              {toc.length === 0 ? (
                <div className={styles.asideMuted}>
                  {locale === "dk" ? "Tilføj H2/H3 i markdown for indholdsfortegnelse." : "Add H2/H3 headings to show a table of contents."}
                </div>
              ) : (
                <nav className={styles.toc}>
                  {toc.map((it) => (
                    <a
                      key={`${it.depth}-${it.id}`}
                      className={it.depth === 3 ? styles.tocItemSub : styles.tocItem}
                      href={`#${it.id}`}
                    >
                      {it.text}
                    </a>
                  ))}
                </nav>
              )}

              <div className={styles.asideFooter}>
                <span className={styles.asidePill}>/{g.slug}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}