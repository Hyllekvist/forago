"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Supercluster from "supercluster";
import type { Map as LeafletMapType } from "leaflet";

import styles from "./MapPage.module.css";

export type Spot = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
  species_slug?: string | null;
 last_seen_at?: string | null;
};

export type LeafletLikeMap = {
  zoomIn: () => void;
  zoomOut: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  panBy: (x: number, y: number) => void; // ✅ add
  getZoom: () => number;
  getBoundsBbox: () => [number, number, number, number];
};

function bboxFromLeaflet(map: LeafletMapType): [number, number, number, number] {
  const b = map.getBounds();
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
}

/** Fix Leaflet default marker icons (robust: CDN, ingen import.meta.url) */
function ensureLeafletIcons() {
  // @ts-expect-error private
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function inBbox(s: Spot, bbox: [number, number, number, number]) {
  const [w, south, e, n] = bbox;
  return s.lng >= w && s.lng <= e && s.lat >= south && s.lat <= n;
}

function spotIcon(selected: boolean) {
  const size = selected ? 30 : 24;
  const dot = selected ? 10 : 8;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:999px;
        background:${selected ? "rgba(16,185,129,0.92)" : "rgba(2,6,23,0.85)"};
        border:1px solid rgba(255,255,255,0.28);
        box-shadow:${selected ? "0 16px 36px rgba(16,185,129,0.28)" : "0 14px 34px rgba(0,0,0,0.35)"};
        backdrop-filter: blur(10px);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="width:${dot}px;height:${dot}px;border-radius:999px;background:rgba(255,255,255,0.92)"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIcon(count: number) {
  const size = count >= 100 ? 48 : count >= 20 ? 44 : 40;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        min-width:${size}px;height:${size}px;border-radius:999px;
        background:rgba(2,6,23,0.82);
        border:1px solid rgba(255,255,255,0.22);
        color:rgba(255,255,255,0.92);
        display:flex;align-items:center;justify-content:center;
        font-weight:850;
        box-shadow: 0 14px 34px rgba(0,0,0,0.35);
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
  onPanningChange,
}: {
  points: Spot[];
  selectedId: string | null;
  onMapReady?: (m: LeafletLikeMap) => void;
  onSelectSpot: (id: string) => void;
  onVisibleChange?: (visibleIds: string[]) => void;
  onPanningChange?: (isPanning: boolean) => void;
}) {
  // NOTE: vi bruger "tick" kun til at recalculere clusters på moveend/zoomend
  const [tick, setTick] = useState(0);
  const panningRef = useRef(false);

  const map = useMapEvents({
    movestart: () => {
      if (!panningRef.current) {
        panningRef.current = true;
        onPanningChange?.(true);
      }
    },

    moveend: () => {
      // 1) signal: færdig med at pan'e
      if (panningRef.current) {
        panningRef.current = false;
        onPanningChange?.(false);
      }

      // 2) opdater visible én gang, ikke på hvert move
      if (onVisibleChange) {
        const bbox = bboxFromLeaflet(map);
        const visible = points.filter((s) => inBbox(s, bbox)).map((s) => s.id);
        onVisibleChange(visible);
      }

      // 3) trig clusters re-render
      setTick((t) => t + 1);
    },

    zoomstart: () => {
      if (!panningRef.current) {
        panningRef.current = true;
        onPanningChange?.(true);
      }
    },

    zoomend: () => {
      if (panningRef.current) {
        panningRef.current = false;
        onPanningChange?.(false);
      }

      if (onVisibleChange) {
        const bbox = bboxFromLeaflet(map);
        const visible = points.filter((s) => inBbox(s, bbox)).map((s) => s.id);
        onVisibleChange(visible);
      }

      setTick((t) => t + 1);
    },
  });

  const index = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 17 });
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

    flyTo: (lat, lng, zoom = 12) => {
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 0.5,
      });
    },

    panBy: (x, y) => {
      map.panBy([x, y], {
        animate: true,
        duration: 0.35,
      });
    },

    getZoom: () => map.getZoom(),

    getBoundsBbox: () => bboxFromLeaflet(map),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // initial visible list (once)
  useEffect(() => {
    if (!onVisibleChange) return;
    const bbox = bboxFromLeaflet(map);
    const visible = points.filter((s) => inBbox(s, bbox)).map((s) => s.id);
    onVisibleChange(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  const nextZoom = Math.min(index.getClusterExpansionZoom(clusterId), 17);
                  map.flyTo([lat, lng], nextZoom, { animate: true, duration: 0.5 });
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
            icon={spotIcon(selected)}
            eventHandlers={{
              click: () => {
                const targetZoom = Math.max(map.getZoom(), 14);
                map.flyTo([lat, lng], targetZoom, { animate: true, duration: 0.5 });
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
  onPanningChange,
}: {
  spots: Spot[];
  userPos: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapReady?: (m: LeafletLikeMap) => void;
  onVisibleChange?: (visibleIds: string[]) => void;
  onPanningChange?: (isPanning: boolean) => void;
}) {
  useEffect(() => {
    ensureLeafletIcons();
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    return [56.1, 10.2];
  }, [userPos]);

  // (valgfrit) hvis du skifter spots drastisk, så vil vi gerne “stop panning”
  useEffect(() => {
    onPanningChange?.(false);
  }, [spots, onPanningChange]);

  return (
    <div className={styles.mapWrap}>
      <MapContainer className={styles.map} center={center} zoom={6} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusterLayer
          points={spots}
          selectedId={selectedId}
          onMapReady={onMapReady}
          onSelectSpot={onSelect}
          onVisibleChange={onVisibleChange}
          onPanningChange={onPanningChange}
        />
      </MapContainer>
    </div>
  );
}