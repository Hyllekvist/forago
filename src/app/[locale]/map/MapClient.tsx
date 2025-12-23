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
  flyTo: (lat: number, lng: number, zoom?: number) => void;
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
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);

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
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        mapApi?.flyTo(p.lat, p.lng, 13);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [mapApi]);

  const zoomIn = useCallback(() => mapApi?.zoomIn(), [mapApi]);
  const zoomOut = useCallback(() => mapApi?.zoomOut(), [mapApi]);

  return (
    <main className={styles.page}>
      <div className={styles.stage}>
        <LeafletMap
          spots={spots}
          userPos={userPos}
          onSelect={onSelect}
          selectedId={selectedId}
          onMapReady={(m: LeafletLikeMap) => setMapApi(m)}
        />

        {/* HUD (compact glass card) */}
        <div className={styles.hud} aria-label="Map controls">
          <div className={styles.hudCard}>
            <div className={styles.hudTop}>
              <div className={styles.hudText}>
                <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
                <p className={styles.sub}>
                  {locale === "dk"
                    ? "Tryk på et spot for detaljer."
                    : "Tap a spot for details."}
                </p>
              </div>

              <div className={styles.hudActions}>
                <button className={styles.pill} onClick={locate} type="button">
                  {locale === "dk" ? "Find mig" : "Locate"}
                </button>

                <Link className={styles.pillGhost} href={`/${locale}/species`}>
                  {locale === "dk" ? "Arter" : "Species"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom controls (own pills) */}
        <div className={styles.zoomDock} aria-label="Zoom">
          <button className={styles.zoomBtn} onClick={zoomIn} type="button">
            +
          </button>
          <button className={styles.zoomBtn} onClick={zoomOut} type="button">
            –
          </button>
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

                <button className={styles.closeBtn} onClick={onClose} type="button">
                  ✕
                </button>
              </div>

              <div className={styles.sheetMetaRow}>
                <span className={styles.metaPill}>
                  {locale === "dk" ? "Koordinat" : "Coordinates"} ·{" "}
                  {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                </span>

                {selected.species_slug ? (
                  <Link
                    className={styles.primaryLink}
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
                    ? "Næste: foto + sæson + ‘gem spot’."
                    : "Next: photo + season + ‘save spot’."}
                </p>
              </div>

              <div className={styles.sheetActions}>
                <button className={styles.secondaryBtn} type="button">
                  {locale === "dk" ? "Gem spot" : "Save spot"}
                </button>
                <button className={styles.secondaryBtnGhost} type="button">
                  {locale === "dk" ? "Rapportér" : "Report"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}