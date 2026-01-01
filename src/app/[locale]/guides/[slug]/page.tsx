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
  // Fix: some rows are stored with literal "\n" / "\N" instead of real newlines.
  // Also tolerate Windows newlines.
  return (raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\\N/g, "\n\n")
    .replace(/\\n/g, "\n")
    .trim();
}

function slugifyId(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractSections(md: string) {
  // simple: grab "## Heading" and make chips
  const lines = (md || "").split("\n");
  const sections: Array<{ id: string; label: string }> = [];
  for (const ln of lines) {
    const m = ln.match(/^##\s+(.*)$/);
    if (m?.[1]) {
      const label = m[1].trim();
      const id = slugifyId(label);
      if (id && !sections.find((x) => x.id === id)) sections.push({ id, label });
    }
  }
  return sections.slice(0, 6);
}

function wordCount(md: string) {
  // crude but good enough
  const text = (md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_~\-]/g, " ")
    .replace(/$begin:math:display$\(\.\*\?\)$end:math:display$$begin:math:text$\(\.\*\?\)$end:math:text$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
}

function readingMinutes(words: number) {
  // ~200 wpm
  return Math.max(1, Math.round(words / 200));
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
  const words = wordCount(body);
  const mins = readingMinutes(words);
  const sections = extractSections(body);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.back} href={`/${locale}/guides`}>
          ← Guides
        </Link>

        <div className={styles.topActions}>
          <Link className={styles.pill} href={`/${locale}/feed`}>Feed</Link>
          <Link className={styles.pill} href={`/${locale}/log`}>Log</Link>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="guide-title">
        <div className={styles.heroCard}>
          <div className={styles.metaRow}>
            <span className={styles.kicker}>GUIDE</span>
            <span className={styles.dot} aria-hidden>•</span>
            <span className={styles.meta}>{mins} min læsning</span>
            <span className={styles.dot} aria-hidden>•</span>
            <span className={styles.meta}>{words} ord</span>
          </div>

          <h1 id="guide-title" className={styles.h1}>{title}</h1>
          {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

          {sections.length > 0 ? (
            <nav className={styles.chips} aria-label="Indhold">
              {sections.map((s) => (
                <a key={s.id} className={styles.chip} href={`#${s.id}`}>
                  {s.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <article className={styles.article}>
        {body ? (
   <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    a: ({ href, children, ...props }) => (
      <a href={href} target="_blank" rel="noreferrer" className={styles.a} {...props}>
        {children}
      </a>
    ),
    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
    p: ({ children }) => <p className={styles.p}>{children}</p>,
    ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
    li: ({ children }) => <li className={styles.li}>{children}</li>,
    blockquote: ({ children }) => <blockquote className={styles.quote}>{children}</blockquote>,
    hr: () => <div className={styles.rule} />,
    strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className); // blocks get language-* className
      if (!isBlock) {
        return (
          <code className={styles.codeInline} {...props}>
            {children}
          </code>
        );
      }
      return (
        <pre className={styles.codeBlock}>
          <code className={className ?? ""} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  }}
>
  {body}
</ReactMarkdown>
        ) : (
          <p className={styles.muted}>Ingen guide-tekst endnu.</p>
        )}
      </article>

      <div className={styles.bottomBar} role="navigation" aria-label="Guide navigation">
        <Link className={styles.bottomBtn} href={`/${locale}/guides`}>← Tilbage til Guides</Link>
        <Link className={styles.bottomBtnPrimary} href={`/${locale}/season`}>Se sæson →</Link>
      </div>
    </main>
  );
}