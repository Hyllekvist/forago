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

function pickTranslation<T extends { locale: string }>(list: T[], locale: string) {
  return (
    list.find((t) => t.locale === locale) ??
    list.find((t) => t.locale === "dk") ??
    list[0] ??
    null
  );
}

/**
 * Minimal “markdown-ish” renderer:
 * - ## Heading -> <h2>
 * - ### Heading -> <h3>
 * - - item -> <ul><li>
 * - blank line -> paragraph break
 * - everything else -> <p>
 *
 * Nok til dine guides, TL;DR og lister.
 */
function renderGuideBody(body: string) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");

  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = (keyBase: string) => {
    const text = paragraph.join(" ").trim();
    if (text) nodes.push(<p key={`${keyBase}-p`}>{text}</p>);
    paragraph = [];
  };

  const flushList = (keyBase: string) => {
    if (!list.length) return;
    nodes.push(
      <ul key={`${keyBase}-ul`}>
        {list.map((it, i) => (
          <li key={`${keyBase}-li-${i}`}>{it}</li>
        ))}
      </ul>
    );
    list = [];
  };

  let k = 0;

  for (const raw of lines) {
    const line = raw.trim();

    // blank -> flush blocks
    if (!line) {
      flushList(`k${k++}`);
      flushParagraph(`k${k++}`);
      continue;
    }

    // headings
    if (line.startsWith("## ")) {
      flushList(`k${k++}`);
      flushParagraph(`k${k++}`);
      nodes.push(<h2 key={`k${k++}`}>{line.replace(/^##\s+/, "")}</h2>);
      continue;
    }
    if (line.startsWith("### ")) {
      flushList(`k${k++}`);
      flushParagraph(`k${k++}`);
      nodes.push(<h3 key={`k${k++}`}>{line.replace(/^###\s+/, "")}</h3>);
      continue;
    }

    // list items
    if (line.startsWith("- ")) {
      flushParagraph(`k${k++}`);
      list.push(line.replace(/^-+\s+/, ""));
      continue;
    }

    // normal text
    flushList(`k${k++}`);
    paragraph.push(line);
  }

  flushList(`k${k++}`);
  flushParagraph(`k${k++}`);

  return nodes;
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

        <div className={styles.md}>{renderGuideBody(body)}</div>
      </article>
    </main>
  );
}