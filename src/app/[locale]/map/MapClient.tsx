"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./MapClient.module.css";

import LeafletMap, { type Spot, type LeafletLikeMap } from "./LeafletMap";
import { MapTopbar } from "./ui/MapTopbar";
import { InsightStrip, type InsightKey } from "./ui/InsightStrip";
import { MapSheet } from "./ui/MapSheet";
import { SpotPeekCard } from "./ui/SpotPeekCard";

type Mode = "daily" | "forage";

type Props = {
  spots: Spot[];
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(q));
}

export default function MapClient({ spots }: Props) {
  const [mode, setMode] = useState<Mode>("daily");
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // --- get user position
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  // --- compute insights (MVP)
  const insights = useMemo(() => {
    const total = spots.length;

    const nearbyCount = userPos
      ? spots.filter((s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2).length
      : 0;

    const seasonNowCount = Math.min(total, Math.max(0, Math.round(total * 0.35)));
    const peakCount = Math.min(total, Math.max(0, Math.round(total * 0.12)));

    return {
      season_now: { label: "I sæson nu", value: seasonNowCount, hint: "Arter" },
      peak: { label: "Peak", value: peakCount, hint: "I området" },
      nearby: { label: "Tæt på dig", value: nearbyCount, hint: "< 2 km" },
    } as const;
  }, [spots, userPos]);

  const spotsById = useMemo(() => {
    const m = new Map<string, Spot>();
    spots.forEach((s) => m.set(s.id, s));
    return m;
  }, [spots]);

  const visibleSpots = useMemo(() => {
    if (!visibleIds?.length) return [];
    return visibleIds.map((id) => spotsById.get(id)).filter(Boolean) as Spot[];
  }, [visibleIds, spotsById]);

  const selectedSpot = useMemo(() => {
    return selectedId ? spotsById.get(selectedId) ?? null : null;
  }, [selectedId, spotsById]);

  const filteredSpots = useMemo(() => {
    if (!activeInsight) return spots;

    if (activeInsight === "nearby" && userPos) {
      return spots
        .map((s) => ({ s, d: haversineKm(userPos, { lat: s.lat, lng: s.lng }) }))
        .filter((x) => x.d <= 2)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s);
    }

    return spots;
  }, [spots, activeInsight, userPos]);

  const onToggleMode = useCallback(() => {
    setMode((m) => (m === "daily" ? "forage" : "daily"));
    setSheetExpanded(false);
  }, []);

  const onPickInsight = useCallback(
    (k: InsightKey) => {
      setActiveInsight((prev) => (prev === k ? null : k));
      setSheetExpanded(true);

      if (k === "nearby" && userPos && mapApi) {
        mapApi.flyTo(userPos.lat, userPos.lng, 13);
      }
    },
    [mapApi, userPos]
  );

  const onSelectSpot = useCallback((id: string) => {
    setSelectedId(id);
    setSheetExpanded(false);
  }, []);

  const onQuickLog = useCallback((id: string) => {
    setSelectedId(id);
    setSheetExpanded(false);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.mapShell}>
        <LeafletMap
          spots={filteredSpots}
          userPos={userPos}
          selectedId={selectedId}
          onSelect={onSelectSpot}
          onMapReady={setMapApi}
          onVisibleChange={setVisibleIds}
        />

        {/* TOP HUD (overlay — må ikke skabe scroll) */}
        <div className={styles.hud}>
          <MapTopbar mode={mode} onToggleMode={onToggleMode} />
          <div className={styles.insights}>
            <InsightStrip
              mode={mode}
              active={activeInsight}
              insights={insights}
              onPick={onPickInsight}
            />
          </div>
        </div>

        {/* Peek card */}
        {selectedSpot && (
          <div className={styles.peekWrap}>
            <SpotPeekCard
              spot={selectedSpot}
              mode={mode}
              onClose={() => setSelectedId(null)}
              onLog={() => onQuickLog(selectedSpot.id)}
              onLearn={() => setSelectedId(null)}
            />
          </div>
        )}

        {/* Bottom sheet */}
        <div className={styles.sheetWrap}>
          <MapSheet
            mode={mode}
            expanded={sheetExpanded}
            onToggle={() => setSheetExpanded((v) => !v)}
            title={
              visibleIds?.length
                ? `${visibleIds.length} relevante spots i view`
                : "Flyt kortet for at finde spots"
            }
            items={visibleSpots}
            selectedId={selectedId}
            onSelect={(id) => {
              onSelectSpot(id);
              const s = spotsById.get(id);
              if (s && mapApi) mapApi.flyTo(s.lat, s.lng, Math.max(mapApi.getZoom(), 14));
            }}
            onLog={onQuickLog}
          />
        </div>
      </div>
    </div>
  );
}