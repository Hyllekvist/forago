"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMapType } from "leaflet";
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
};

export default function LeafletMap({
  spots,
  userPos,
  onSelect,
  selectedId,
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
    // Fix default marker icon paths (Leaflet + bundlers)
    // @ts-expect-error leaflet internals
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    return [56.1, 10.2];
  }, [userPos]);

  const userIcon = useMemo(() => {
    return L.divIcon({
      className: "",
      html: `<div style="
        width:14px;height:14px;border-radius:999px;
        background:#3b82f6;
        box-shadow:0 0 0 6px rgba(59,130,246,0.18);
        border:2px solid rgba(255,255,255,0.9);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }, []);

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        ref={(node) => {
          // react-leaflet v4 giver Leaflet-map på node?.leafletElement i nogle setups,
          // men ref() får typisk Leaflet Map direkte. Vi håndterer begge.
          const anyNode = node as any;
          mapRef.current = (anyNode?.leafletElement ?? anyNode) || null;
        }}
        className={styles.map}
        center={center}
        zoom={6}
        zoomControl={false}
        attributionControl={true}
        whenReady={() => {
          const m = mapRef.current;
          if (!m) return;

          onMapReady?.({ zoomIn: () => m.zoomIn(), zoomOut: () => m.zoomOut() });

          if (userPos) {
            m.setView([userPos.lat, userPos.lng], 12, { animate: false });
          }
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userPos ? (
          <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />
        ) : null}

        {spots.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            eventHandlers={{ click: () => onSelect(s.id) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}