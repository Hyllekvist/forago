"use client"; 

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "./MapPage.module.css";

type Spot = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  species_slug?: string | null;
  created_at?: string | null;
};

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function MapClient({
  locale,
  spots,
}: {
  locale: "dk" | "en";
  spots: Spot[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const selected = useMemo(
    () => spots.find((s) => s.id === selectedId) ?? null,
    [spots, selectedId]
  );

  const onSelect = useCallback((id: string) => setSelectedId(id), []);
  const onClose = useCallback(() => setSelectedId(null), []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // no-op (du kan toast’e senere)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Auto-close sheet hvis du skifter route (mobile back feeling)
  useEffect(() => {
    // keep simple
  }, []);

  return (
    <main className={styles.page}>
      {/* Full-bleed map canvas */}
      <div className={styles.mapStage}>
        <LeafletMap
          spots={spots}
          userPos={userPos}
          onSelect={onSelect}
          selectedId={selectedId}
        />

        {/* Floating controls */}
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>
            <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Tryk på et spot for detaljer og arter."
                : "Tap a spot for details and species."}
            </p>

            <div className={styles.actions}>
              <button className={styles.btn} onClick={locate} type="button">
                {locale === "dk" ? "Find mig" : "Locate me"}
              </button>

              <Link className={styles.btnGhost} href={`/${locale}/species`}>
                {locale === "dk" ? "Arter" : "Species"}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom sheet card */}
        <div
          className={`${styles.sheet} ${
            selected ? styles.sheetOpen : styles.sheetClosed
          }`}
          aria-hidden={!selected}
        >
          <div className={styles.sheetHandle} />
          {selected ? (
            <div className={styles.sheetCard}>
              <div className={styles.sheetHeader}>
                <div className={styles.sheetTitle}>
                  {selected.title || (locale === "dk" ? "Spot" : "Spot")}
                </div>
                <button className={styles.close} onClick={onClose} type="button">
                  ✕
                </button>
              </div>

              <div className={styles.sheetMeta}>
                <span className={styles.metaPill}>
                  {locale === "dk" ? "Koordinat" : "Coordinates"} ·{" "}
                  {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                </span>

                {selected.species_slug ? (
                  <Link
                    className={styles.metaLink}
                    href={`/${locale}/species/${selected.species_slug}`}
                  >
                    {locale === "dk" ? "Se art →" : "View species →"}
                  </Link>
                ) : (
                  <span className={styles.metaMuted}>
                    {locale === "dk" ? "Ingen art endnu" : "No species yet"}
                  </span>
                )}
              </div>

              <div className={styles.sheetBody}>
                <p className={styles.p}>
                  {locale === "dk"
                    ? "Næste: vis art, sæson og et lille foto-preview her."
                    : "Next: show species, season and a photo preview here."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}