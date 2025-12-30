"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  locale: "dk" | "en";
  lat: number;
  lng: number;
  isBusy?: boolean;
  error?: string | null;

  isAuthed: boolean;
  onRequireAuth: (payload: { lat: number; lng: number; name: string; speciesSlug: string | null }) => void;

  onClose: () => void;
  onCreateAndLog: (args: { name: string; speciesSlug: string | null }) => void;
};

function fmt(n: number) {
  return Number(n).toFixed(5);
}

type SpeciesItem = { slug: string; name: string };

export function DropSpotSheet({
  locale,
  lat,
  lng,
  isBusy,
  error,
  isAuthed,
  onRequireAuth,
  onClose,
  onCreateAndLog,
}: Props) {
  const [name, setName] = useState("");
  const [speciesSlug, setSpeciesSlug] = useState("");

  const [speciesOptions, setSpeciesOptions] = useState<SpeciesItem[]>([]);
  const [speciesBusy, setSpeciesBusy] = useState(false);
  const speciesAbortRef = useRef<AbortController | null>(null);

  const title = locale === "dk" ? "Log et fund her" : "Log a find here";
  const sub = useMemo(
    () =>
      locale === "dk"
        ? `Koordinater: ${fmt(lat)}, ${fmt(lng)}`
        : `Coordinates: ${fmt(lat)}, ${fmt(lng)}`,
    [locale, lat, lng]
  );

  const ctaLabel = !isAuthed
    ? locale === "dk"
      ? "Login for at oprette"
      : "Login to create"
    : locale === "dk"
    ? isBusy
      ? "Logger…"
      : "Opret spot + log fund"
    : isBusy
    ? "Logging…"
    : "Create spot + log";

  // --- species search (datalist) ---
  async function searchSpecies(qRaw: string) {
    if (!isAuthed) return;
    const q = qRaw.trim();

    if (q.length < 2) {
      setSpeciesOptions([]);
      return;
    }

    // cancel previous
    speciesAbortRef.current?.abort();
    const ac = new AbortController();
    speciesAbortRef.current = ac;

    try {
      setSpeciesBusy(true);
      const res = await fetch(`/api/species/search?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) {
        setSpeciesOptions([]);
        return;
      }
      const items = (j.items ?? []) as SpeciesItem[];
      setSpeciesOptions(items.slice(0, 12));
    } catch {
      // ignore
    } finally {
      setSpeciesBusy(false);
    }
  }

  // cleanup abort on unmount
  useEffect(() => {
    return () => speciesAbortRef.current?.abort();
  }, []);

  const hint = useMemo(() => {
    if (!isAuthed) {
      return locale === "dk"
        ? "Login kræves for at oprette spots og logge fund."
        : "Login is required to create spots and log finds.";
    }
    if (error) return error;
    return locale === "dk"
      ? "Tip: Søg art og vælg fra listen (eller lad den være tom)."
      : "Tip: Search species and pick from the list (or leave empty).";
  }, [isAuthed, error, locale]);

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: `calc(var(--bottom-nav-h, 92px) + 14px + env(safe-area-inset-bottom))`,
        zIndex: 60,
        borderRadius: 18,
        border: "1px solid var(--glassLine)",
        background: "var(--glassBg)",
        boxShadow: "var(--shadow-1)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: 12,
      }}
      role="dialog"
      aria-label="Drop spot sheet"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{sub}</div>
        </div>

        <button
          onClick={onClose}
          type="button"
          style={{
            borderRadius: 12,
            border: "1px solid var(--glassLine)",
            background: "transparent",
            padding: "8px 10px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={locale === "dk" ? "Navn (valgfrit) fx 'Bøgeskov ved stien'" : "Name (optional)"}
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid var(--glassLine)",
            background: "rgba(255,255,255,0.03)",
            padding: "10px 12px",
            outline: "none",
          }}
          disabled={!isAuthed}
        />

        <div style={{ position: "relative" }}>
          <input
            value={speciesSlug}
            onChange={(e) => {
              const v = e.target.value;
              setSpeciesSlug(v);
              void searchSpecies(v);
            }}
            list="species-list"
            placeholder={locale === "dk" ? "Art (valgfrit) — søg og vælg" : "Species (optional) — search & pick"}
            style={{
              width: "100%",
              borderRadius: 14,
              border: "1px solid var(--glassLine)",
              background: "rgba(255,255,255,0.03)",
              padding: "10px 12px",
              outline: "none",
            }}
            disabled={!isAuthed}
          />

          <datalist id="species-list">
            {speciesOptions.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </datalist>

          {speciesBusy ? (
            <div style={{ position: "absolute", right: 10, top: 10, fontSize: 12, opacity: 0.65 }}>
              …
            </div>
          ) : null}
        </div>

        <button
          disabled={!!isBusy}
          onClick={() => {
            const payload = {
              lat,
              lng,
              name: name.trim() || "Nyt spot",
              speciesSlug: speciesSlug.trim() ? speciesSlug.trim().toLowerCase() : null,
            };

            if (!isAuthed) return onRequireAuth(payload);

            onCreateAndLog({ name: payload.name, speciesSlug: payload.speciesSlug });
          }}
          type="button"
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.16)",
            background: !isAuthed ? "rgba(255,255,255,0.08)" : "rgba(16,185,129,0.92)",
            color: "rgba(255,255,255,0.96)",
            padding: "11px 12px",
            fontWeight: 950,
            cursor: isBusy ? "default" : "pointer",
            opacity: isBusy ? 0.75 : 1,
          }}
        >
          {ctaLabel}
        </button>

        <div style={{ fontSize: 12, opacity: error ? 0.9 : 0.65, padding: "6px 2px" }}>{hint}</div>

        {isAuthed && speciesSlug.trim().length > 0 && speciesOptions.length === 0 && speciesSlug.trim().length >= 2 ? (
          <div style={{ fontSize: 12, opacity: 0.7, padding: "0 2px" }}>
            {locale === "dk"
              ? "Ingen match i listen. Vælg helst en art der findes (ellers bør backend afvise)."
              : "No matches. Prefer picking an existing species (backend should reject unknown)."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
