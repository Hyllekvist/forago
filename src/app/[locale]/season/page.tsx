import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function monthName(locale: Locale, m: number) {
  const dk = ["", "januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const en = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const arr = locale === "dk" ? dk : en;
  return arr[m] ?? String(m);
}

function monthSlug(locale: Locale, m: number) {
  // keep URL stable and English slugs (good for international)
  const slugs = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  return slugs[m] ?? String(m);
}

function currentMonthCopenhagen() {
  // Running on server: use UTC and accept small drift. (Good enough for now)
  const now = new Date();
  return now.getUTCMonth() + 1; // 1-12
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };
  const locale = localeParam;

  const title = locale === "dk" ? "Sæson nu — Forago" : "In season now — Forago";
  const description =
    locale === "dk"
      ? "Se hvad der er i sæson lige nu (uden at udlevere spots)."
      : "See what’s in season right now (privacy-first).";

  return {
    title,
    description,
    alternates: { canonical: `/${locale}/season` },
  };
}

export default async function SeasonNowPage({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  const month = currentMonthCopenhagen();
  const country = locale; // dk -> dk

const supabase = await supabaseServer();

  // Get seasonality rows for current month (national = region = '')
  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const inSeason = (rows ?? []).filter((r) => {
    const a = r.month_from as number;
    const b = r.month_to as number;
    if (a <= b) return month >= a && month <= b;
    // wrap-around season (e.g. Nov->Feb)
    return month >= a || month <= b;
  });

  const ids = inSeason.map((r) => r.species_id as string);

  const { data: species } = ids.length
    ? await supabase.from("species").select("id, slug, primary_group, scientific_name").in("id", ids)
    : { data: [] as any[] };

  const { data: tr } = ids.length
    ? await supabase
        .from("species_translations")
        .select("species_id, common_name, short_description")
        .eq("locale", locale)
        .in("species_id", ids)
    : { data: [] as any[] };

  const trMap = new Map((tr ?? []).map((t) => [t.species_id as string, t]));

  const items = (species ?? [])
    .map((s) => {
      const t = trMap.get(s.id);
      const season = inSeason.find((x) => x.species_id === s.id);
      return {
        id: s.id as string,
        slug: s.slug as string,
        group: (s.primary_group as string) || "plant",
        scientific: (s.scientific_name as string) || "",
        name: (t?.common_name as string) || s.slug,
        desc: (t?.short_description as string) || "",
        confidence: (season?.confidence as number) ?? 0,
      };
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const title = locale === "dk" ? "I sæson nu" : "In season now";
  const sub =
    locale === "dk"
      ? `Måned: ${monthName(locale, month)} · Privatliv først (ingen spots).`
      : `Month: ${monthName(locale, month)} · Privacy-first (no spots).`;

  const monthLink = `/${locale}/season/${monthSlug(locale, month)}`;

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85 }}>{sub}</p>
        <p style={{ margin: "10px 0 0" }}>
          <Link href={monthLink} style={{ textDecoration: "none" }}>
            {locale === "dk" ? "Se hele måneden →" : "See full month →"}
          </Link>
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/species/${s.slug}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.name}</div>
            <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 8 }}>
              {s.scientific ? <em>{s.scientific}</em> : <span>{s.slug}</span>}
              {" · "}
              <span>{s.group}</span>
              {" · "}
              <span>{s.confidence}%</span>
            </div>
            <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.35 }}>
              {s.desc || (locale === "dk" ? "Tilføj beskrivelse i DB." : "Add description in DB.")}
            </div>
          </Link>
        ))}
      </section>

      {items.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.8 }}>
          {locale === "dk"
            ? "Ingen arter markeret i sæson for denne måned endnu (tilføj i seasonality)."
            : "No species marked in season for this month yet (add seasonality rows)."}
        </p>
      ) : null}
    </main>
  );
}