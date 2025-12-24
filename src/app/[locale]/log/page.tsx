// src/app/[locale]/log/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Log.module.css";

type Locale = "dk" | "en" | "se" | "de";

type PrivacyMode = "blur" | "private";

function titleFor(locale: Locale) {
  if (locale === "dk") return "Log fund";
  return "Log find";
}

function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function fmtDate(locale: Locale, d: Date) {
  // super-light, no i18n dependency
  if (locale === "dk") return "I dag";
  return "Today";
}

export default function LogPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const locale = (params.locale as Locale) ?? "dk";

  const now = useMemo(() => new Date(), []);
  const headerTitle = titleFor(locale);
  const headerSub = `${fmtDate(locale, now)} · ${fmtTime(now)}`;

  // MVP state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [species, setSpecies] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [privacy, setPrivacy] = useState<PrivacyMode>("blur");
  const [isSaving, setIsSaving] = useState(false);

  const canSave = true; // compose-first: always allow

  function onPickPhotoFake() {
    // MVP placeholder (no file picker yet)
    setPhotoUrl("https://placehold.co/800x600/png");
  }

  async function onSave() {
    if (!canSave) return;
    setIsSaving(true);

    // TODO (next phase): persist to Supabase
    // For now: simulate latency + go to success screen
    await new Promise((r) => setTimeout(r, 400));

    const qs = new URLSearchParams();
    qs.set("ok", "1");
    if (species.trim()) qs.set("s", species.trim());
    if (privacy) qs.set("p", privacy);
    router.push(`/${locale}/log?${qs.toString()}`);
  }

  const showSuccess = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("ok") === "1";
  const successSpecies = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("s") : null;

  if (showSuccess) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.successHero}>
            <h1 className={styles.h1}>{locale === "dk" ? "Fund logget 🌿" : "Find logged 🌿"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Du kan altid rette og dele senere."
                : "You can always edit and share later."}
            </p>

            <div className={styles.previewCard}>
              <div className={styles.previewLeft}>
                <div className={styles.previewThumb} aria-hidden="true" />
              </div>
              <div className={styles.previewRight}>
                <div className={styles.previewTitle}>
                  {successSpecies ? successSpecies : (locale === "dk" ? "Ukendt art" : "Unknown species")}
                </div>
                <div className={styles.previewMeta}>
                  <span className={styles.badge}>{locale === "dk" ? "Sted: sløret" : "Location: blurred"}</span>
                  <span className={styles.badge}>{locale === "dk" ? "Udkast" : "Draft"}</span>
                </div>
              </div>
            </div>

            <div className={styles.successActions}>
              <button className={styles.primaryBtn} type="button" onClick={() => alert("Share sheet næste step")}>
                {locale === "dk" ? "Del" : "Share"}
              </button>
              <button className={styles.ghostBtn} type="button" onClick={() => router.replace(`/${locale}/log`)}>
                {locale === "dk" ? "Log et fund mere" : "Log another"}
              </button>
            </div>

            <button className={styles.linkBtn} type="button" onClick={() => router.replace(`/${locale}/log`)}>
              {locale === "dk" ? "Tilbage" : "Back"}
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()} aria-label="Back">
            ←
          </button>
          <div className={styles.headerText}>
            <h1 className={styles.h1}>{headerTitle}</h1>
            <p className={styles.sub}>{headerSub}</p>
          </div>
        </header>

        {/* Cards */}
        <section className={styles.grid}>
          {/* Photo */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.kicker}>{locale === "dk" ? "Foto" : "Photo"}</div>
                <div className={styles.help}>
                  {locale === "dk" ? "Valgfrit — men hjælper andre med at lære." : "Optional — helps others learn."}
                </div>
              </div>
              <button className={styles.smallBtn} type="button" onClick={onPickPhotoFake}>
                {locale === "dk" ? "Tilføj" : "Add"}
              </button>
            </div>

            <div className={styles.photoBox}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.photo} src={photoUrl} alt="" />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <div className={styles.photoIcon} aria-hidden="true">⌁</div>
                  <div className={styles.photoText}>
                    {locale === "dk" ? "Ingen foto endnu" : "No photo yet"}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.cardRow}>
              <button className={styles.chipBtn} type="button" onClick={onPickPhotoFake}>
                {locale === "dk" ? "Tag et nyt" : "Take new"}
              </button>
              <button className={styles.chipBtn} type="button" onClick={onPickPhotoFake}>
                {locale === "dk" ? "Vælg fra bibliotek" : "Choose from library"}
              </button>
            </div>
          </div>

          {/* Species */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.kicker}>{locale === "dk" ? "Hvad fandt du?" : "What did you find?"}</div>
                <div className={styles.help}>
                  {locale === "dk"
                    ? "Du kan logge uden at kende arten."
                    : "You can log without knowing the species."}
                </div>
              </div>
            </div>

            <input
              className={styles.input}
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder={locale === "dk" ? "Søg art (valgfrit)" : "Search species (optional)"}
            />

            <div className={styles.cardRow}>
              <button className={styles.chipBtn} type="button" onClick={() => setSpecies(locale === "dk" ? "Jeg er ikke sikker" : "Not sure")}>
                {locale === "dk" ? "Jeg er ikke sikker" : "I’m not sure"}
              </button>
              <button className={styles.chipBtn} type="button" onClick={() => setSpecies("")}>
                {locale === "dk" ? "Ryd" : "Clear"}
              </button>
            </div>
          </div>

          {/* Location / privacy */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.kicker}>{locale === "dk" ? "Sted" : "Location"}</div>
                <div className={styles.help}>
                  {locale === "dk"
                    ? "Vi deler aldrig præcis position offentligt."
                    : "We never share precise location publicly."}
                </div>
              </div>
            </div>

            <div className={styles.locationRow}>
              <div className={styles.locationValue}>
                {privacy === "blur"
                  ? (locale === "dk" ? "Omkring dig (sløret)" : "Near you (blurred)")
                  : (locale === "dk" ? "Kun for mig" : "Only for me")}
              </div>
              <div className={styles.segment}>
                <button
                  type="button"
                  className={`${styles.segBtn} ${privacy === "blur" ? styles.segActive : ""}`}
                  onClick={() => setPrivacy("blur")}
                >
                  {locale === "dk" ? "Slør" : "Blur"}
                </button>
                <button
                  type="button"
                  className={`${styles.segBtn} ${privacy === "private" ? styles.segActive : ""}`}
                  onClick={() => setPrivacy("private")}
                >
                  {locale === "dk" ? "Privat" : "Private"}
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.kicker}>{locale === "dk" ? "Noter" : "Notes"}</div>
                <div className={styles.help}>
                  {locale === "dk" ? "Korte observationer hjælper mest." : "Short observations help most."}
                </div>
              </div>
            </div>

            <textarea
              className={styles.textarea}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={locale === "dk" ? "Fx “i mos ved gran”, “duft af abrikos”" : `E.g. "moss near spruce", "apricot smell"`}
              rows={4}
            />
          </div>
        </section>

        {/* Sticky CTA */}
        <div className={styles.ctaBar}>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (locale === "dk" ? "Gemmer…" : "Saving…") : (locale === "dk" ? "Gem fund" : "Save find")}
          </button>

          <button
            className={styles.ghostBtn}
            type="button"
            onClick={() => alert("Detaljer-skærm næste step")}
          >
            {locale === "dk" ? "Tilføj detaljer" : "Add details"}
          </button>

          <div className={styles.ctaHint}>
            {locale === "dk" ? "Du kan tilføje detaljer bagefter." : "You can add details later."}
          </div>
        </div>
      </div>
    </main>
  );
}