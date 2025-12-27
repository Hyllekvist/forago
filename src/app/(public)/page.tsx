import Link from "next/link";
import Image from "next/image";
import styles from "./PublicHome.module.css";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600; // 1 time cache

type SeasonNowRow = {
  species_id: string;
  slug: string | null;
  common_name: string | null;
  scientific_name?: string | null;
  primary_group: string | null;
  safety_flag?: string | null; // fx "lookalikes" | "toxic_lookalike" | null
  updated_at?: string | null;  // timestamptz
};

function safeLocale(v: unknown): "dk" | "en" | "se" | "de" {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function t(locale: string, dk: string, en: string) {
  return locale === "dk" ? dk : en;
}

function emojiForGroup(group?: string | null) {
  const g = (group ?? "").toLowerCase();
  if (g.includes("mush")) return "🍄";
  if (g.includes("plant") || g.includes("herb")) return "🌿";
  if (g.includes("berry") || g.includes("fruit")) return "🫐";
  if (g.includes("nut")) return "🌰";
  return "📍";
}

function relTime(iso?: string | null) {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;

  const now = Date.now();
  const diffMs = Math.max(0, now - ts);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "i dag";
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dage siden`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "for 1 uge siden";
  if (weeks < 5) return `for ${weeks} uger siden`;
  const months = Math.floor(days / 30);
  if (months === 1) return "for 1 måned siden";
  return `for ${months} måneder siden`;
}

function labelRow(locale: string, r: SeasonNowRow) {
  const name = r.common_name ?? (r.slug ? `#${r.slug}` : null);
  return name ?? t(locale, "Ukendt art", "Unknown species");
}

function safetyPill(locale: string, safety_flag?: string | null) {
  if (!safety_flag) return null;
  const f = safety_flag.toLowerCase();
  if (f.includes("toxic")) return t(locale, "Giftig forveksling", "Toxic look-alike");
  if (f.includes("look")) return t(locale, "Forveksling", "Look-alike");
  return t(locale, "Sikkerhed", "Safety");
}

async function fetchSeasonNow(args: {
  country: string;
  month: number;
  locale: "dk" | "en" | "se" | "de";
  limit: number;
}) {
  const supabase = await supabaseServer();

  // forventet RPC: public_season_now(p_country, p_month, p_limit, p_locale)
  const { data, error } = await supabase.rpc("public_season_now", {
    p_country: args.country,
    p_month: args.month,
    p_limit: args.limit,
    p_locale: args.locale,
  });

  if (error) return { rows: [] as SeasonNowRow[], error: error.message };
  return { rows: (data ?? []) as SeasonNowRow[], error: null as string | null };
}

export default async function PublicHome({
  params,
}: {
  params?: { locale?: string };
}) {
  // Public home er “før login” → default DK, men vi giver også EN.
  const locale = safeLocale(params?.locale);
  const month = new Date().getMonth() + 1;

  const { rows: seasonRows, error: seasonErr } = await fetchSeasonNow({
    country: "DK",
    month,
    locale,
    limit: 6,
  });

  const updatedAt =
    seasonRows.find((r) => r.updated_at)?.updated_at ??
    null;

  const updatedLabel = relTime(updatedAt);

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="forago-title">
        {/* HERO */}
        <header className={styles.hero}>
          <div className={styles.brandRow}>
            <span className={styles.brandIconWrap} aria-hidden="true">
              <Image
                src="/forago-mushroom.svg"
                alt=""
                width={22}
                height={22}
                className={styles.brandIcon}
                priority
              />
            </span>

            <div className={styles.brandText}>
              <h1 id="forago-title" className={styles.h1}>Forago</h1>
              <p className={styles.tagline}>
                {t(
                  locale,
                  "Sæson først · Sikkerhed først · Privat kort",
                  "Season-first · Safety-first · Privacy-first"
                )}
              </p>
            </div>
          </div>

          <div className={styles.heroCard}>
            <h2 className={styles.h2}>
              {t(
                locale,
                "Find hvad der er i sæson — uden at afsløre hotspots.",
                "Find what’s in season — without exposing hotspots."
              )}
            </h2>

            <p className={styles.lede}>
              {t(
                locale,
                "Guides mod forvekslinger. Privat map (celler, ikke pins). Log dine fund — og få svar på: “Har arten været her før?”",
                "Guides for look-alikes. Private map (cells, not pins). Log finds — and answer: “Has it been here before?”"
              )}
            </p>

            <div className={styles.ctas}>
              <Link className={styles.primary} href="/dk">
                {t(locale, "Start i Danmark", "Start in Denmark")}
              </Link>
              <Link className={styles.secondary} href="/en">
                {t(locale, "English", "English")}
              </Link>
            </div>

            <div className={styles.microProof}>
              <span className={styles.microDot} aria-hidden>●</span>
              {t(
                locale,
                "Spot intelligence: sidste observation, historik, stabilitet over år.",
                "Spot intelligence: last seen, history, stability over years."
              )}
            </div>
          </div>
        </header>

        {/* LIVE STRIP */}
        <section className={styles.live} aria-label="Live season">
          <div className={styles.liveTop}>
            <div>
              <div className={styles.liveKicker}>
                {t(locale, "I sæson nu", "In season now")}
              </div>
              <div className={styles.liveSub}>
                {updatedLabel
                  ? t(locale, `Opdateret ${updatedLabel}`, `Updated ${updatedLabel}`)
                  : t(locale, "Opdateret løbende", "Updated regularly")}
              </div>
            </div>

            <div className={styles.liveHint}>
              {t(locale, "DK · Privat map", "DK · Private map")}
            </div>
          </div>

          {seasonRows.length ? (
            <div className={styles.liveRow}>
              {seasonRows.slice(0, 6).map((r) => {
                const name = labelRow(locale, r);
                const pill = safetyPill(locale, r.safety_flag);
                return (
                  <Link
                    key={r.species_id}
                    className={styles.liveCard}
                    href={`/dk/species/${encodeURIComponent(r.slug ?? r.species_id)}`}
                  >
                    <div className={styles.liveEmoji} aria-hidden>
                      {emojiForGroup(r.primary_group)}
                    </div>
                    <div className={styles.liveMain}>
                      <div className={styles.liveName}>{name}</div>
                      <div className={styles.liveMeta}>
                        {r.primary_group ?? "—"}
                        {pill ? <span className={styles.livePill}>{pill}</span> : null}
                      </div>
                    </div>
                    <div className={styles.liveGo} aria-hidden>➜</div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.liveEmpty}>
              <div className={styles.liveEmptyTitle}>
                {t(locale, "Live sæson-data kommer snart", "Live season data coming soon")}
              </div>
              <div className={styles.liveEmptyBody}>
                {seasonErr
                  ? t(locale, `Teknisk: ${seasonErr}`, `Tech: ${seasonErr}`)
                  : t(
                      locale,
                      "Indtil da: start i Danmark og brug Sæson + Guides.",
                      "In the meantime: start in Denmark and use Season + Guides."
                    )}
              </div>
            </div>
          )}
        </section>

        {/* VALUE GRID */}
        <section className={styles.grid} aria-label="Why Forago">
          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>SEASON</span>
              <span className={styles.metaRight}>
                {t(locale, "Hvad der faktisk findes", "What actually exists")}
              </span>
            </div>
            <h3 className={styles.cardTitle}>
              {t(locale, "I sæson, ikke i hype", "In season, not in hype")}
            </h3>
            <p className={styles.cardText}>
              {t(
                locale,
                "Skåret til: hvad du realistisk kan finde lige nu — med kvalitetssignal.",
                "Tight: what you can realistically find now — with quality signal."
              )}
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>SAFETY</span>
              <span className={styles.metaRight}>
                {t(locale, "Forvekslinger + checks", "Look-alikes + checks")}
              </span>
            </div>
            <h3 className={styles.cardTitle}>
              {t(locale, "Bygget til “don’t die”", "Built for “don’t die”")}
            </h3>
            <p className={styles.cardText}>
              {t(
                locale,
                "Kendetegn og advarsler der er til at handle på. Ikke romaner.",
                "Traits and warnings you can act on. Not essays."
              )}
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.kicker}>PRIVACY</span>
              <span className={styles.metaRight}>
                {t(locale, "Natur først", "Nature first")}
              </span>
            </div>
            <h3 className={styles.cardTitle}>
              {t(locale, "Kort uden hotspots", "Maps without hotspots")}
            </h3>
            <p className={styles.cardText}>
              {t(
                locale,
                "Celler og aggregeret aktivitet — så du kan logge uden at udlevere steder.",
                "Cells + aggregated activity — log without exposing locations."
              )}
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className={styles.how} aria-label="How it works">
          <div className={styles.howTitle}>
            {t(locale, "Sådan bruger du Forago", "How you use Forago")}
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepMain}>
                <div className={styles.stepHead}>{t(locale, "Tjek sæson", "Check season")}</div>
                <div className={styles.stepText}>{t(locale, "Se hvad der er realistisk nu.", "See what’s realistic now.")}</div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepMain}>
                <div className={styles.stepHead}>{t(locale, "Lær kendetegn", "Learn traits")}</div>
                <div className={styles.stepText}>{t(locale, "Fokus på forvekslinger.", "Focus on look-alikes.")}</div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div className={styles.stepMain}>
                <div className={styles.stepHead}>{t(locale, "Log privat + intelligence", "Log privately + intelligence")}</div>
                <div className={styles.stepText}>{t(locale, "Sidst set, historik, stabilitet.", "Last seen, history, stability.")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK LINKS (secondary) */}
        <nav className={styles.quickNav} aria-label="Quick links">
          <Link className={styles.pill} href="/dk/season">{t(locale, "Sæson", "Season")}</Link>
          <Link className={styles.pill} href="/dk/species">{t(locale, "Arter", "Species")}</Link>
          <Link className={styles.pill} href="/dk/map">{t(locale, "Kort", "Map")}</Link>
          <Link className={styles.pill} href="/dk/feed">{t(locale, "Community", "Community")}</Link>
        </nav>

        <footer className={styles.foot}>
          <p className={styles.footNote}>
            {t(locale, "Forago er lavet til sankere — ikke influencers.", "Forago is for foragers — not influencers.")}
          </p>
        </footer>
      </section>
    </main>
  );
}
