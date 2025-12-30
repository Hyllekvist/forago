import Link from "next/link";
import styles from "./SpeciesVisualId.module.css";

type Locale = "dk" | "en";

type Feature = {
  icon?: string;
  title: string;
  text: string;
};

type Callout = {
  key: string;     // unik id, fx "cap", "ridges"
  x: number;       // 0-100
  y: number;       // 0-100
  label: string;   // kort (max 40-50 tegn)
  text?: string;   // valgfri 1-2 linjer ekstra
};

type Props = {
  locale: Locale;

  speciesName: string;
  scientificName?: string | null;

  monthFrom?: number | null;
  monthTo?: number | null;
  confidence?: number | null;
  inSeasonNow?: boolean;

  identificationText?: string | null;
  lookalikesText?: string | null;
  safetyText?: string | null;

  features?: Feature[];

  seasonHref?: string;
  lookalikesHref?: string;
  safetyHref?: string;

  callouts?: Callout[];
};

const MONTHS_EN = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_DK = ["", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function monthLabel(locale: Locale, m: number) {
  return (locale === "dk" ? MONTHS_DK : MONTHS_EN)[m] ?? String(m);
}
function isInSeason(month: number, from: number, to: number) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}
function currentMonthUTC() {
  return new Date().getUTCMonth() + 1;
}
function clampInt(n: any, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(min, Math.min(max, Math.round(v)));
}
function firstLine(text?: string | null) {
  const t = (text ?? "").trim();
  if (!t) return "";
  return t.split("\n").find((x) => x.trim())?.trim() ?? "";
}

export function SpeciesVisualId(props: Props) {
  const {
    locale,
    speciesName,
    scientificName,
    monthFrom,
    monthTo,
    confidence,
    inSeasonNow,
    identificationText,
    lookalikesText,
    safetyText,
    features,
    seasonHref,
    lookalikesHref,
    safetyHref,
    callouts,
  } = props;

  const from = clampInt(monthFrom, 1, 12);
  const to = clampInt(monthTo, 1, 12);
  const conf = clampInt(confidence, 0, 100);
  const nowM = currentMonthUTC();
  const hasSeason = !!from && !!to;

  const defaultFeatures: Feature[] = [
    { icon: "🍄", title: locale === "dk" ? "Hat" : "Cap", text: locale === "dk" ? "Bølget kant, tragtet form" : "Wavy edge, funnel shape" },
    { icon: "🔻", title: locale === "dk" ? "Underside" : "Underside", text: locale === "dk" ? "Ribber (false gills) – ikke lameller" : "Ridges (false gills) – not gills" },
    { icon: "🎨", title: locale === "dk" ? "Farve" : "Color", text: locale === "dk" ? "Gul til gul-orange" : "Yellow to yellow-orange" },
    { icon: "👃", title: locale === "dk" ? "Duft" : "Smell", text: locale === "dk" ? "Frugtig / mild" : "Fruity / mild" },
    { icon: "🤏", title: locale === "dk" ? "Konsistens" : "Texture", text: locale === "dk" ? "Fast kød" : "Firm flesh" },
  ];

  const feats = (features?.length ? features : defaultFeatures).slice(0, 6);

  const lookLine =
    firstLine(lookalikesText) ||
    (locale === "dk" ? "Tjek look-alikes før du spiser noget." : "Check look-alikes before eating.");

  const safetyLine = firstLine(safetyText);

  const defaultCallouts: Callout[] = [
    { key: "cap", x: 28, y: 44, label: locale === "dk" ? "Bølget hatkant" : "Wavy cap edge" },
    { key: "funnel", x: 72, y: 44, label: locale === "dk" ? "Tragtet form" : "Funnel shape" },
    { key: "ridges", x: 64, y: 70, label: locale === "dk" ? "Ribber, ikke lameller" : "Ridges, not gills" },
    { key: "flesh", x: 40, y: 78, label: locale === "dk" ? "Fast kød" : "Firm flesh" },
  ];

  const cs = (callouts?.length ? callouts : defaultCallouts).slice(0, 6);

  return (
    <section className={styles.wrap} aria-label={locale === "dk" ? "Visuel identifikation" : "Visual identification"}>
      <header className={styles.head}>
        <div className={styles.leftHead}>
          <div className={styles.kicker}>{locale === "dk" ? "VISUAL ID" : "VISUAL ID"}</div>
          <h2 className={styles.h2}>{locale === "dk" ? "Identifikation i felten" : "Field identification"}</h2>
          <p className={styles.sub}>
            {locale === "dk"
              ? "Hurtige cues + sæson. Privatliv først — ingen spots."
              : "Quick cues + season. Privacy-first — no spots."}
          </p>
        </div>

        <div className={styles.metaCard}>
          <div className={styles.metaTitle}>{speciesName}</div>
          {scientificName ? (
            <div className={styles.metaSub}>
              <em>{scientificName}</em>
            </div>
          ) : null}

          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${inSeasonNow ? styles.badgeGood : styles.badgeNeutral}`}>
              {inSeasonNow ? (locale === "dk" ? "I sæson nu" : "In season now") : (locale === "dk" ? "Ikke i sæson" : "Out of season")}
              {conf !== null ? ` · ${conf}%` : ""}
            </span>

            {seasonHref ? (
              <Link className={styles.badgeLink} href={seasonHref}>
                {locale === "dk" ? "Sæson →" : "Season →"}
              </Link>
            ) : null}
          </div>

          {hasSeason ? (
            <div className={styles.metaFine}>
              {locale === "dk" ? "Typisk:" : "Typical:"}{" "}
              <strong>{monthLabel(locale, from!)}</strong> – <strong>{monthLabel(locale, to!)}</strong>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.grid}>
        {/* Diagram */}
        <div className={styles.diagramCard}>
          <div className={styles.diagramTop}>
            <div className={styles.diagramTitle}>{locale === "dk" ? "Hurtigt blik" : "Quick glance"}</div>
            <div className={styles.diagramHint}>{locale === "dk" ? "Se markører + listen" : "See markers + list"}</div>
          </div>

          <div className={styles.diagramStage}>
            {/* SVG med markører (ingen tekst labels ovenpå!) */}
            <svg viewBox="0 0 480 300" className={styles.svg} aria-hidden="true">
              <defs>
                <radialGradient id="bg" cx="40%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="480" height="300" fill="url(#bg)" />

              {/* cap */}
              <path
                d="M120 140 C160 70, 320 70, 360 140 C330 155, 150 155, 120 140 Z"
                fill="currentColor"
                opacity="0.14"
              />
              <path
                d="M130 138 C168 90, 312 90, 350 138"
                stroke="currentColor"
                strokeOpacity="0.24"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />

              {/* stem */}
              <path
                d="M210 145 C220 200, 200 245, 180 270 C220 270, 260 270, 300 270 C280 245, 260 200, 270 145 Z"
                fill="currentColor"
                opacity="0.10"
              />

              {/* ridges */}
              <path d="M195 170 C220 190, 235 210, 235 245" stroke="currentColor" strokeOpacity="0.22" strokeWidth="3" fill="none" />
              <path d="M225 170 C245 190, 260 210, 262 245" stroke="currentColor" strokeOpacity="0.20" strokeWidth="3" fill="none" />
              <path d="M255 170 C275 190, 290 210, 292 245" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" fill="none" />

              {/* ground */}
              <path d="M80 280 C140 255, 340 255, 400 280" stroke="currentColor" strokeOpacity="0.14" strokeWidth="3" fill="none" />

              {/* Markers 1..n */}
              {cs.map((c, idx) => {
                const cx = (c.x / 100) * 480;
                const cy = (c.y / 100) * 300;
                const n = idx + 1;
                return (
                  <g key={c.key} data-key={c.key}>
                    <circle cx={cx} cy={cy} r="12" fill="currentColor" opacity="0.16" />
                    <circle cx={cx} cy={cy} r="10" className={styles.marker} />
                    <text x={cx} y={cy + 4} textAnchor="middle" className={styles.markerText}>
                      {n}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Callout list (stabil mobil) */}
          <ol className={styles.calloutList}>
            {cs.map((c, idx) => (
              <li key={c.key} className={styles.calloutItem}>
                <span className={styles.calloutNum}>{idx + 1}</span>
                <div className={styles.calloutBody}>
                  <div className={styles.calloutLabel}>{c.label}</div>
                  {c.text ? <div className={styles.calloutText}>{c.text}</div> : null}
                </div>
              </li>
            ))}
          </ol>

          {identificationText ? (
            <div className={styles.notes}>
              <div className={styles.notesTitle}>{locale === "dk" ? "Noter" : "Notes"}</div>
              <div className={styles.notesText}>{identificationText}</div>
            </div>
          ) : null}
        </div>

        {/* Side column */}
        <aside className={styles.side}>
          {/* Season */}
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>{locale === "dk" ? "Sæson (DK)" : "Season (DK)"}</div>

            <div className={styles.seasonBar} role="img" aria-label={locale === "dk" ? "Sæson bar" : "Season bar"}>
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                const active = hasSeason ? isInSeason(m, from!, to!) : false;
                const isNow = m === nowM;
                return (
                  <div
                    key={m}
                    className={`${styles.month} ${active ? styles.monthOn : ""} ${isNow ? styles.monthNow : ""}`}
                    title={`${monthLabel(locale, m)}${active ? " • in season" : ""}${isNow ? " • now" : ""}`}
                  >
                    <span className={styles.monthTxt}>{monthLabel(locale, m)}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.seasonMeta}>
              {hasSeason ? (
                <span className={styles.seasonLine}>
                  {locale === "dk" ? "Typisk:" : "Typical:"}{" "}
                  <strong>{monthLabel(locale, from!)}</strong> – <strong>{monthLabel(locale, to!)}</strong>
                </span>
              ) : (
                <span className={styles.seasonLineMuted}>
                  {locale === "dk" ? "Sæson ikke sat endnu." : "Season not set yet."}
                </span>
              )}
            </div>
          </div>

          {/* Features */}
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>{locale === "dk" ? "Quick cues" : "Quick cues"}</div>
            <div className={styles.features}>
              {feats.map((f, idx) => (
                <div key={`${f.title}-${idx}`} className={styles.feature}>
                  {f.icon ? <div className={styles.fIcon} aria-hidden="true">{f.icon}</div> : null}
                  <div className={styles.fBody}>
                    <div className={styles.fTitle}>{f.title}</div>
                    <div className={styles.fText}>{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lookalikes + safety */}
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>{locale === "dk" ? "Look-alikes + safety" : "Look-alikes + safety"}</div>

            <div className={styles.alertRow}>
              <span className={styles.alertDot} aria-hidden="true" />
              <div className={styles.alertText}>{lookLine}</div>
            </div>

            {safetyLine ? (
              <div className={`${styles.alertRow} ${styles.alertWarn}`}>
                <span className={styles.alertDot} aria-hidden="true" />
                <div className={styles.alertText}>{safetyLine}</div>
              </div>
            ) : null}

            <div className={styles.linksRow}>
              {lookalikesHref ? (
                <Link className={styles.smallLink} href={lookalikesHref}>
                  {locale === "dk" ? "Se look-alikes →" : "See look-alikes →"}
                </Link>
              ) : null}
              {safetyHref ? (
                <Link className={styles.smallLink} href={safetyHref}>
                  {locale === "dk" ? "Sikkerhed →" : "Safety →"}
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
