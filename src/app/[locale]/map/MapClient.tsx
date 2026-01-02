"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import styles from "./MapClient.module.css";

import LeafletMap, { type Spot, type LeafletLikeMap } from "./LeafletMap";
import { MapTopbar } from "./ui/MapTopbar";
import { InsightStrip, type InsightKey } from "./ui/InsightStrip";
import { MapSheet } from "./ui/MapSheet";
import { SpotPeekCard } from "./ui/SpotPeekCard";
import { DropSpotSheet } from "./ui/DropSpotSheet";

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

function isDesktopNow() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
}

function safeParseDrop(
  raw: string | null
): { lat: number; lng: number; name?: string; speciesSlug?: string | null } | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    const lat = Number(obj?.lat);
    const lng = Number(obj?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      name: typeof obj?.name === "string" ? obj.name : undefined,
      speciesSlug:
        typeof obj?.speciesSlug === "string" ? obj.speciesSlug : obj?.speciesSlug === null ? null : undefined,
    };
  } catch {
    return null;
  }
}

export default function MapClient({ spots }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const deepLinkHandledRef = useRef(false);
  const didAutoFocusRef = useRef(false);
  const restoredDropRef = useRef(false);

  const locale = useMemo(() => {
    const raw = (pathname?.split("/")[1] || "dk") as string;
    return raw === "dk" || raw === "en" ? raw : "dk";
  }, [pathname]);

  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(`/${locale}/season`);
  }, [router, locale]);

  const [mode, setMode] = useState<Mode>("daily");
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapApi, setMapApi] = useState<LeafletLikeMap | null>(null);

  const [isAuthed, setIsAuthed] = useState(false);

  const [spotsLocal, setSpotsLocal] = useState<Spot[]>(spots);
  useEffect(() => setSpotsLocal(spots), [spots]);

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

  const [drop, setDrop] = useState<{ lat: number; lng: number } | null>(null);
  const [dropBusy, setDropBusy] = useState(false);
  const [dropErr, setDropErr] = useState<string | null>(null);

  const isEmptyProd = spotsLocal.length === 0;

  const [topCollapsed, setTopCollapsed] = useState(false);
  useEffect(() => {
    const shouldCollapse = isPanning || (!isDesktopNow() && sheetExpanded);
    setTopCollapsed(shouldCollapse);
  }, [isPanning, sheetExpanded]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await res.json();
        if (!alive) return;
        setIsAuthed(!!j?.authed);
      } catch {
        if (!alive) return;
        setIsAuthed(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedVisibleIds(visibleIds), 250);
    return () => window.clearTimeout(t);
  }, [visibleIds]);

  useEffect(() => {
    if (mode !== "forage") return;
    if (!userPos || !mapApi) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    mapApi.flyTo(userPos.lat, userPos.lng, 13);
  }, [mode, userPos, mapApi]);

  const spotsById = useMemo(() => {
    const m = new Map<string, Spot>();
    for (const s of spotsLocal) m.set(String(s.id), s);
    return m;
  }, [spotsLocal]);

  const selectedSpot = useMemo(() => {
    if (!selectedId) return null;
    return spotsById.get(String(selectedId)) ?? null;
  }, [selectedId, spotsById]);

  const visibleSpots = useMemo(() => {
    if (!visibleIds.length) return [];
    return visibleIds.map((id) => spotsById.get(String(id))).filter(Boolean) as Spot[];
  }, [visibleIds, spotsById]);

  const insights = useMemo(() => {
    const total = spotsLocal.length;
    const nearbyCount = userPos
      ? spotsLocal.filter((s) => haversineKm(userPos, { lat: s.lat, lng: s.lng }) <= 2).length
      : 0;

    const seasonNowCount = Math.min(total, Math.max(0, Math.round(total * 0.35)));
    const peakCount = Math.min(total, Math.max(0, Math.round(total * 0.12)));

    return {
      season_now: { label: "I sæson nu", value: seasonNowCount, hint: "Arter" },
      peak: { label: "Peak", value: peakCount, hint: "I området" },
      nearby: { label: "Tæt på dig", value: nearbyCount, hint: "< 2 km" },
    } as const;
  }, [spotsLocal, userPos]);

  const filteredSpots = useMemo(() => {
    let base = spotsLocal;

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
  }, [spotsLocal, activeInsight, userPos, mode, selectedSpot?.species_slug]);

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

    setDrop(null);
    setDropErr(null);
    setDropBusy(false);
  }, [userPos]);

  const onPickInsight = useCallback(
    (k: InsightKey) => {
      setActiveInsight((prev) => (prev === k ? null : k));
      setSheetExpanded(true);

      setSelectedId(null);
      setSpotCounts(null);
      setDrop(null);
      setDropErr(null);

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

      if (!isDesktopNow()) setSheetExpanded(false);

      setDrop(null);
      setDropErr(null);

      const s = spotsById.get(sid);
      if (!s || !mapApi) return;

      mapApi.flyTo(s.lat, s.lng, Math.max(mapApi.getZoom(), 14));
      mapApi.panBy?.(0, isDesktopNow() ? -60 : -140);
    },
    [mapApi, spotsById]
  );

  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!mapApi) return;
    if (!spotsById.size) return;

    const spot = search.get("spot");
    if (spot && spotsById.has(String(spot))) {
      onSelectSpot(String(spot));
      deepLinkHandledRef.current = true;
    }
  }, [search, mapApi, spotsById, onSelectSpot]);

  useEffect(() => {
    if (restoredDropRef.current) return;
    const raw = search.get("drop");
    const parsed = safeParseDrop(raw);
    if (!parsed) return;

    restoredDropRef.current = true;

    setMode("forage");
    setActiveInsight(null);

    setDrop({ lat: parsed.lat, lng: parsed.lng });
    setDropErr(null);
    setSelectedId(null);
    setSpotCounts(null);
    setSheetExpanded(false);

    if (mapApi) {
      mapApi.flyTo(parsed.lat, parsed.lng, Math.max(mapApi.getZoom(), 14));
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("drop");
    window.history.replaceState({}, "", url.toString());
  }, [search, mapApi]);

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
      } catch {}
    })();

    return () => ac.abort();
  }, [selectedSpot?.id]);

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

        setCountsMap((prev) => ({
          ...prev,
          [String(spot.id)]: {
            total: (prev[String(spot.id)]?.total ?? 0) + 1,
            qtr: (prev[String(spot.id)]?.qtr ?? 0) + 1,
          },
        }));

        setSpotCounts((prev) =>
          prev ? { ...prev, total: prev.total + 1, qtr: prev.qtr + 1, last30: prev.last30 + 1 } : prev
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

        const incoming = json.map as Record<string, { total: number; qtr: number }>;

        setCountsMap((prev) => {
          const next = { ...prev };
          for (const [id, v] of Object.entries(incoming)) {
            const p = next[id];
            next[id] = {
              total: Math.max(p?.total ?? 0, Number(v?.total ?? 0)),
              qtr: Math.max(p?.qtr ?? 0, Number(v?.qtr ?? 0)),
            };
          }
          return next;
        });
      } catch {}
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

  const spotsForMap = useMemo(() => {
    const hasCounts = Object.keys(countsMap).length > 0;
    if (!hasCounts) return filteredSpots;

    const hasPublic = (id: string) => {
      const c = countsMap[id];
      const total = c?.total ?? 0;
      const qtr = c?.qtr ?? 0;
      return total > 0 || qtr > 0;
    };

    if (mode === "forage") return filteredSpots;

    return filteredSpots.filter((s) => {
      const id = String(s.id);
      if (selectedId && id === String(selectedId)) return true;
      return hasPublic(id);
    });
  }, [filteredSpots, countsMap, mode, selectedId]);

  const recommendedSpot = useMemo(() => {
    if (!userPos) return null;

    const candidates = filteredSpots;
    if (!candidates.length) return null;

    let best: { spot: Spot; score: number } | null = null;

    for (const s of candidates) {
      const dKm = haversineKm(userPos, { lat: s.lat, lng: s.lng });
      if (dKm > 6) continue;

      const qtr = countsMap[String(s.id)]?.qtr ?? 0;
      const score = (1 / Math.max(0.25, dKm)) * 10 + qtr * 0.35;

      if (!best || score > best.score) best = { spot: s, score };
    }

    return best?.spot ?? null;
  }, [userPos, filteredSpots, countsMap]);

  const onGoRecommended = useCallback(() => {
    if (!recommendedSpot || !mapApi) return;

    setSelectedId(String(recommendedSpot.id));
    setDrop(null);
    setDropErr(null);
    setSpotCounts(null);

    mapApi.flyTo(recommendedSpot.lat, recommendedSpot.lng, Math.max(mapApi.getZoom(), 14));
    mapApi.panBy?.(0, isDesktopNow() ? -60 : -140);

    if (!isDesktopNow()) setSheetExpanded(false);
  }, [recommendedSpot, mapApi]);

  const onRequireAuth = useCallback(
    (payload: { lat: number; lng: number; name: string; speciesSlug: string | null }) => {
      const returnTo = `${pathname}${search?.toString() ? `?${search.toString()}` : ""}`;

      const qs = new URLSearchParams();
      qs.set("returnTo", returnTo);
      qs.set("drop", JSON.stringify(payload));

      window.location.href = `/${locale}/login?${qs.toString()}`;
    },
    [locale, pathname, search]
  );

  const onMapClick = useCallback(
    (p: { lat: number; lng: number }) => {
      if (mode !== "forage") return;

      if (!isAuthed) {
        return onRequireAuth({ lat: p.lat, lng: p.lng, name: "Nyt spot", speciesSlug: null });
      }

      setDrop(p);
      setDropErr(null);
      setSelectedId(null);
      setSpotCounts(null);
      setSheetExpanded(false);
    },
    [mode, isAuthed, onRequireAuth]
  );

  const onCreateAndLogFromDrop = useCallback(
    async ({ name, speciesSlug }: { name: string; speciesSlug: string | null }) => {
      if (!drop) return;
      if (dropBusy) return;

      try {
        setDropBusy(true);
        setDropErr(null);

        const resPlace = await fetch("/api/places/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: drop.lat,
            lng: drop.lng,
            name,
            country: "dk",
            region: "",
            habitat: "unknown",
            description: "",
            ...(speciesSlug ? { species_slug: speciesSlug } : {}),
            confidence: 60,
          }),
        });

        const jPlace = await resPlace.json();
        if (!resPlace.ok || !jPlace?.ok || !jPlace?.place?.slug) {
          throw new Error(jPlace?.error ?? "Kunne ikke oprette spot");
        }

        const place = jPlace.place as { slug: string; name: string; lat: number; lng: number };

        if (mapApi) {
          mapApi.flyTo(place.lat, place.lng, Math.max(mapApi.getZoom(), 14));
          mapApi.panBy?.(0, isDesktopNow() ? -60 : -140);
        }

        const resFind = await fetch("/api/finds/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spot_id: place.slug,
            species_slug: speciesSlug ?? null,
            observed_at: new Date().toISOString(),
            visibility: "public_aggregate",
            country: "DK",
            geo_precision_km: 1,
            photo_urls: [],
          }),
        });

        const jFind = await resFind.json();
        if (!resFind.ok || !jFind?.ok) {
          throw new Error(jFind?.error ?? "Kunne ikke logge fund");
        }

        const newSpot: Spot = {
          id: place.slug,
          lat: Number(place.lat),
          lng: Number(place.lng),
          title: place.name ?? "Nyt spot",
          species_slug: speciesSlug ?? null,
        };

        setSpotsLocal((prev) => {
          if (prev.some((s) => String(s.id) === String(newSpot.id))) return prev;
          return [newSpot, ...prev];
        });

        setCountsMap((prev) => ({
          ...prev,
          [String(newSpot.id)]: {
            total: Math.max(prev[String(newSpot.id)]?.total ?? 0, 1),
            qtr: Math.max(prev[String(newSpot.id)]?.qtr ?? 0, 1),
          },
        }));

        setSelectedId(String(newSpot.id));
        setDrop(null);

        setLogOk(true);
        window.setTimeout(() => setLogOk(false), 1200);
      } catch (e: any) {
        setDropErr(e?.message ?? "Ukendt fejl");
      } finally {
        setDropBusy(false);
      }
    },
    [drop, dropBusy, mapApi]
  );

  const mobileDockMode: "peek" | "sheet" | "none" = useMemo(() => {
    if (drop) return "none";
    if (selectedSpot) return "peek";
    return "sheet";
  }, [drop, selectedSpot]);

  return (
    <div
      className={styles.page}
      data-sheet-open={sheetExpanded ? "1" : "0"}
      data-mobile-dock={mobileDockMode}
      data-top-collapsed={topCollapsed ? "1" : "0"}
    >
      <div className={styles.topWrap}>
        <MapTopbar mode={mode} onToggleMode={onToggleMode} onBack={onBack} />
        <InsightStrip mode={mode} active={activeInsight} insights={insights} onPick={onPickInsight} />
      </div>

      <div className={styles.desktopBody}>
        <aside className={styles.desktopLeft}>
          <div className={styles.panelInner}>
            {isEmptyProd ? (
              <div className={styles.emptyHint}>
                <p>
                  <strong>Ingen spots endnu.</strong>
                  <br />
                  Skift til <strong>Sankemode</strong> og klik på kortet for at oprette første spot.
                </p>
              </div>
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
          </div>
        </aside>

        <div className={styles.mapShell}>
          <LeafletMap
            spots={spotsForMap}
            userPos={userPos}
            selectedId={selectedId}
            drop={drop}
            onSelect={onSelectSpot}
            onMapReady={setMapApi}
            onVisibleChange={setVisibleIds}
            onPanningChange={setIsPanning}
            onMapClick={onMapClick}
          />

{mode === "forage" && recommendedSpot && !drop && !isEmptyProd && !selectedSpot && !sheetExpanded ? (
  <button type="button" className={styles.fabCta} onClick={onGoRecommended}>
    Start sanketur
  </button>
) : null}

          <div className={styles.mobileDock}>
            {isEmptyProd ? (
              <div className={styles.sheetWrap}>
                <div className={styles.emptyHint}>
                  <p>
                    <strong>Ingen spots endnu.</strong>
                    <br />
                    Skift til <strong>Sankemode</strong> og klik på kortet for at oprette første spot.
                  </p>
                </div>
              </div>
            ) : mobileDockMode === "peek" && selectedSpot ? (
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
            ) : mobileDockMode === "sheet" ? (
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
            ) : null}
          </div>

          {drop ? (
            <DropSpotSheet
              locale={locale}
              lat={drop.lat}
              lng={drop.lng}
              isBusy={dropBusy}
              error={dropErr}
              isAuthed={isAuthed}
              onRequireAuth={(payload) => onRequireAuth(payload)}
              onClose={() => setDrop(null)}
              onCreateAndLog={onCreateAndLogFromDrop}
            />
          ) : null}
        </div>

        <aside className={styles.desktopRight}>
          <div className={styles.panelInner}>
            {drop ? (
              <div className={styles.emptyHint}>
                <p>
                  <strong>Opret nyt spot</strong>
                  <br />
                  Udfyld panelet der ligger ovenpå kortet.
                </p>
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
              <div className={styles.emptyHint}>
                <p>
                  <strong>Vælg et spot</strong>
                  <br />
                  Klik på pins eller vælg fra listen.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {logError ? <div className={styles.toastError}>{logError}</div> : null}
      {isLogging ? <div className={styles.toastInfo}>Logger fund…</div> : null}
    </div>
  );
}