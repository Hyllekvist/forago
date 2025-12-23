import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return { title: "Forago" };

  const title = localeParam === "dk" ? "Guides — Forago" : "Guides — Forago";
  const description =
    localeParam === "dk"
      ? "Sikker sankning: identifikation, forvekslinger, udstyr og første ture."
      : "Safe foraging: identification, look-alikes, gear, and first trips.";

  return {
    title,
    description,
    alternates: { canonical: `/${localeParam}/guides` },
  };
}

export default async function GuidesPage({ params }: { params: { locale: string } }) {
  const localeParam = params.locale;
  if (!isLocale(localeParam)) return notFound();
  const locale = localeParam;

  // Start som “editorial hub” (evergreen). Senere kan vi DB’e guides.
  const guides =
    locale === "dk"
      ? [
          { slug: "safety-basics", title: "Sikkerhed først: 10 regler", desc: "Den hurtigste måde at undgå dumme fejl." },
          { slug: "identification", title: "Identifikation: sådan tænker du", desc: "Kendetegn, habitat og sæson — i den rækkefølge." },
          { slug: "lookalikes", title: "Forvekslinger (og hvorfor de sker)", desc: "Når naturen prøver at troll’e dig." },
          { slug: "first-trip", title: "Din første sanketur", desc: "En enkel rute: hvad du leder efter, og hvad du ignorerer." },
          { slug: "gear", title: "Udstyr: det du faktisk bruger", desc: "Kniv, kurv, poser, bog — ingen grej-hype." },
          { slug: "ethics", title: "Etik: pluk med omtanke", desc: "Bæredygtighed uden moralshow." },
        ]
      : [
          { slug: "safety-basics", title: "Safety first: 10 rules", desc: "The fastest way to avoid dumb mistakes." },
          { slug: "identification", title: "Identification: how to think", desc: "Features, habitat, season — in that order." },
          { slug: "lookalikes", title: "Look-alikes (and why it happens)", desc: "Nature loves to trick you." },
          { slug: "first-trip", title: "Your first forage trip", desc: "A simple route: what to seek, what to ignore." },
          { slug: "gear", title: "Gear: what you actually use", desc: "Knife, basket, bags, a field guide — no hype." },
          { slug: "ethics", title: "Ethics: forage responsibly", desc: "Sustainability without virtue signaling." },
        ];

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
        {guides.map((g) => (
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
            <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.35 }}>{g.desc}</div>
          </Link>
        ))}
      </section>

      <div style={{ marginTop: 18, opacity: 0.85 }}>
        <p style={{ margin: 0 }}>
          {locale === "dk" ? "Start her:" : "Start here:"}{" "}
          <Link href={`/${locale}/species`} style={{ textDecoration: "none" }}>
            {locale === "dk" ? "Arter" : "Species"}
          </Link>{" "}
          ·{" "}
          <Link href={`/${locale}/season`} style={{ textDecoration: "none" }}>
            {locale === "dk" ? "Sæson" : "Season"}
          </Link>
        </p>
      </div>
    </main>
  );
}