"use client"; 

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
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
  const pathname = usePathname();
  const search = useSearchParams();

  const deepLinkHandledRef = useRef(false);
  const didAutoFocusRef = useRef(false);

  const locale = useMemo(() => (pathname?.split("/")[1] || "dk") as string, [pathname]);

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

  // single selected spot counts (rich)
  const [spotCounts, setSpotCounts] = useState<SpotCounts | null>(null);

  // batch counts for visible pins (light)
  const [countsMap, setCountsMap] = useState<Record<string, { total: number; qtr: number }>>({});

  // ✅ PROD empty-state: hvis spots er tomt (MapPage sætter [] i production)
  const isEmptyProd = spots.length === 0;

  // geolocation
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

  // auto focus when entering Sankemode
  useEffect(() => {
    if (mode !== "forage") return;
    if (!userPos || !mapApi) return;
    if (didAutoFocusRef.current) return;

    didAutoFocusRef.current = true;
    mapApi.flyTo(userPos.lat, userPos.lng, 13);
  }, [mode, userPos, mapApi]);

  const spotsById = useMemo(() => {
    const m = new Map<string, Spot>();
    for (const s of spots) m.set(String(s.id), s);
    return m;
  }, [spots]);

  const selectedSpot = useMemo(() => {
    if (!selectedId) return null;
    return spotsById.get(String(selectedId)) ?? null;
  }, [selectedId, spotsById]);

  const visibleSpots = useMemo(() => {
    if (!visibleIds.length) return [];
    return visibleIds.map((id) => spotsById.get(String(id))).filter(Boolean) as Spot[];
  }, [visibleIds, spotsById]);

  const insights = useMemo(() => {
    const total = spots.length;

    const nearbyCount = userPos
      ? spots.filter((s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2).length
      : 0;

    // heuristik til UI — ikke “sandhed”
    const seasonNowCount = Math.min(total, Math.max(0, Math.round(total * 0.35)));
    const peakCount = Math.min(total, Math.max(0, Math.round(total * 0.12)));

    return {
      season_now: { label: "I sæson nu", value: seasonNowCount, hint: "Arter" },
      peak: { label: "Peak", value: peakCount, hint: "I området" },
      nearby: { label: "Tæt på dig", value: nearbyCount, hint: "< 2 km" },
    } as const;
  }, [spots, userPos]);

  const filteredSpots = useMemo(() => {
    let base = spots;

    if (activeInsight === "nearby" && userPos) {
      base = base
        .map((s) => ({ s, d: haversineKm(userPos, { lat: s.lat, lng: s.lng }) }))
        .filter((x) => x.d <= 2)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.s);
    }

    // Sankemode: hvis valgt art → vis samme art
    if (mode === "forage" && selectedSpot?.species_slug) {
      base = base.filter((s) => s.species_slug === selectedSpot.species_slug);
    }

    return base;
  }, [spots, activeInsight, userPos, mode, selectedSpot?.species_slug]);

  const onToggleMode = useCallback(() => {
    didAutoFocusRef.current = false;

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
    [userPos, mapApi]
  );

  const onSelectSpot = useCallback(
    (id: string) => {
      const sid = String(id);
      setSelectedId(sid);
      setSheetExpanded(false);

      const s = spotsById.get(sid);
      if (!s || !mapApi) return;

      mapApi.flyTo(s.lat, s.lng, Math.max(mapApi.getZoom(), 14));
      mapApi.panBy?.(0, isDesktop() ? -80 : -140);
    },
    [mapApi, spotsById]
  );

  // Deep-links: ?spot=...
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!mapApi) return;
    if (!spotsById.size) return;

    const spot = search.get("spot");

    const trySelectSpot = (spotId: string | null | undefined) => {
      if (!spotId) return false;
      if (!spotsById.has(String(spotId))) return false;
      onSelectSpot(String(spotId));
      return true;
    };

    if (spot && trySelectSpot(spot)) {
      deepLinkHandledRef.current = true;
      return;
    }
  }, [search, mapApi, spotsById, onSelectSpot]);

  // fetch counts when selected spot changes
  useEffect(() => {
    if (!selectedSpot?.id) {
      setSpotCounts(null);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/spots/counts?spot_id=${encodeURIComponent(String(selectedSpot.id))}&fresh=1`,
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

  // quick log
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
            spot_id: String(spot.id),
            species_slug: spot.species_slug ?? null,
            observed_at: new Date().toISOString(),
            visibility: "public_aggregate",
            country: "DK",
            geo_precision_km: 1,
            photo_urls: [],
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Kunne ikke logge fund");

        setLogOk(true);

        // optimistic: bump batch counts
        setCountsMap((prev) => ({
          ...prev,
          [String(spot.id)]: {
            total: (prev[String(spot.id)]?.total ?? 0) + 1,
            qtr: (prev[String(spot.id)]?.qtr ?? 0) + 1,
          },
        }));

        // optimistic: bump selected counts if visible
        setSpotCounts((prev) =>
          prev
            ? { ...prev, total: prev.total + 1, qtr: prev.qtr + 1, last30: prev.last30 + 1 }
            : prev
        );

        window.setTimeout(() => setLogOk(false), 1200);
      } catch (e: any) {
        setLogError(e?.message ?? "Ukendt fejl");
        window.setTimeout(() => setLogError(null), 3500);
      } finally {
        setIsLogging(false);
      }
    },
    [isLogging]
  );

  // batch counts
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
      } catch {
        // ignore
      }
    })();

    return () => ac.abort();
  }, [debouncedVisibleIds]);

  const sortedVisibleSpots = useMemo(() => {
    const arr = visibleSpots.slice();
    arr.sort((a, b) => {
      const aq = countsMap[String(a.id)]?.qtr ?? 0;
      const bq = countsMap[String(b.id)]?.qtr ?? 0;

      if (mode === "forage" && userPos) {
        const ad = haversineKm(userPos, { lat: a.lat, lng: a.lng });
        const bd = haversineKm(userPos, { lat: b.lat, lng: b.lng });
        if (ad !== bd) return ad - bd;
      }

      return bq - aq;
    });
    return arr;
  }, [visibleSpots, countsMap, userPos, mode]);

  const sheetTitle = isPanning
    ? "Finder spots…"
    : visibleIds.length
    ? `${visibleIds.length} relevante spots i view`
    : "Flyt kortet for at finde spots";

  // ✅ counts til SpotPeekCard: brug rich counts hvis loaded, ellers batch-light counts
  const countsForSelected = useMemo(() => {
    if (!selectedSpot?.id) return null;

    if (spotCounts) return spotCounts;

    const lite = countsMap[String(selectedSpot.id)];
    if (!lite) return null;

    return {
      total: Number(lite.total ?? 0),
      qtr: Number(lite.qtr ?? 0),
      last30: 0,
      first_seen: null,
      last_seen: null,
    } satisfies SpotCounts;
  }, [selectedSpot?.id, spotCounts, countsMap]);

  return (
    <div className={styles.page}>
      <MapTopbar mode={mode} onToggleMode={onToggleMode} />
      <InsightStrip mode={mode} active={activeInsight} insights={insights} onPick={onPickInsight} />

      <div className={styles.desktopBody}>
        {/* DESKTOP PANEL */}
        <aside className={styles.desktopPanel}>
          {isEmptyProd ? (
            <div className={styles.emptyHint}>
              <p>
                <strong>Ingen spots endnu.</strong>
                <br />
                Log det første fund for at starte kortet.
              </p>
              <p style={{ marginTop: 10, opacity: 0.9 }}>
                Tip: Skift til <strong>Sankemode</strong> og log et fund.
              </p>
            </div>
          ) : mode === "forage" && sortedVisibleSpots.length === 0 ? (
            <div className={styles.emptyHint}>
              {!userPos ? (
                <p>
                  <strong>Aktivér lokation</strong> for at bruge Sankemode.
                </p>
              ) : (
                <p>
                  <strong>Ingen sikre fund &lt; 2 km.</strong>
                  <br />
                  Zoom ud eller flyt kortet.
                </p>
              )}
            </div>
          ) : selectedSpot ? (
            <SpotPeekCard
              spot={selectedSpot}
              mode={mode}
              userPos={userPos}
              counts={countsForSelected}
              isLogging={isLogging}
              logOk={logOk}
              onClose={() => setSelectedId(null)}
              onLog={() => void onQuickLog(selectedSpot)}
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
              onLog={(id) => {
                const s = spotsById.get(String(id));
                if (s && mode === "forage") void onQuickLog(s);
              }}
            />
          )}
        </aside>

        {/* MAP + MOBILE DOCK */}
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
            {isEmptyProd ? (
              <div className={styles.sheetWrap}>
                <div className={styles.emptyHint}>
                  <p>
                    <strong>Ingen spots endnu.</strong>
                    <br />
                    Log det første fund for at starte kortet.
                  </p>
                </div>
              </div>
            ) : selectedSpot ? (
              <div className={styles.peekWrap}>
                <SpotPeekCard
                  spot={selectedSpot}
                  mode={mode}
                  userPos={userPos}
                  counts={countsForSelected}
                  isLogging={isLogging}
                  logOk={logOk}
                  onClose={() => setSelectedId(null)}
                  onLog={() => void onQuickLog(selectedSpot)}
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
                  onSelect={onSelectSpot}
                  onLog={(id) => {
                    const s = spotsById.get(String(id));
                    if (s && mode === "forage") void onQuickLog(s);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {logError ? <div className={styles.toastError}>{logError}</div> : null}
      {isLogging ? <div className={styles.toastInfo}>Logger fund…</div> : null}
    </div>
  );
}
