"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./MapPage.module.css";

type Item = {
  place_id: string;
  slug: string;
  name: string;
  habitat: string;
  description: string;
  lat: number;
  lng: number;
  distance_m: number;
  top_confidence: number;
};

function km(m: number) {
  if (!Number.isFinite(m)) return "";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function MapClient({ locale }: { locale: "dk" | "en" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [radius, setRadius] = useState(5000);
  const [species, setSpecies] = useState("");

  const country = locale; // v1: reuse

  async function fetchNearby(lat: number, lng: number) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
        country,
        region: "",
        limit: "40",
      });
      if (species.trim()) qs.set("species", species.trim());

      const res = await fetch(`/api/places/nearby?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setItems(json.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError(locale === "dk" ? "Browser understøtter ikke geolocation." : "Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false);
        setError(locale === "dk" ? "Kunne ikke hente din lokation." : "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const title = locale === "dk" ? "Kort" : "Map";
  const subtitle =
    locale === "dk"
      ? "Find spots i nærheden. (Kortvisning kommer — vi starter med en stærk liste.)"
      : "Find nearby spots. (Map view later — starting with a solid list.)";

  return (
    <main className={styles.wrap}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.h1}>{title}</h1>
          <p className={styles.sub}>{subtitle}</p>
        </div>

        <Link className={styles.link} href={`/${locale}/species`}>
          {locale === "dk" ? "Arter →" : "Species →"}
        </Link>
      </header>

      <section className={styles.controls}>
        <button className={styles.primary} onClick={useMyLocation} disabled={loading}>
          {loading ? (locale === "dk" ? "Henter…" : "Loading…") : (locale === "dk" ? "Brug min lokation" : "Use my location")}
        </button>

        <label className={styles.field}>
          <span>{locale === "dk" ? "Radius" : "Radius"}</span>
          <select
            className={styles.select}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            disabled={loading}
          >
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>{locale === "dk" ? "Art (slug, valgfri)" : "Species (slug, optional)"}</span>
          <input
            className={styles.input}
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder={locale === "dk" ? "fx ramsloeg" : "e.g. ramsons"}
            disabled={loading}
          />
        </label>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.list}>
        {items.map((p) => (
          <article key={p.place_id} className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <div className={styles.name}>{p.name}</div>
                <div className={styles.meta}>
                  <span className={styles.badge}>{p.habitat}</span>
                  <span className={styles.dot}>·</span>
                  <span>{km(p.distance_m)}</span>
                  <span className={styles.dot}>·</span>
                  <span>{p.top_confidence}%</span>
                </div>
              </div>

              <a
                className={styles.openMaps}
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
              >
                {locale === "dk" ? "Åbn →" : "Open →"}
              </a>
            </div>

            {p.description ? <p className={styles.desc}>{p.description}</p> : null}
          </article>
        ))}

        {!loading && items.length === 0 ? (
          <p className={styles.empty}>
            {locale === "dk"
              ? "Tryk “Brug min lokation” for at hente spots."
              : "Tap “Use my location” to load spots."}
          </p>
        ) : null}
      </section>
    </main>
  );
}