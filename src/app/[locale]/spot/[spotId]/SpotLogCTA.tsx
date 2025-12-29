"use client"; 

import { useState } from "react";
import styles from "./SpotLogCTA.module.css";

type Props = {
  spotId: string;
  speciesSlug?: string | null;
};

export default function SpotLogCTA({ spotId, speciesSlug }: Props) {
  const [isLogging, setIsLogging] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLog() {
    if (isLogging) return;

    try {
      setIsLogging(true);
      setErr(null);
      setOk(false);

      const res = await fetch("/api/finds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: String(spotId),
          species_slug: speciesSlug ?? null,
          observed_at: new Date().toISOString(),
          visibility: "public_aggregate",
          country: "DK",
          geo_precision_km: 1,
          photo_urls: [],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Kunne ikke logge fund");

      setOk(true);
      window.setTimeout(() => setOk(false), 1400);
    } catch (e: any) {
      setErr(e?.message ?? "Ukendt fejl");
      window.setTimeout(() => setErr(null), 3500);
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div className={styles.card} aria-label="Log fund CTA">
      <div className={styles.left}>
        <div className={styles.title}>Log et fund her</div>
        <div className={styles.sub}>
          {speciesSlug ? `For #${speciesSlug}` : "Vælg art senere (stadig nyttigt!)"}
        </div>
      </div>

      <button className={styles.btn} onClick={onLog} disabled={isLogging} type="button">
        {ok ? "✅ Logget" : isLogging ? "Logger…" : "Log fund"}
      </button>

      {err ? <div className={styles.err}>{err}</div> : null}
    </div>
  );
}
