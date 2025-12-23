"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styles from "./MapPage.module.css";

import type { Spot, LeafletLikeMap } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

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

  // “scannable list” baseret på synlige spots i viewport
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<"list" | "detail">("list");

  const selected = useMemo(
    () => (selectedId ? spots.find((s) => s.id === selectedId) ?? null : null),
    [spots, selectedId]
  );

  const visibleSpots = useMemo(() => {
    const set = new Set(visibleIds);
    const arr = spots.filter((s) => set.has(s.id));
    // mere “app-feel”: title først, ellers fallback
    return arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [spots, visibleIds]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        // fly to bruger
        mapApi?.flyTo(p.lat, p.lng, 13);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [mapApi]);

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetMode("detail");
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSheetMode("list");
  }, []);

  const openList = useCallback(() => setSheetMode("list"), []);

  const tapSpotFromList = useCallback(
    (s: Spot) => {
      setSelectedId(s.id);
      setSheetMode("detail");
      mapApi?.flyTo(s.lat, s.lng, 14);
    },
    [mapApi]
  );

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

        {/* Compact top HUD */}
        <div className={styles.topBar}>
          <div className={styles.topBarInner}>
            <div className={styles.topRow}>
              <div>
                <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
                <p className={styles.sub}>
                  {locale === "dk"
                    ? "Tryk på et spot — eller scan listen."
                    : "Tap a spot — or scan the list."}
                </p>
              </div>

              <div className={styles.topPills}>
                <span className={styles.pill}>
                  {locale === "dk" ? "Synlige" : "Visible"}:{" "}
                  <strong>{visibleSpots.length}</strong>
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.btn} onClick={locate} type="button">
                {locale === "dk" ? "Find mig" : "Locate me"}
              </button>

              <Link className={styles.btnGhost} href={`/${locale}/species`}>
                {locale === "dk" ? "Arter" : "Species"}
              </Link>

              <button className={styles.btnGhost} onClick={openList} type="button">
                {locale === "dk" ? "Liste" : "List"}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          className={`${styles.sheet} ${
            sheetMode === "detail" && selected ? styles.sheetOpen : styles.sheetOpen
          }`}
        >
          <div className={styles.sheetHandle} />

          <div className={styles.sheetCard}>
            {/* Tabs */}
            <div className={styles.sheetTabs}>
              <button
                className={`${styles.tab} ${sheetMode === "list" ? styles.tabActive : ""}`}
                type="button"
                onClick={() => setSheetMode("list")}
              >
                {locale === "dk" ? "Liste" : "List"}
              </button>
              <button
                className={`${styles.tab} ${sheetMode === "detail" ? styles.tabActive : ""}`}
                type="button"
                onClick={() => selected && setSheetMode("detail")}
                disabled={!selected}
              >
                {locale === "dk" ? "Valgt" : "Selected"}
              </button>

              {selected ? (
                <button className={styles.close} onClick={closeDetail} type="button">
                  ✕
                </button>
              ) : null}
            </div>

            {/* Detail */}
            {sheetMode === "detail" && selected ? (
              <div className={styles.detail}>
                <div className={styles.detailTitle}>
                  {selected.title || (locale === "dk" ? "Spot" : "Spot")}
                </div>

                <div className={styles.detailMetaRow}>
                  <span className={styles.metaPill}>
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

                <div className={styles.detailActions}>
                  <button
                    className={styles.btn}
                    type="button"
                    onClick={() => mapApi?.flyTo(selected.lat, selected.lng, 15)}
                  >
                    {locale === "dk" ? "Zoom ind" : "Zoom in"}
                  </button>
                  <button className={styles.btnGhost} type="button" onClick={openList}>
                    {locale === "dk" ? "Til liste" : "Back to list"}
                  </button>
                </div>
              </div>
            ) : (
              /* List */
              <div className={styles.list}>
                <div className={styles.listHeader}>
                  <div className={styles.listTitle}>
                    {locale === "dk" ? "Synlige spots" : "Visible spots"}
                  </div>
                  <div className={styles.listHint}>
                    {locale === "dk" ? "Scroll + tap" : "Scroll + tap"}
                  </div>
                </div>

                <div className={styles.listScroller}>
                  {visibleSpots.length ? (
                    visibleSpots.map((s) => (
                      <button
                        key={s.id}
                        className={styles.listItem}
                        type="button"
                        onClick={() => tapSpotFromList(s)}
                      >
                        <div className={styles.listItemMain}>
                          <div className={styles.listItemTitle}>{s.title || "Spot"}</div>
                          <div className={styles.listItemMeta}>
                            {s.species_slug ? s.species_slug : locale === "dk" ? "Ingen art" : "No species"}
                            {" · "}
                            {s.lat.toFixed(3)}, {s.lng.toFixed(3)}
                          </div>
                        </div>
                        <div className={styles.chev}>›</div>
                      </button>
                    ))
                  ) : (
                    <div className={styles.empty}>
                      {locale === "dk"
                        ? "Zoom ind eller pan — så dukker listen op."
                        : "Zoom or pan — the list will populate."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}