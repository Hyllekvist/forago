"use client";

import { useMemo, useState, useCallback } from "react";
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

type LeafletLikeMap = {
  zoomIn: () => void;
  zoomOut: () => void;
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
  const [mapRef, setMapRef] = useState<LeafletLikeMap | null>(null);

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
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.mapStage}>
        <LeafletMap
          spots={spots}
          userPos={userPos}
          onSelect={onSelect}
          selectedId={selectedId}
          onMapReady={(m: LeafletLikeMap) => setMapRef(m)}
        />

        {/* Top HUD (compact glass) */}
        <div className={styles.topHud}>
          <div className={styles.topHudInner}>
            <div className={styles.topRow}>
              <div>
                <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
                <p className={styles.sub}>
                  {locale === "dk"
                    ? "Tryk på et spot for detaljer."
                    : "Tap a spot for details."}
                </p>
              </div>

              <span className={styles.pill}>
                {locale === "dk" ? "Spots" : "Spots"} · {spots.length}
              </span>
            </div>

            <div className={styles.hint}>
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
        </div>

        {/* Floating controls */}
        <div className={styles.controls} aria-hidden={!mapRef}>
          <div className={styles.ctrlStack}>
            <button
              className={styles.ctrlBtn}
              type="button"
              onClick={() => mapRef?.zoomIn()}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
            <button
              className={styles.ctrlBtn}
              type="button"
              onClick={() => mapRef?.zoomOut()}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {/* Bottom sheet */}
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
                    ? "Næste: mini-preview (foto), sæson og “gem spot”."
                    : "Next: photo preview, season and “save spot”."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}