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
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const [isPanning, setIsPanning] = useState(false);

  // logging feedback
  const [isLogging, setIsLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [logOk, setLogOk] = useState(false);

  // selected spot counts
  const [spotCounts, setSpotCounts] = useState<SpotCounts | null>(null);

  // batch counts for visible list (used for sorting)
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

  const insights = useMemo(() => {
    const total = spots.length;

    const nearbyCount = userPos
      ? spots.filter((s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2).length
      : 0;

    // placeholders (kan senere blive “rigtige”)
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

  const selectedSpot = useMemo(() => {
    return selectedId ? spotsById.get(selectedId) ?? null : null;
  }, [selectedId, spotsById]);

  const visibleSpots = useMemo(() => {
    if (!visibleIds?.length) return [];
    return visibleIds.map((id) => spotsById.get(id)).filter(Boolean) as Spot[];
  }, [visibleIds, spotsById]);

  // ✅ filteredSpots: insight-filter + sankemode-focus (samme art som valgt spot)
  const filteredSpots = useMemo(() => {
    let base = spots;

    if (activeInsight === "nearby" && userPos) {
      base = base
        .map((s) => ({ s, d: haversineKm(userPos, { lat: s.lat, lng: s.lng }) }))
        .filter((x) => x.d <= 2)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s);
    }

    // ✅ Sankemode: hvis du har valgt et spot med art, så fokusér på samme art
    if (mode === "forage" && selectedSpot?.species_slug) {
      base = base.filter((s) => s.species_slug === selectedSpot.species_slug);
    }

    return base;
  }, [spots, activeInsight, userPos, mode, selectedSpot?.species_slug]);

const onToggleMode = useCallback(() => {
  setMode((m) => {
    const next = m === "daily" ? "forage" : "daily";

    // Sankemode = praktisk fokus
    if (next === "forage") {
      if (userPos) setActiveInsight("nearby");
      else setActiveInsight(null);
    } else {
      // Daily = bredt overblik
      setActiveInsight(null);
    }

    return next;
  });

  // reset for klar UI
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

      const targetZoom = Math.max(mapApi.getZoom(), 14);
      mapApi.flyTo(s.lat, s.lng, targetZoom);

      const dy = isDesktop() ? -80 : -140;
      mapApi.panBy?.(0, dy);
    },
    [mapApi, spotsById]
  );

  // ✅ Deep-links:
  // /map?spot=<id> -> select spot
  // /map?find=<uuid> -> fetch spot_id, then select spot
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!mapApi) return;
    if (!spotsById.size) return;

    const spot = search.get("spot");
    const findId = search.get("find");

    const trySelectSpot = (spotId: string | null | undefined) => {
      if (!spotId) return false;
      if (!spotsById.has(spotId)) return false;
      onSelectSpot(spotId);
      return true;
    };

    if (spot && trySelectSpot(spot)) {
      deepLinkHandledRef.current = true;
      return;
    }

    if (findId) {
      deepLinkHandledRef.current = true;

      (async () => {
        try {
          const urls = [
            `/api/finds/detail?find_id=${encodeURIComponent(findId)}`,
            `/api/finds/detail?id=${encodeURIComponent(findId)}`,
          ];

          for (const url of urls) {
            const res = await fetch(url);
            if (!res.ok) continue;
            const json = await res.json();

            const spotId =
              json?.find_detail?.find?.spot_id ??
              json?.find?.spot_id ??
              json?.spot_id ??
              null;

            if (trySelectSpot(spotId)) return;
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [search, mapApi, spotsById, onSelectSpot]);

  // ✅ fetch counts whenever selected spot changes
  useEffect(() => {
    if (!selectedSpot?.id) {
      setSpotCounts(null);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/spots/counts?spot_id=${encodeURIComponent(selectedSpot.id)}&fresh=1`,
          { signal: ac.signal }
        );
        const json = await res.json();
        if (!res.ok || !json?.ok) return;

        setSpotCounts({
          total: Number(json.total ?? 0),
          qtr: Number(json.qtr ?? 0),
          last30: Number(json.last30 ?? 0),
          first_seen: (json.first_seen ?? null) as string | null,
          last_seen: (json.last_seen ?? null) as string | null,
        });
      } catch {
        // ignore
      }
    })();

    return () => ac.abort();
  }, [selectedSpot?.id]);

  // batch counts for visible list (used for sorting)
  useEffect(() => {
    if (!visibleIds?.length) return;

    const ids = visibleIds.slice(0, 200);
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/spots/counts-batch?spot_ids=${encodeURIComponent(ids.join(","))}`,
          { signal: ac.signal }
        );
        const json = await res.json();
        if (!res.ok || !json?.ok || !json?.map) return;

        setCountsMap((prev) => ({
          ...prev,
          ...(json.map as Record<string, { total: number; qtr: number }>),
        }));
      } catch {
        // ignore
      }
    })();

    return () => ac.abort();
  }, [visibleIds]);

  // ✅ mode påvirker sortering:
  // Daily: qtr først (popularitet/stabilitet), så distance.
  // Sankemode: distance først (praktisk), så qtr.
  const sortedVisibleSpots = useMemo(() => {
    const arr = visibleSpots.slice();

    arr.sort((a, b) => {
      const aq = countsMap[a.id]?.qtr ?? 0;
      const bq = countsMap[b.id]?.qtr ?? 0;

      if (mode === "forage") {
        if (userPos) {
          const ad = haversineKm(userPos, { lat: a.lat, lng: a.lng });
          const bd = haversineKm(userPos, { lat: b.lat, lng: b.lng });
          if (ad !== bd) return ad - bd;
        }
        if (bq !== aq) return bq - aq;
        return 0;
      }

      // daily
      if (bq !== aq) return bq - aq;
      if (userPos) {
        const ad = haversineKm(userPos, { lat: a.lat, lng: a.lng });
        const bd = haversineKm(userPos, { lat: b.lat, lng: b.lng });
        return ad - bd;
      }
      return 0;
    });

    return arr;
  }, [visibleSpots, countsMap, userPos, mode]);

  const onQuickLog = useCallback(
    async (spot: Spot) => {
      if (isLogging) return;

      try {
        setIsLogging(true);
        setLogError(null);
        setLogOk(false);

        const res = await fetch("/api/finds/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: spot.id,
            species_slug: spot.species_slug ?? null,
            observed_at: new Date().toISOString(),
            visibility: "public_aggregate",
            notes: null,
            country: "DK",
            geo_precision_km: 1,
            photo_urls: [],
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "Kunne ikke logge fund");
        }

        setLogOk(true);

        // ✅ optimistic update for selected spot counts
        setSpotCounts((prev) => {
          const nowIso = new Date().toISOString();
          if (!prev) {
            return { total: 1, qtr: 1, last30: 1, first_seen: nowIso, last_seen: nowIso };
          }
          return {
            ...prev,
            total: prev.total + 1,
            qtr: prev.qtr + 1,
            last30: prev.last30 + 1,
            first_seen: prev.first_seen ?? nowIso,
            last_seen: nowIso,
          };
        });

        // ✅ optimistic update for list sorting map (qtr/total)
        setCountsMap((prev) => ({
          ...prev,
          [spot.id]: {
            total: (prev[spot.id]?.total ?? 0) + 1,
            qtr: (prev[spot.id]?.qtr ?? 0) + 1,
          },
        }));

        window.setTimeout(() => {
          setSelectedId(null);
          setLogOk(false);
        }, 1200);
      } catch (e: any) {
        setLogError(e?.message ?? "Ukendt fejl");
        window.setTimeout(() => setLogError(null), 3500);
      } finally {
        setIsLogging(false);
      }
    },
    [isLogging]
  );

  const sheetTitle =
    isPanning ? "Finder spots…" : visibleIds?.length ? `${visibleIds.length} relevante spots i view` : "Flyt kortet for at finde spots";

  return (
    <div className={styles.page}>
      <MapTopbar mode={mode} onToggleMode={onToggleMode} />

      <InsightStrip
        mode={mode}
        active={activeInsight}
        insights={insights}
        onPick={onPickInsight}
      />

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
                type="button"
              >
                Nulstil
              </button>
            </div>

            {selectedSpot ? (
              <SpotPeekCard
                spot={selectedSpot}
                mode={mode}
                userPos={userPos}
                counts={spotCounts}
                isLogging={isLogging}
                logOk={logOk}
                onClose={() => setSelectedId(null)}
                onLog={() => void onQuickLog(selectedSpot)}
                onLearn={() => setSelectedId(null)}
              />
            ) : (
              <div className={styles.desktopListWrap}>
                <MapSheet
                  mode={mode}
                  expanded={true}
                  onToggle={() => {}}
                  title={sheetTitle}
                  items={sortedVisibleSpots}
                  selectedId={selectedId}
                  onSelect={(id) => onSelectSpot(id)}
                  onLog={(id: string) => {
                    const s = spotsById.get(id);
                    if (s) void onQuickLog(s);
                  }}
                />
              </div>
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

          <div className={styles.mobileDock}>
            {selectedSpot ? (
              <div className={styles.peekWrap}>
                <SpotPeekCard
                  spot={selectedSpot}
                  mode={mode}
                  userPos={userPos}
                  counts={spotCounts}
                  isLogging={isLogging}
                  logOk={logOk}
                  onClose={() => setSelectedId(null)}
                  onLog={() => void onQuickLog(selectedSpot)}
                  onLearn={() => setSelectedId(null)}
                />
              </div>
            ) : (
              <div className={styles.sheetWrap}>
                <MapSheet
                  mode={mode}
                  expanded={sheetExpanded}
                  onToggle={() => setSheetExpanded((v) => !v)}
                  title={sheetTitle}
                  items={sortedVisibleSpots}
                  selectedId={selectedId}
                  onSelect={(id) => onSelectSpot(id)}
                  onLog={(id: string) => {
                    const s = spotsById.get(id);
                    if (s) void onQuickLog(s);
                  }}
                />
              </div>
            )}
          </div>

          {logError ? <div className={styles.toastError}>{logError}</div> : null}
          {isLogging ? <div className={styles.toastInfo}>Logger fund…</div> : null}
        </div>
      </div>
    </div>
  );
}
