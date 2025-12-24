import Link from "next/link"; 
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };

  return {
    title: localeParam === "dk" ? "Guides — Forago" : "Guides — Forago",
    description:
      localeParam === "dk"
        ? "Sikker sankning: identifikation, forvekslinger, udstyr og første ture."
        : "Safe foraging: identification, look-alikes, gear, and first trips.",
    alternates: { canonical: `/${localeParam}/guides` },
  };
}

export default async function GuidesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return notFound();
  const locale = params.locale;

const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("guides")
    .select("slug, is_published, guide_translations(title, excerpt, locale)")
    .eq("is_published", true)
    .order("slug", { ascending: true });

  if (error) throw error;

  const items =
    (data ?? [])
      .map((g: any) => {
        const t = (g.guide_translations ?? []).find((x: any) => x.locale === locale);
        return {
          slug: g.slug as string,
          title: (t?.title as string) || g.slug,
          excerpt: (t?.excerpt as string) || "",
        };
      })
      .filter(Boolean) ?? [];

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>{locale === "dk" ? "Guides" : "Guides"}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85 }}>
          {locale === "dk"
            ? "Evergreen guides der gør Forago nyttig – og rankable."
            : "Evergreen guides that make Forago useful — and rankable."}
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((g) => (
          <Link
            key={g.slug}
            href={`/${locale}/guides/${g.slug}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{g.title}</div>
            <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.35 }}>
              {g.excerpt || (locale === "dk" ? "Tilføj excerpt i DB." : "Add excerpt in DB.")}
            </div>
          </Link>
        ))}
      </section>

      {items.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.8 }}>
          {locale === "dk" ? "Ingen publicerede guides endnu." : "No published guides yet."}
        </p>
      ) : null}
    </main>
  );
}