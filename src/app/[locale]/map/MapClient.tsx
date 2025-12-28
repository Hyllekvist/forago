// src/app/[locale]/map/MapClient.tsx
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./MapClient.module.css";

import LeafletMap, { type Spot, type LeafletLikeMap } from "./LeafletMap";
import { MapTopbar } from "./ui/MapTopbar";
import { InsightStrip, type InsightKey } from "./ui/InsightStrip";
import { MapSheet } from "./ui/MapSheet";
import { SpotPeekCard } from "./ui/SpotPeekCard";

type Mode = "daily" | "forage";
type Props = { spots: Spot[] };

type SpotCounts = {
  total: number;
  qtr: number;
  last30: number;
  first_seen: string | null;
  last_seen: string | null;
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

function isDesktop() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
}

export default function MapClient({ spots }: Props) {
  const search = useSearchParams();
  const deepLinkHandledRef = useRef(false);

  const [mode, setMode] = useState<Mode>("daily");
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [debouncedVisibleIds, setDebouncedVisibleIds] = useState<string[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const [isPanning, setIsPanning] = useState(false);

  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [logOk, setLogOk] = useState(false);

  const [spotCounts, setSpotCounts] = useState<SpotCounts | null>(null);
  const [countsMap, setCountsMap] = useState<Record<string, { total: number; qtr: number }>>({});

  // --- geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  // debounce visible ids
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedVisibleIds(visibleIds), 250);
    return () => window.clearTimeout(t);
  }, [visibleIds]);

  const insights = useMemo(() => {
    const total = spots.length;
    const nearbyCount = userPos
      ? spots.filter((s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2).length
      : 0;

    return {
      season_now: { label: "I sæson nu", value: Math.round(total * 0.35), hint: "Arter" },
      peak: { label: "Peak", value: Math.round(total * 0.12), hint: "I området" },
      nearby: { label: "Tæt på dig", value: nearbyCount, hint: "< 2 km" },
    } as const;
  }, [spots, userPos]);

  const spotsById = useMemo(() => {
    const m = new Map<string, Spot>();
    spots.forEach((s) => m.set(s.id, s));
    return m;
  }, [spots]);

  const selectedSpot = useMemo(
    () => (selectedId ? spotsById.get(selectedId) ?? null : null),
    [selectedId, spotsById]
  );

  const visibleSpots = useMemo(
    () => visibleIds.map((id) => spotsById.get(id)).filter(Boolean) as Spot[],
    [visibleIds, spotsById]
  );

  // filtering
  const filteredSpots = useMemo(() => {
    let base = spots;

    if (activeInsight === "nearby" && userPos) {
      base = base
        .map((s) => ({ s, d: haversineKm(userPos, { lat: s.lat, lng: s.lng }) }))
        .filter((x) => x.d <= 2)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s);
    }

    if (mode === "forage" && selectedSpot?.species_slug) {
      base = base.filter((s) => s.species_slug === selectedSpot.species_slug);
    }

    return base;
  }, [spots, activeInsight, userPos, mode, selectedSpot?.species_slug]);

  // toggle mode (Sankemode gør noget)
  const onToggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "daily" ? "forage" : "daily";
      if (next === "forage" && userPos) setActiveInsight("nearby");
      else setActiveInsight(null);
      return next;
    });

    setSheetExpanded(false);
    setSelectedId(null);
    setSpotCounts(null);
    setLogOk(false);
    setLogError(null);
  }, [userPos]);

  const onPickInsight = useCallback(
    (k: InsightKey) => {
      setActiveInsight((prev) => (prev === k ? null : k));
      setSheetExpanded(true);
      setSelectedId(null);
      setSpotCounts(null);

      if (k === "nearby" && userPos && mapApi) {
        mapApi.flyTo(userPos.lat, userPos.lng, 13);
      }
    },
    [mapApi, userPos]
  );

  const onSelectSpot = useCallback(
    (id: string) => {
      setSelectedId(id);
      setSheetExpanded(false);

      const s = spotsById.get(id);
      if (!s || !mapApi) return;

      mapApi.flyTo(s.lat, s.lng, Math.max(mapApi.getZoom(), 14));
      mapApi.panBy?.(0, isDesktop() ? -80 : -140);
    },
    [mapApi, spotsById]
  );

  // deep links
  useEffect(() => {
    if (deepLinkHandledRef.current || !mapApi || !spotsById.size) return;

    const spot = search.get("spot");
    if (spot && spotsById.has(spot)) {
      onSelectSpot(spot);
      deepLinkHandledRef.current = true;
    }
  }, [search, mapApi, spotsById, onSelectSpot]);

  // counts for selected
  useEffect(() => {
    if (!selectedSpot?.id) {
      setSpotCounts(null);
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/spots/counts?spot_id=${selectedSpot.id}`, { signal: ac.signal });
        const json = await res.json();
        if (!res.ok || !json?.ok) return;

        setSpotCounts({
          total: Number(json.total ?? 0),
          qtr: Number(json.qtr ?? 0),
          last30: Number(json.last30 ?? 0),
          first_seen: json.first_seen ?? null,
          last_seen: json.last_seen ?? null,
        });
      } catch {}
    })();

    return () => ac.abort();
  }, [selectedSpot?.id]);

  // batch counts (debounced)
  useEffect(() => {
    if (!debouncedVisibleIds.length) return;
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/spots/counts-batch?spot_ids=${encodeURIComponent(debouncedVisibleIds.join(","))}`,
          { signal: ac.signal }
        );
        const json = await res.json();
        if (!res.ok || !json?.ok || !json.map) return;

        setCountsMap((prev) => ({ ...prev, ...json.map }));
      } catch {}
    })();

    return () => ac.abort();
  }, [debouncedVisibleIds]);

  const sortedVisibleSpots = useMemo(() => {
    const arr = visibleSpots.slice();
    arr.sort((a, b) => {
      const aq = countsMap[a.id]?.qtr ?? 0;
      const bq = countsMap[b.id]?.qtr ?? 0;

      if (mode === "forage" && userPos) {
        const ad = haversineKm(userPos, { lat: a.lat, lng: a.lng });
        const bd = haversineKm(userPos, { lat: b.lat, lng: b.lng });
        if (ad !== bd) return ad - bd;
      }
      return bq - aq;
    });
    return arr;
  }, [visibleSpots, countsMap, userPos, mode]);

  const sheetTitle =
    isPanning ? "Finder spots…" :
    visibleIds.length ? `${visibleIds.length} relevante spots i view` :
    "Flyt kortet for at finde spots";

  return (
    <div className={styles.page}>
      <MapTopbar mode={mode} onToggleMode={onToggleMode} />

      <InsightStrip mode={mode} active={activeInsight} insights={insights} onPick={onPickInsight} />

      <div className={styles.desktopBody}>
        <aside className={styles.desktopPanel}>
          <div className={styles.panelInner}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>{sheetTitle}</div>
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setSelectedId(null);
                  setSpotCounts(null);
                  setSheetExpanded(true);
                }}
              >
                Nulstil
              </button>
            </div>

            {mode === "forage" && sortedVisibleSpots.length === 0 ? (
              <div className={styles.emptyHint}>
                {!userPos ? (
                  <p><strong>Aktivér lokation</strong> for at bruge Sankemode.</p>
                ) : (
                  <p>
                    <strong>Ingen sikre fund &lt; 2 km.</strong><br />
                    Zoom ud, flyt kortet, eller skift til <em>I dag</em>.
                  </p>
                )}
              </div>
            ) : selectedSpot ? (
              <SpotPeekCard
                spot={selectedSpot}
                mode={mode}
                userPos={userPos}
                counts={spotCounts}
                isLogging={isLogging}
                logOk={logOk}
                onClose={() => setSelectedId(null)}
                onLog={() => {}}
                onLearn={() => setSelectedId(null)}
              />
            ) : (
              <MapSheet
                mode={mode}
                expanded
                onToggle={() => {}}
                title={sheetTitle}
                items={sortedVisibleSpots}
                selectedId={selectedId}
                onSelect={onSelectSpot}
                onLog={() => {}}
              />
            )}
          </div>
        </aside>

        <div className={styles.mapShell}>
          <LeafletMap
            spots={filteredSpots}
            userPos={userPos}
            selectedId={selectedId}
            onSelect={onSelectSpot}
            onMapReady={setMapApi}
            onVisibleChange={setVisibleIds}
            onPanningChange={setIsPanning}
          />
        </div>
      </div>
    </div>
  );
}