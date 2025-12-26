// src/app/[locale]/map/MapClient.tsx
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

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      s2 *
      s2;
  return 2 * R * Math.asin(Math.sqrt(q));
}

export default function MapClient({ spots }: Props) {
  const [mode, setMode] = useState<Mode>("daily");
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // UX: vis "Finder spots…" mens man pan/zoomer (kræver at LeafletMap kalder onPanningChange)
  const [isPanning, setIsPanning] = useState(false);

  // Log feedback
  const [logState, setLogState] = useState<{
    spotId: string | null;
    status: "idle" | "saving" | "saved" | "error";
    msg?: string;
  }>({ spotId: null, status: "idle" });

  // --- geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  // --- insights (MVP)
  const insights = useMemo(() => {
    const total = spots.length;

    const nearbyCount = userPos
      ? spots.filter(
          (s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2
        ).length
      : 0;

    // placeholders indtil vi har seasonality model
    const seasonNowCount = Math.min(
      total,
      Math.max(0, Math.round(total * 0.35))
    );
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

  const selectedSpot = useMemo(() => {
    return selectedId ? spotsById.get(selectedId) ?? null : null;
  }, [selectedId, spotsById]);

  const visibleSpots = useMemo(() => {
    if (!visibleIds?.length) return [];
    return visibleIds.map((id) => spotsById.get(id)).filter(Boolean) as Spot[];
  }, [visibleIds, spotsById]);

  const filteredSpots = useMemo(() => {
    if (!activeInsight) return spots;

    if (activeInsight === "nearby" && userPos) {
      return spots
        .map((s) => ({ s, d: haversineKm(userPos, { lat: s.lat, lng: s.lng }) }))
        .filter((x) => x.d <= 2)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s);
    }

    // MVP: season_now/peak filtrerer ikke hårdt endnu
    return spots;
  }, [spots, activeInsight, userPos]);

  const onToggleMode = useCallback(() => {
    setMode((m) => (m === "daily" ? "forage" : "daily"));
    setSheetExpanded(false);
    setSelectedId(null);
    setActiveInsight(null);
  }, []);

  const onPickInsight = useCallback(
    (k: InsightKey) => {
      setActiveInsight((prev) => (prev === k ? null : k));
      setSheetExpanded(true);
      setSelectedId(null);

      if (k === "nearby" && userPos && mapApi) {
        mapApi.flyTo(userPos.lat, userPos.lng, 13);
      }
    },
    [mapApi, userPos]
  );

  // ✅ Når man vælger et spot: zoom ind + løft pin visuelt over bottomDock
  const onSelectSpot = useCallback(
    (id: string) => {
      setSelectedId(id);
      setSheetExpanded(false);

      const s = spotsById.get(id);
      if (!s || !mapApi) return;

      const targetZoom = Math.max(mapApi.getZoom(), 14);
      mapApi.flyTo(s.lat, s.lng, targetZoom);

      // Hvis du har panBy i LeafletLikeMap, så løft markeren lidt op
      mapApi.panBy?.(0, -140);
    },
    [mapApi, spotsById]
  );

  // ✅ Log fund med synlig feedback + fejl
  const onQuickLog = useCallback(async (spotId: string) => {
    try {
      setLogState({ spotId, status: "saving" });

      // Du kan skifte endpoint senere – her er det “ren” API flow.
      await fetch("/api/finds/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    species_id: selectedSpot.species_id,
    observed_at: new Date().toISOString(),
    visibility: "private",
  }),
});

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        console.error("[log] failed", res.status, json);
        setLogState({
          spotId,
          status: "error",
          msg: json?.error ?? `HTTP ${res.status}`,
        });
        return;
      }

      setLogState({ spotId, status: "saved" });

      // UX: luk peek card efter success (kan fjernes)
      setTimeout(() => {
        setSelectedId(null);
        setLogState({ spotId: null, status: "idle" });
      }, 650);
    } catch (e: any) {
      console.error("[log] exception", e);
      setLogState({
        spotId,
        status: "error",
        msg: e?.message ?? "Unknown error",
      });
    }
  }, []);

  const sheetTitle = isPanning
    ? "Finder spots…"
    : visibleIds?.length
      ? `${visibleIds.length} relevante spots i view`
      : "Flyt kortet for at finde spots";

  return (
    <div className={styles.page}>
      <MapTopbar mode={mode} onToggleMode={onToggleMode} />

      <InsightStrip
        mode={mode}
        active={activeInsight}
        insights={insights}
        onPick={onPickInsight}
      />

      <div className={styles.mapShell}>
        <LeafletMap
          spots={filteredSpots}
          userPos={userPos}
          selectedId={selectedId}
          onSelect={onSelectSpot}
          onMapReady={setMapApi}
          onVisibleChange={setVisibleIds}
          // kræver at LeafletMap implementerer det – ellers fjern linjen
          onPanningChange={setIsPanning}
        />

        <div className={styles.bottomDock}>
          {selectedSpot ? (
            <>
              <SpotPeekCard
                spot={selectedSpot}
                mode={mode}
                userPos={userPos}
                onClose={() => setSelectedId(null)}
                onLog={() => void onQuickLog(selectedSpot.id)}
                onLearn={() => setSelectedId(null)}
              />

              {/* minimal feedback overlay (kun når peek er åbent) */}
              {logState.spotId === selectedSpot.id &&
              logState.status !== "idle" ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "color-mix(in srgb, var(--panel) 82%, transparent)",
                    color: "var(--muted)",
                    fontSize: 12,
                    pointerEvents: "auto",
                  }}
                  role="status"
                  aria-live="polite"
                >
                  {logState.status === "saving" && "Gemmer…"}
                  {logState.status === "saved" && "Gemt ✅"}
                  {logState.status === "error" &&
                    `Kunne ikke gemme: ${logState.msg ?? "ukendt fejl"}`}
                </div>
              ) : null}
            </>
          ) : (
            <MapSheet
              mode={mode}
              expanded={sheetExpanded}
              onToggle={() => setSheetExpanded((v) => !v)}
              title={sheetTitle}
              items={visibleSpots}
              selectedId={selectedId}
              onSelect={(id) => onSelectSpot(id)}
              onLog={(id) => void onQuickLog(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}