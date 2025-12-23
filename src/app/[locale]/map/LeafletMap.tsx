"use client"; 

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapPage.module.css";

type Spot = {
  id: string;
  lat: number;
  lng: number;
  title?: string | null;
};

const pin = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 0.7 });
  return null;
}

export default function LeafletMap({
  spots,
  userPos,
  onSelect,
}: {
  spots: Spot[];
  userPos: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const center: [number, number] = userPos
    ? [userPos.lat, userPos.lng]
    : [56.1, 10.2]; // DK-ish

  return (
    <div className={styles.mapWrap}>
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos ? <FlyTo lat={userPos.lat} lng={userPos.lng} /> : null}

        {spots.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pin}
            eventHandlers={{
              click: () => onSelect(s.id),
            }}
          >
            <Popup>
              <div style={{ fontWeight: 700 }}>{s.title ?? "Spot"}</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>
                {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}