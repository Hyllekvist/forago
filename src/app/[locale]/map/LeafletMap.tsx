"use client";

import { useEffect, useMemo, useState } from "react";
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

export type LeafletLikeMap = {
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

/** Fix Leaflet default marker icons in Next */
function ensureLeafletIcons() {
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

  // @ts-expect-error private
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
}

function inBbox(s: Spot, bbox: [number, number, number, number]) {
  const [w, south, e, n] = bbox;
  return s.lng >= w && s.lng <= e && s.lat >= south && s.lat <= n;
}

function SpotIcon({ selected }: { selected: boolean }) {
  // DivIcon som “app marker”
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${selected ? 28 : 22}px;
        height:${selected ? 28 : 22}px;
        border-radius:999px;
        background:${selected ? "rgba(16,185,129,0.95)" : "rgba(2,6,23,0.85)"};
        border:1px solid rgba(255,255,255,0.30);
        box-shadow:${selected ? "0 14px 34px rgba(16,185,129,0.35)" : "0 12px 28px rgba(0,0,0,0.35)"};
        backdrop-filter: blur(10px);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          width:${selected ? 10 : 8}px;
          height:${selected ? 10 : 8}px;
          border-radius:999px;
          background:rgba(255,255,255,0.92);
          opacity:0.95;
        "></div>
      </div>
    `,
    iconSize: [selected ? 28 : 22, selected ? 28 : 22],
    iconAnchor: [selected ? 14 : 11, selected ? 14 : 11],
  });
}

function clusterIcon(count: number) {
  const size = count >= 100 ? 46 : count >= 20 ? 42 : 38;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        min-width:${size}px;height:${size}px;border-radius:999px;
        background:rgba(2,6,23,0.82);
        border:1px solid rgba(255,255,255,0.24);
        color:rgba(255,255,255,0.92);
        display:flex;align-items:center;justify-content:center;
        font-weight:800;
        box-shadow: 0 12px 28px rgba(0,0,0,0.35);
        backdrop-filter: blur(10px);
        padding:0 10px;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function ClusterLayer({
  points,
  selectedId,
  onMapReady,
  onSelectSpot,
  onVisibleChange,
}: {
  points: Spot[];
  selectedId: string | null;
  onMapReady?: (m: LeafletLikeMap) => void;
  onSelectSpot: (id: string) => void;
  onVisibleChange?: (visibleIds: string[]) => void;
}) {
  const [tick, setTick] = useState(0);

  const map = useMapEvents({
    moveend: () => setTick((t) => t + 1),
    zoomend: () => setTick((t) => t + 1),
    click: () => {
      // click outside markers = close sheet feeling (valgfrit)
      // onSelectSpot("") // nej – lad MapClient styre close
    },
  });

  const index = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 17,
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

  // expose map api once
  useEffect(() => {
    onMapReady?.({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      flyTo: (lat, lng, zoom = 12) =>
        map.flyTo([lat, lng], zoom, { animate: true, duration: 0.45 }),
      getZoom: () => map.getZoom(),
      getBoundsBbox: () => bboxFromLeaflet(map),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // visible spots list (for bottom sheet list)
  useEffect(() => {
    if (!onVisibleChange) return;
    const bbox = bboxFromLeaflet(map);
    const visible = points.filter((s) => inBbox(s, bbox)).map((s) => s.id);
    onVisibleChange(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, points]);

  const clusters = useMemo(() => {
    const zoom = map.getZoom();
    const bbox = bboxFromLeaflet(map);
    return index.getClusters(bbox, zoom);
  }, [index, map, tick]);

  return (
    <>
      {clusters.map((c: any) => {
        const [lng, lat] = c.geometry.coordinates;
        const isCluster = c.properties.cluster;

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
                  const nextZoom = Math.min(
                    index.getClusterExpansionZoom(clusterId),
                    17
                  );
                  map.flyTo([lat, lng], nextZoom, { animate: true, duration: 0.45 });
                },
              }}
            />
          );
        }

        const spotId = c.properties.spotId as string;
        const selected = spotId === selectedId;

        return (
          <Marker
            key={`s-${spotId}`}
            position={[lat, lng]}
            icon={SpotIcon({ selected })}
            eventHandlers={{
              click: () => {
                // Smooth zoom-on-tap til et “detail zoom”
                const targetZoom = Math.max(map.getZoom(), 14);
                map.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.45 });
                onSelectSpot(spotId);
              },
            }}
          />
        );
      })}
    </>
  );
}

export default function LeafletMap({
  spots,
  userPos,
  selectedId,
  onSelect,
  onMapReady,
  onVisibleChange,
}: {
  spots: Spot[];
  userPos: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapReady?: (m: LeafletLikeMap) => void;
  onVisibleChange?: (visibleIds: string[]) => void;
}) {
  useEffect(() => {
    ensureLeafletIcons();
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    return [56.1, 10.2]; // DK-ish fallback
  }, [userPos]);

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        className={styles.map}
        center={center}
        zoom={6}
        zoomControl={false}
        attributionControl={true}
        whenReady={() => {
          // Ingen hård setView her – lad bruger pos være “gentle”
          // (MapClient kan kalde flyTo via onMapReady)
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusterLayer
          points={spots}
          selectedId={selectedId}
          onMapReady={onMapReady}
          onSelectSpot={onSelect}
          onVisibleChange={onVisibleChange}
        />
      </MapContainer>
    </div>
  );
}