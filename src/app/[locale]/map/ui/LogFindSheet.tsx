"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Spot } from "../LeafletMap";

type Suggestion = {
  id: string;
  slug: string;
  label: string;
};

type Props = {
  locale: "dk" | "en";
  spot: Spot;

  isAuthed: boolean;
  isBusy?: boolean;
  error?: string | null;
  ok?: boolean;

  onRequireAuth: () => void;
  onClose: () => void;

  onLog: (args: { spotId: string; speciesSlug: string | null }) => void;
};

function fmt(n: number) {
  return Number(n).toFixed(5);
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase();
}

export function LogFindSheet({
  locale,
  spot,
  isAuthed,
  isBusy,
  error,
  ok,
  onRequireAuth,
  onClose,
  onLog,
}: Props) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Suggestion | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sErr, setSErr] = useState<string | null>(null);

  const acRef = useRef<AbortController | null>(null);

  // Prefill valgt art fra spot (hvis den findes)
  useEffect(() => {
    if (!spot?.species_slug) {
      setPicked(null);
      return;
    }
    setPicked({
      id: `prefill:${spot.species_slug}`,
      slug: String(spot.species_slug),
      label: String(spot.species_slug), // simpelt prefill label
    });
  }, [spot?.id, spot?.species_slug]);

  const title = locale === "dk" ? "Log et fund" : "Log a find";
  const sub = useMemo(() => {
    const coords =
      locale === "dk"
        ? `Koordinater: ${fmt(spot.lat)}, ${fmt(spot.lng)}`
        : `Coordinates: ${fmt(spot.lat)}, ${fmt(spot.lng)}`;
    return coords;
  }, [locale, spot.lat, spot.lng]);

  const spotTitle = spot.title || (locale === "dk" ? "Spot" : "Spot");

  const ctaLabel = !isAuthed
    ? locale === "dk"
      ? "Login for at logge"
      : "Login to log"
    : locale === "dk"
    ? isBusy
      ? "Logger…"
      : "Log fund"
    : isBusy
    ? "Logging…"
    : "Log find";

  // fetch suggestions
  useEffect(() => {
    if (!isAuthed) return;
    if (picked && q.trim().length === 0) return; // når vi har valgt og ikke søger, hold ro
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setSErr(null);
      return;
    }

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    setLoading(true);
    setSErr(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/species/search?q=${encodeURIComponent(term)}&locale=${encodeURIComponent(locale)}`,
          { cache: "no-store", signal: ac.signal }
        );
        const j = await res.json();

        if (!res.ok || !j?.ok) {
          setSuggestions([]);
          setSErr(j?.error ?? (locale === "dk" ? "Kunne ikke hente arter" : "Could not load species"));
          return;
        }

        const items = Array.isArray(j.items) ? (j.items as any[]) : [];
        const mapped: Suggestion[] = items
          .map((it) => ({
            id: String(it.id),
            slug: String(it.slug),
            label: String(it.label ?? it.slug),
          }))
          .slice(0, 12);

        setSuggestions(mapped);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setSuggestions([]);
        setSErr(locale === "dk" ? "Netværksfejl" : "Network error");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [q, locale, isAuthed, picked]);

  const chosenSlug = picked?.slug ? normalizeSlug(picked.slug) : null;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: `calc(var(--bottom-nav-h, 92px) + 14px + env(safe-area-inset-bottom))`,
        zIndex: 70,
        borderRadius: 18,
        border: "1px solid var(--glassLine)",
        background: "var(--glassBg)",
        boxShadow: "var(--shadow-1)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: 12,
      }}
      role="dialog"
      aria-label="Log find sheet"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{spotTitle}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{sub}</div>
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
        {/* Species autocomplete */}
        <div style={{ position: "relative" }}>
          {picked ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                borderRadius: 14,
                border: "1px solid var(--glassLine)",
                background: "rgba(255,255,255,0.03)",
                padding: "10px 12px",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>{picked.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{picked.slug}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setQ("");
                  setSuggestions([]);
                }}
                style={{
                  borderRadius: 12,
                  border: "1px solid var(--glassLine)",
                  background: "transparent",
                  padding: "8px 10px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                disabled={!isAuthed}
              >
                {locale === "dk" ? "Skift" : "Change"}
              </button>
            </div>
          ) : (
            <>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={locale === "dk" ? "Art (søg) fx 'kantarel'..." : "Species (search) e.g. 'chanterelle'..."}
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

              {isAuthed && (loading || sErr || suggestions.length > 0) ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "calc(100% + 6px)",
                    borderRadius: 14,
                    border: "1px solid var(--glassLine)",
                    background: "var(--glassBg)",
                    boxShadow: "var(--shadow-1)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    overflow: "hidden",
                    zIndex: 90,
                  }}
                >
                  {loading ? (
                    <div style={{ padding: 10, fontSize: 12, opacity: 0.8 }}>
                      {locale === "dk" ? "Søger…" : "Searching…"}
                    </div>
                  ) : sErr ? (
                    <div style={{ padding: 10, fontSize: 12, opacity: 0.9 }}>{sErr}</div>
                  ) : suggestions.length ? (
                    suggestions.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setPicked(it);
                          setSuggestions([]);
                          setQ("");
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{it.label}</div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{it.slug}</div>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: 10, fontSize: 12, opacity: 0.75 }}>
                      {locale === "dk" ? "Ingen match" : "No matches"}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        <button
          disabled={!!isBusy}
          onClick={() => {
            if (!isAuthed) return onRequireAuth();
            onLog({ spotId: String(spot.id), speciesSlug: chosenSlug });
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

        {!isAuthed ? (
          <div style={{ fontSize: 12, opacity: 0.75, padding: "6px 2px" }}>
            {locale === "dk"
              ? "Login kræves for at logge fund."
              : "Login is required to log finds."}
          </div>
        ) : error ? (
          <div style={{ fontSize: 12, opacity: 0.9, padding: "6px 2px" }}>{error}</div>
        ) : ok ? (
          <div style={{ fontSize: 12, opacity: 0.85, padding: "6px 2px" }}>
            {locale === "dk" ? "Fund logget ✅" : "Logged ✅"}
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.65, padding: "6px 2px" }}>
            {locale === "dk"
              ? "Vælg art (valgfrit) og log fund på dette spot."
              : "Pick species (optional) and log on this spot."}
          </div>
        )}
      </div>
    </div>
  );
}
