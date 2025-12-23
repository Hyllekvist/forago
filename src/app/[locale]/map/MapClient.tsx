"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./MapPage.module.css";

export type PlaceVM = {
  id: string;
  slug: string;
  name: string;
  habitat: string;
  lat: number;
  lng: number;
  description: string;
  topSpecies: Array<{ slug: string; name: string; confidence: number }>;
};

type Props = {
  locale: "dk" | "en";
  places: PlaceVM[];
};

/** Leaflet via CDN (no terminal / no npm deps) */
declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadCssOnce(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.crossOrigin = "";
  document.head.appendChild(link);
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export default function MapClient({ locale, places }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState<PlaceVM | null>(null);
  const [locErr, setLocErr] = useState<string | null>(null);

  const center = useMemo(() => {
    // default DK-ish
    return { lat: 56.0, lng: 10.0, zoom: 6 };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!mapEl.current) return;

      loadCssOnce(LEAFLET_CSS);
      await loadScriptOnce(LEAFLET_JS);

      if (cancelled) return;

      const L = window.L;
      if (!L) return;

      // Create map once
      if (!mapRef.current) {
        mapRef.current = L.map(mapEl.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([center.lat, center.lng], center.zoom);

        // OSM tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);

        // Zoom control (top right)
        L.control
          .zoom({ position: "topright" })
          .addTo(mapRef.current);
      }

      // Clear existing markers
      for (const m of markersRef.current) m.remove?.();
      markersRef.current = [];

      // Add markers
      for (const p of places) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;

        const marker = L.marker([p.lat, p.lng], { keyboard: false });
        marker.on("click", () => setSelected(p));
        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    }

    boot().catch(() => {
      // keep silent-ish: map just won’t render
    });

    return () => {
      cancelled = true;
    };
  }, [places, center.lat, center.lng, center.zoom]);

  function fitToPlace(p: PlaceVM) {
    const L = window.L;
    if (!L || !mapRef.current) return;
    mapRef.current.setView([p.lat, p.lng], 13, { animate: true });
  }

  function findMe() {
    setLocErr(null);
    if (!navigator.geolocation) {
      setLocErr(locale === "dk" ? "Geolocation er ikke understøttet." : "Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const L = window.L;
        if (!L || !mapRef.current) return;

        mapRef.current.setView([lat, lng], 13, { animate: true });

        // drop a temp circle
        const circle = L.circle([lat, lng], {
          radius: Math.min(pos.coords.accuracy || 50, 250),
        }).addTo(mapRef.current);

        setTimeout(() => circle.remove?.(), 2500);
      },
      () => {
        setLocErr(locale === "dk" ? "Kunne ikke hente din lokation." : "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <section className={styles.mapShell}>
      <div className={styles.mapTopbar}>
        <button className={styles.ghostBtn} type="button" onClick={findMe}>
          {locale === "dk" ? "Find mig" : "Locate me"}
        </button>
        {locErr ? <div className={styles.err}>{locErr}</div> : null}
      </div>

      <div ref={mapEl} className={styles.map} />

      {/* Bottom sheet */}
      <div className={`${styles.sheet} ${selected ? styles.sheetOpen : ""}`}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>{selected?.name ?? ""}</div>
          <button className={styles.closeBtn} type="button" onClick={() => setSelected(null)}>
            ✕
          </button>
        </div>

        {selected ? (
          <>
            <div className={styles.sheetMeta}>
              {selected.habitat ? (
                <span className={styles.badge}>{selected.habitat}</span>
              ) : null}
              <button className={styles.chipBtn} type="button" onClick={() => fitToPlace(selected)}>
                {locale === "dk" ? "Zoom" : "Zoom"}
              </button>
            </div>

            {selected.description ? (
              <p className={styles.sheetText}>{selected.description}</p>
            ) : null}

            {selected.topSpecies.length ? (
              <>
                <div className={styles.sheetSub}>
                  {locale === "dk" ? "Top arter" : "Top species"}
                </div>
                <div className={styles.sheetLinks}>
                  {selected.topSpecies.map((s) => (
                    <Link
                      key={s.slug}
                      className={styles.linkPill}
                      href={`/${locale}/species/${s.slug}`}
                      onClick={() => setSelected(null)}
                    >
                      {s.name} <span className={styles.linkPct}>{s.confidence}%</span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.pMuted}>
                {locale === "dk" ? "Ingen arter tilknyttet endnu." : "No species linked yet."}
              </p>
            )}
          </>
        ) : (
          <p className={styles.pMuted}>
            {locale === "dk" ? "Tryk på en marker." : "Tap a marker."}
          </p>
        )}
      </div>
    </section>
  );
}