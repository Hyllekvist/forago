"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./LogFindModal.module.css";
import type { Spot } from "../LeafletMap";

type Props = {
  open: boolean;
  spot: Spot | null;
  onClose: () => void;

  // returner form-data til MapClient, som laver fetch
  onSubmit: (payload: {
    species_slug: string | null;
    observed_at: string;
    visibility: "private" | "public";
    notes: string | null;
    country: string | null;
    geo_precision_km: number | null;
  }) => void;

  submitting?: boolean;
  error?: string | null;
};

function isoLocalNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function LogFindModal({ open, spot, onClose, onSubmit, submitting, error }: Props) {
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [observedLocal, setObservedLocal] = useState<string>(isoLocalNow());
  const [precision, setPrecision] = useState<number>(1);
  const [country, setCountry] = useState<string>("DK");

  // reset når vi åbner på nyt spot
  useEffect(() => {
    if (!open) return;
    setNotes("");
    setVisibility("private");
    setObservedLocal(isoLocalNow());
    setPrecision(1);
    setCountry("DK");
  }, [open, spot?.id]);

  const title = useMemo(() => {
    if (!spot) return "Log fund";
    return spot.title ? `Log: ${spot.title}` : "Log fund";
  }, [spot]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Log fund">
      <div className={styles.sheet}>
        <div className={styles.top}>
          <div className={styles.titleWrap}>
            <div className={styles.kicker}>Log fund</div>
            <div className={styles.title}>{title}</div>
          </div>

          <button className={styles.close} onClick={onClose} type="button" disabled={!!submitting}>
            ✕
          </button>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Tidspunkt</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={observedLocal}
            onChange={(e) => setObservedLocal(e.target.value)}
            disabled={!!submitting}
          />
          <div className={styles.help}>Vi gemmer som ISO-tidspunkt.</div>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Synlighed</label>
          <div className={styles.seg}>
            <button
              className={`${styles.segBtn} ${visibility === "private" ? styles.segActive : ""}`}
              onClick={() => setVisibility("private")}
              type="button"
              disabled={!!submitting}
            >
              Privat
            </button>
            <button
              className={`${styles.segBtn} ${visibility === "public" ? styles.segActive : ""}`}
              onClick={() => setVisibility("public")}
              type="button"
              disabled={!!submitting}
            >
              Offentlig
            </button>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.row}>
            <label className={styles.label}>Land</label>
            <input
              className={styles.input}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!!submitting}
              placeholder="DK"
            />
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Præcision (km)</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={0.5}
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              disabled={!!submitting}
            />
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Noter</label>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Fx: fundet ved stien, under gran..."
            disabled={!!submitting}
          />
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <button className={styles.ghost} onClick={onClose} type="button" disabled={!!submitting}>
            Annuller
          </button>
          <button
            className={styles.primary}
            onClick={() => {
              if (!spot) return;
              const iso = new Date(observedLocal).toISOString();
              onSubmit({
                species_slug: spot.species_slug ?? null,
                observed_at: iso,
                visibility,
                notes: notes.trim() ? notes.trim() : null,
                country: country.trim() ? country.trim() : null,
                geo_precision_km: Number.isFinite(precision) ? precision : null,
              });
            }}
            type="button"
            disabled={!!submitting || !spot}
          >
            {submitting ? "Logger…" : "Log fund"}
          </button>
        </div>
      </div>
    </div>
  );
}