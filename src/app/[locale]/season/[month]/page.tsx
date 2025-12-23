import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

const MONTH_SLUGS = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

function monthFromSlug(slug: string): number | null {
  const idx = MONTH_SLUGS.indexOf(slug as any);
  return idx > 0 ? idx : null;
}

function monthName(locale: Locale, m: number) {
  const dk = ["", "januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const en = ["", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const arr = locale === "dk" ? dk : en;
  return arr[m] ?? String(m);
}

export async function generateStaticParams() {
  // Prebuild month pages for each locale (good for SEO)
  const out: { locale: string; month: string }[] = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (let m = 1; m <= 12; m++) {
      out.push({ locale, month: MONTH_SLUGS[m] });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; month: string };
}) {
  const { locale: locParam, month: monthSlug } = params;
  if (!isLocale(locParam)) return { title: "Forago" };

  const m = monthFromSlug(monthSlug);
  if (!m) return { title: "Forago" };

  const title =
    locParam === "dk"
      ? `Hvad kan man sanke i ${monthName(locParam, m)}? — Forago`
      : `What to forage in ${monthName(locParam, m)} — Forago`;

  const description =
    locParam === "dk"
      ? `Sæsonoversigt for ${monthName(locParam, m)} i Danmark. Identifikation, forvekslinger og brug.`
      : `Season overview for ${monthName(locParam, m)} in Denmark. Identification, look-alikes and use.`;

  return {
    title,
    description,
    alternates: { canonical: `/${locParam}/season/${monthSlug}` },
  };
}

export default async function SeasonMonthPage({
  params,
}: {
  params: { locale: string; month: string };
}) {
  const { locale: locParam, month: monthSlug } = params;
  if (!isLocale(locParam)) return notFound();

  const m = monthFromSlug(monthSlug);
  if (!m) return notFound();

  const locale = locParam;
  const country = locale; // dk -> dk
  const supabase = supabaseServer();

  const { data: rows, error } = await supabase
    .from("seasonality")
    .select("species_id, month_from, month_to, confidence")
    .eq("country", country)
    .eq("region", "");

  if (error) throw error;

  const inMonth = (rows ?? []).filter((r) => {
    const a = r.month_from as number;
    const b = r.month_to as number;
    if (a <= b) return m >= a && m <= b;
    return m >= a || m <= b;
  });

  const ids = inMonth.map((r) => r.species_id as string);

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
      const season = inMonth.find((x) => x.species_id === s.id);
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

  const title = locale === "dk" ? `Sæson: ${monthName(locale, m)}` : `Season: ${monthName(locale, m)}`;
  const back = `/${locale}/season`;

  // prev/next month
  const prev = m === 1 ? 12 : m - 1;
  const next = m === 12 ? 1 : m + 1;

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <p style={{ margin: 0 }}>
          <Link href={back} style={{ textDecoration: "none" }}>
            ← {locale === "dk" ? "Tilbage" : "Back"}
          </Link>
        </p>
        <h1 style={{ margin: "10px 0 0" }}>{title}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85 }}>
          {locale === "dk"
            ? "Sæsonoversigt uden spotdeling."
            : "Season overview without spot sharing."}
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Link
            href={`/${locale}/season/${MONTH_SLUGS[prev]}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "8px 10px",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            ← {monthName(locale, prev)}
          </Link>
          <Link
            href={`/${locale}/season/${MONTH_SLUGS[next]}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "8px 10px",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {monthName(locale, next)} →
          </Link>
        </div>
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
            ? "Ingen arter sat i sæson for denne måned endnu (tilføj i seasonality)."
            : "No species marked in season for this month yet (add seasonality rows)."}
        </p>
      ) : null}
    </main>
  );
}