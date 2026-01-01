import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import SearchClient from "./SearchClient";
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

export const metadata = { title: "Guides · Forago" };

function pickTranslation<T extends { locale: string }>(list: T[], locale: string) {
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

  const rows = ((data as unknown as GuideRow[]) ?? []).map((g) => {
    const t = pickTranslation(g.guide_translations ?? [], locale);
    return {
      slug: g.slug,
      title: t?.title || g.slug,
      excerpt:
        t?.excerpt || "Åbn guiden for konkrete tips, forvekslinger og sikkerhed.",
    };
  });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.kicker}>GUIDES</div>
            <h1 className={styles.h1}>Guides</h1>
            <p className={styles.sub}>
              Korte, praktiske guides til foraging, sikkerhed og sæson — skrevet til virkeligheden.
            </p>
          </div>

          <div className={styles.topbarRight}>
            <Link className={styles.topLink} href={`/${locale}/feed`}>Feed</Link>
            <Link className={styles.topLink} href={`/${locale}/season`}>Sæson</Link>
            <Link className={styles.topLink} href={`/${locale}/species`}>Arter</Link>
          </div>
        </header>

        {/* Search + results (client) */}
        <SearchClient
          locale={locale}
          guides={rows}
        />
      </div>
    </main>
  );
}