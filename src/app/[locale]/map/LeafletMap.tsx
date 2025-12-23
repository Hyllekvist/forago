"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMapType } from "leaflet";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Supercluster = require("supercluster") as any;
import "leaflet/dist/leaflet.css";
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
  const w = b.getWest();
  const s = b.getSouth();
  const e = b.getEast();
  const n = b.getNorth();
  return [w, s, e, n];
}

function ClusterEngine({
  points,
  onMapReady,
  onSelectSpot,
}: {
  points: Spot[];
  onMapReady?: (m: LeafletLikeMap) => void;
  onSelectSpot: (id: string) => void;
}) {
  const map = useMapEvents({
    moveend: () => setTick((t) => t + 1),
    zoomend: () => setTick((t) => t + 1),
  });

  const [tick, setTick] = useState(0);

  const index = useMemo(() => {
    const sc = new Supercluster<{ spotId?: string }>({
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
    // tick triggers recompute on pan/zoom
  }, [index, map, tick]);

  const clusterIcon = (count: number) =>
    L.divIcon({
      className: "",
      html: `<div style="
        min-width:40px;height:40px;border-radius:999px;
        background:rgba(15,23,42,0.82);
        border:1px solid rgba(255,255,255,0.22);
        color:rgba(255,255,255,0.92);
        display:flex;align-items:center;justify-content:center;
        font-weight:800;
        box-shadow: 0 12px 28px rgba(0,0,0,0.35);
        backdrop-filter: blur(10px);
      ">${count}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

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
                  map.flyTo([lat, lng], nextZoom, { animate: true });
                },
              }}
            />
          );
        }

        const spotId = c.properties.spotId as string;
        return (
          <Marker
            key={`s-${spotId}`}
            position={[lat, lng]}
            eventHandlers={{ click: () => onSelectSpot(spotId) }}
          />
        );
      })}
    </>
  );
}

export default function LeafletMap({
  spots,
  userPos,
  onSelect,
  onMapReady,
}: {
  spots: Spot[];
  userPos: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMapReady?: (m: LeafletLikeMap) => void;
}) {
  const mapRef = useRef<LeafletMapType | null>(null);

  useEffect(() => {
    // @ts-expect-error leaflet internals
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    return [56.1, 10.2];
  }, [userPos]);

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        ref={(node) => {
          const anyNode = node as any;
          mapRef.current = (anyNode?.leafletElement ?? anyNode) || null;
        }}
        className={styles.map}
        center={center}
        zoom={6}
        zoomControl={false}
        attributionControl={true}
        whenReady={() => {
          if (userPos && mapRef.current) {
            mapRef.current.setView([userPos.lat, userPos.lng], 12, { animate: false });
          }
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusterEngine points={spots} onMapReady={onMapReady} onSelectSpot={onSelect} />
      </MapContainer>
    </div>
  );
}