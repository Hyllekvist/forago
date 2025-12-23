"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMapType } from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Supercluster = require("supercluster") as any;


import styles from "./MapPage.module.css";

type Spot = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  species_slug?: string | null;
};

type LeafletLikeMap = {
  zoomIn: () => void;
  zoomOut: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  getZoom: () => number;
  getBoundsBbox: () => [number, number, number, number]; // [west,south,east,north]
};

function bboxFromLeaflet(map: LeafletMapType): [number, number, number, number] {
  const b = map.getBounds();
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
}

function inBounds(map: LeafletMapType, s: Spot) {
  const b = map.getBounds();
  return b.contains([s.lat, s.lng]);
}

function niceTitle(s: Spot) {
  return (s.title || "").trim() || "Spot";
}

function setupLeafletDefaultIcons() {
  // Next/Vercel-safe assets
  const iconRetinaUrl = new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).toString();
  const iconUrl = new URL(
    "leaflet/dist/images/marker-icon.png",
    import.meta.url
  ).toString();
  const shadowUrl = new URL(
    "leaflet/dist/images/marker-shadow.png",
    import.meta.url
  ).toString();

  // @ts-expect-error leaflet internals
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
}

function ClusterEngine({
  points,
  selectedId,
  onMapReady,
  onSelectSpot,
  onViewportSpots,
}: {
  points: Spot[];
  selectedId: string | null;
  onMapReady?: (m: LeafletLikeMap) => void;
  onSelectSpot: (id: string, lat: number, lng: number) => void;
  onViewportSpots: (ids: string[]) => void;
}) {
  const [tick, setTick] = useState(0);

  const map = useMapEvents({
    moveend: () => setTick((t) => t + 1),
    zoomend: () => setTick((t) => t + 1),
  });

  const index = useMemo(() => {
    const sc = new Supercluster({
      radius: 64,
      maxZoom: 17,
      minZoom: 0,
    });

    sc.load(
      points.map((s) => ({
        type: "Feature",
        properties: { spotId: s.id },
        geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      }))
    );

    return sc;
  }, [points]);

  useEffect(() => {
    onMapReady?.({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      flyTo: (lat, lng, zoom = 12) => map.flyTo([lat, lng], zoom, { animate: true }),
      getZoom: () => map.getZoom(),
      getBoundsBbox: () => bboxFromLeaflet(map),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clusters = useMemo(() => {
    const zoom = map.getZoom();
    const bbox = bboxFromLeaflet(map);
    return index.getClusters(bbox, zoom);
  }, [index, map, tick]);

  // Feed “visible list” (ids in viewport) up to bottom sheet
  useEffect(() => {
    const ids: string[] = [];
    for (const s of points) {
      if (inBounds(map, s)) ids.push(s.id);
    }
    onViewportSpots(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, points]);

  const clusterIcon = (count: number) =>
    L.divIcon({
      className: "",
      html: `
        <div style="
          min-width:44px;height:44px;border-radius:999px;
          background:rgba(15,23,42,0.84);
          border:1px solid rgba(255,255,255,0.22);
          color:rgba(255,255,255,0.92);
          display:flex;align-items:center;justify-content:center;
          font-weight:900;
          box-shadow: 0 14px 34px rgba(0,0,0,0.38);
          backdrop-filter: blur(10px);
        ">${count}</div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

  const selectedIcon = useMemo(() => {
    // subtle “selected” ring
    return L.divIcon({
      className: "",
      html: `
        <div style="
          width:18px;height:18px;border-radius:999px;
          background:rgba(16,185,129,0.95);
          border:3px solid rgba(255,255,255,0.92);
          box-shadow: 0 10px 26px rgba(0,0,0,0.35);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }, []);

  return (
    <>
      {clusters.map((c: any) => {
        const [lng, lat] = c.geometry.coordinates as [number, number];
        const isCluster = !!c.properties.cluster;

        if (isCluster) {
          const count = c.properties.point_count as number;
          const clusterId = c.id as number;

          return (
            <Marker
              key={`c-${clusterId}`}
              position={[lat, lng]}
              icon={clusterIcon(count)}
              eventHandlers={{
                click: () => {
                  const nextZoom = Math.min(index.getClusterExpansionZoom(clusterId), 17);
                  map.flyTo([lat, lng], nextZoom, { animate: true });
                },
              }}
            />
          );
        }

        const spotId = c.properties.spotId as string;
        const isSelected = selectedId === spotId;

        return (
          <Marker
            key={`s-${spotId}`}
            position={[lat, lng]}
            icon={isSelected ? selectedIcon : undefined}
            eventHandlers={{
              click: () => onSelectSpot(spotId, lat, lng),
            }}
          />
        );
      })}
    </>
  );
}

export default function LeafletMap({
  locale,
  spots,
  userPos,
  selectedId,
  onSelect,
  onMapReady,
}: {
  locale: "dk" | "en";
  spots: Spot[];
  userPos: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapReady?: (m: LeafletLikeMap) => void;
}) {
  const mapRef = useRef<LeafletMapType | null>(null);
  const [viewportIds, setViewportIds] = useState<string[]>([]);

  useEffect(() => {
    setupLeafletDefaultIcons();
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    return [56.1, 10.2]; // DK-ish fallback
  }, [userPos]);

  const selected = useMemo(
    () => (selectedId ? spots.find((s) => s.id === selectedId) ?? null : null),
    [spots, selectedId]
  );

  const viewportSpots = useMemo(() => {
    const set = new Set(viewportIds);
    return spots
      .filter((s) => set.has(s.id))
      .sort((a, b) => niceTitle(a).localeCompare(niceTitle(b)))
      .slice(0, 30);
  }, [spots, viewportIds]);

  const smoothSelect = useCallback(
    (id: string, lat: number, lng: number) => {
      onSelect(id);
      const m = mapRef.current;
      if (!m) return;

      // “smooth zoom on tap”
      const targetZoom = Math.max(m.getZoom(), 13);
      m.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.6 });
    },
    [onSelect]
  );

  const jumpTo = useCallback(
    (s: Spot) => {
      smoothSelect(s.id, s.lat, s.lng);
    },
    [smoothSelect]
  );

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        className={styles.map}
        center={center}
        zoom={6}
        zoomControl={false}
        attributionControl={true}
        whenReady={() => {
          // try to store map ref safely
          const m = (mapRef.current as any) as LeafletMapType | null;
          if (userPos && m) {
            m.setView([userPos.lat, userPos.lng], 12, { animate: false });
          }
        }}
        ref={(node) => {
          // react-leaflet v4 gives you Leaflet map instance here
          mapRef.current = (node as unknown as LeafletMapType) ?? null;
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClusterEngine
          points={spots}
          selectedId={selectedId}
          onMapReady={onMapReady}
          onViewportSpots={(ids) => setViewportIds(ids)}
          onSelectSpot={(id, lat, lng) => smoothSelect(id, lat, lng)}
        />
      </MapContainer>

      {/* Bottom sheet: selected + scannable list */}
      <div
        className={`${styles.sheet} ${selected ? styles.sheetOpen : styles.sheetClosed}`}
        aria-hidden={!selected}
      >
        <div className={styles.sheetHandle} />

        <div className={styles.sheetCard}>
          <div className={styles.sheetHeader}>
            <div className={styles.sheetTitle}>
              {selected ? niceTitle(selected) : locale === "dk" ? "Spots" : "Spots"}
            </div>

            {selected ? (
              <button
                className={styles.close}
                type="button"
                onClick={() => onSelect("")} // MapClient kan tolke "" som “clear”
              >
                ✕
              </button>
            ) : null}
          </div>

          {selected ? (
            <div className={styles.sheetMeta}>
              <span className={styles.metaPill}>
                {locale === "dk" ? "Koordinat" : "Coordinates"} ·{" "}
                {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
              </span>

              {selected.species_slug ? (
                <a
                  className={styles.metaLink}
                  href={`/${locale}/species/${selected.species_slug}`}
                >
                  {locale === "dk" ? "Se art →" : "View species →"}
                </a>
              ) : (
                <span className={styles.metaMuted}>
                  {locale === "dk" ? "Ingen art endnu" : "No species yet"}
                </span>
              )}
            </div>
          ) : null}

          {/* Scannable list of visible spots */}
          <div className={styles.sheetBody}>
            <p className={styles.p}>
              {locale === "dk"
                ? "Synlige spots lige nu (tap for at zoome):"
                : "Visible spots right now (tap to zoom):"}
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                paddingTop: 10,
                paddingBottom: 4,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {viewportSpots.length ? (
                viewportSpots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => jumpTo(s)}
                    style={{
                      flex: "0 0 auto",
                      borderRadius: 999,
                      padding: "10px 12px",
                      border: "1px solid var(--line)",
                      background: "var(--panel2)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      textAlign: "left",
                      maxWidth: 240,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis