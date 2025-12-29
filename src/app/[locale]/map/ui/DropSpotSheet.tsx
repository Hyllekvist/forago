"use client"; 

import { useMemo, useState } from "react";
import styles from "./DropSpotSheet.module.css";

type Props = {
  locale: "dk" | "en";
  lat: number;
  lng: number;
  isBusy?: boolean;
  error?: string | null;

  isAuthed: boolean;
  onRequireAuth: (payload: { lat: number; lng: number; name: string; speciesSlug: string | null }) => void;

  onClose: () => void;
  onCreateAndLog: (args: { name: string; speciesSlug: string | null }) => void;
};

function fmt(n: number) {
  return Number(n).toFixed(5);
}

export function DropSpotSheet({
  locale,
  lat,
  lng,
  isBusy,
  error,
  isAuthed,
  onRequireAuth,
  onClose,
  onCreateAndLog,
}: Props) {
  const [name, setName] = useState("");
  const [speciesSlug, setSpeciesSlug] = useState("");

  const title = locale === "dk" ? "Log et fund her" : "Log a find here";
  const sub = useMemo(
    () =>
      locale === "dk"
        ? `Koordinater: ${fmt(lat)}, ${fmt(lng)}`
        : `Coordinates: ${fmt(lat)}, ${fmt(lng)}`,
    [locale, lat, lng]
  );

  const payload = useMemo(() => {
    const cleanName = name.trim() || (locale === "dk" ? "Nyt spot" : "New spot");
    const cleanSpecies = speciesSlug.trim() ? speciesSlug.trim().toLowerCase() : null;
    return { lat, lng, name: cleanName, speciesSlug: cleanSpecies };
  }, [name, speciesSlug, lat, lng, locale]);

  const cta = !isAuthed
    ? locale === "dk"
      ? "Log ind for at logge fund"
      : "Log in to log a find"
    : locale === "dk"
    ? isBusy
      ? "Logger…"
      : "Opret spot + log fund"
    : isBusy
    ? "Logging…"
    : "Create spot + log";

  return (
    <div className={styles.sheet} role="dialog" aria-label="Drop spot sheet">
      <div className={styles.head}>
        <div style={{ minWidth: 0 }}>
          <div className={styles.title}>{title}</div>
          <div className={styles.sub}>{sub}</div>
        </div>

        <button onClick={onClose} type="button" className={styles.close}>
          ✕
        </button>
      </div>

      <div className={styles.form}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={locale === "dk" ? "Navn (valgfrit) fx 'Bøgeskov ved stien'" : "Name (optional)"}
          className={styles.input}
        />

        <input
          value={speciesSlug}
          onChange={(e) => setSpeciesSlug(e.target.value)}
          placeholder={locale === "dk" ? "Art slug (valgfrit) fx 'kantarel'" : "Species slug (optional)"}
          className={styles.input}
        />

        <button
          disabled={!!isBusy}
          onClick={() => {
            if (!isAuthed) return onRequireAuth(payload);
            return onCreateAndLog({ name: payload.name, speciesSlug: payload.speciesSlug });
          }}
          type="button"
          className={styles.primary}
        >
          {cta}
        </button>

        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.note}>
            {locale === "dk"
              ? "Tip: Klik på kortet igen for at flytte punktet."
              : "Tip: Click the map again to move the drop point."}
          </div>
        )}
      </div>
    </div>
  );
}
