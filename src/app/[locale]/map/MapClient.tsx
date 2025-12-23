"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "./MapPage.module.css";
import type { LeafletLikeMap } from "./LeafletMap";

type Spot = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  species_slug?: string | null;
  created_at?: string | null;
};

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

function safeTitle(s: Spot, locale: "dk" | "en") {
  return s.title?.trim() || (locale === "dk" ? "Spot" : "Spot");
}

export default function MapClient({
  locale,
  spots,
}: {
  locale: "dk" | "en";
  spots: Spot[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const selected = useMemo(
    () => spots.find((s) => s.id === selectedId) ?? null,
    [spots, selectedId]
  );

  const visibleSpots = useMemo(() => {
    const base =
      visibleIds.length > 0
        ? spots.filter((s) => visibleIds.includes(s.id))
        : spots;

    const query = q.trim().toLowerCase();
    const filtered = query
      ? base.filter((s) => safeTitle(s, locale).toLowerCase().includes(query))
      : base;

    // “Scannable”: korte labels, stabil sort
    return filtered
      .slice()
      .sort((a, b) => safeTitle(a, locale).localeCompare(safeTitle(b, locale)))
      .slice(0, 80);
  }, [spots, visibleIds, q, locale]);

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const onClose = useCallback(() => setSelectedId(null), []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        mapApi?.flyTo(p.lat, p.lng, 12);
      },
      () => {
        // no-op
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [mapApi]);

  const jumpToSpot = useCallback(
    (s: Spot) => {
      mapApi?.flyTo(s.lat, s.lng, 14);
      setSelectedId(s.id);
    },
    [mapApi]
  );

  const sheetOpen = Boolean(selected) || q.trim().length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.mapStage}>
        <LeafletMap
          spots={spots}
          userPos={userPos}
          selectedId={selectedId}
          onSelect={onSelect}
          onMapReady={(m) => setMapApi(m)}
          onVisibleChange={(ids) => setVisibleIds(ids)}
        />

        {/* Top HUD */}
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>
            <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
            <p className={styles.sub}>
              {locale === "dk"
                ? "Tryk på et spot for detaljer. Klynger zoomer ind."
                : "Tap a spot for details. Clusters zoom in."}
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

        {/* Bottom Sheet: selected + scannable list */}
        <div
          className={`${styles.sheet} ${sheetOpen ? styles.sheetOpen : styles.sheetClosed}`}
          aria-hidden={!sheetOpen}
        >
          <div className={styles.sheetHandle} />

          <div className={styles.sheetCard}>
            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitle}>
                {selected ? safeTitle(selected, locale) : locale === "dk" ? "Spots" : "Spots"}
              </div>
              <button className={styles.close} onClick={onClose} type="button">
                ✕
              </button>
            </div>

            {selected ? (
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
            ) : null}

            {/* Search */}
            <div style={{ marginTop: 10 }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={locale === "dk" ? "Søg i spots…" : "Search spots…"}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  padding: "10px 12px",
                  border: "1px solid var(--line)",
                  background: "var(--panel2)",
                  color: "var(--ink)",
                  outline: "none",
                }}
              />
            </div>

            {/* List */}
            <div
              style={{
                marginTop: 10,
                maxHeight: "38vh",
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                borderRadius: 16,
                border: "1px solid var(--line)",
                background: "color-mix(in srgb, var(--panel) 60%, transparent)",
              }}
            >
              {visibleSpots.length ? (
                <ul style={{ listStyle: "none", margin: 0, padding: 8 }}>
                  {visibleSpots.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => jumpToSpot(s)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: 0,
                          background: "transparent",
                          color: "var(--ink)",
                          padding: "10px 10px",
                          borderRadius: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 14 }}>
                          {safeTitle(s, locale)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
                          {s.species_slug ? ` · ${s.species_slug}` : ""}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: 12, color: "var(--muted)" }}>
                  {locale === "dk" ? "Ingen spots i view." : "No spots in view."}
                </div>
              )}
            </div>

            {!selected ? (
              <p className={styles.p} style={{ marginTop: 10 }}>
                {locale === "dk"
                  ? "Tip: zoom ind – så bliver klynger til enkelte spots."
                  : "Tip: zoom in – clusters break into individual spots."}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}