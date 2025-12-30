"use client"; 

import { useEffect, useMemo, useRef, useState } from "react";

type Suggestion = {
  id: string;
  slug: string;
  label: string; // fx "Kantarel (Cantharellus cibarius)"
};

type Props = {
  locale: "dk" | "en";
  lat: number;
  lng: number;
  isBusy?: boolean;
  error?: string | null;

  isAuthed: boolean;
  onRequireAuth: (payload: {
    lat: number;
    lng: number;
    name: string;
    speciesSlug: string | null;
  }) => void;

  onClose: () => void;
  onCreateAndLog: (args: { name: string; speciesSlug: string | null }) => void;
};

function fmt(n: number) {
  return Number(n).toFixed(5);
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase();
}

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
  const [q, setQ] = useState(""); // search input
  const [picked, setPicked] = useState<Suggestion | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sErr, setSErr] = useState<string | null>(null);

  const acRef = useRef<AbortController | null>(null);

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

  // fetch suggestions
  useEffect(() => {
    if (!isAuthed) return;
    if (picked) return; // når valgt, stop søgning
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
          setSErr(j?.error ?? "Kunne ikke hente arter");
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
        setSErr("Netværksfejl");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [q, locale, isAuthed, picked]);

  const chosenSlug = picked?.slug ? normalizeSlug(picked.slug) : null;

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
              >
                Skift
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
                    zIndex: 80,
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
            const payload = {
              lat,
              lng,
              name: name.trim() || "Nyt spot",
              speciesSlug: chosenSlug, // null hvis ikke valgt
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

        {!isAuthed ? (
          <div style={{ fontSize: 12, opacity: 0.75, padding: "6px 2px" }}>
            {locale === "dk"
              ? "Login kræves for at oprette spots og logge fund."
              : "Login is required to create spots and log finds."}
          </div>
        ) : error ? (
          <div style={{ fontSize: 12, opacity: 0.9, padding: "6px 2px" }}>{error}</div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.65, padding: "6px 2px" }}>
            {locale === "dk"
              ? "Tip: Klik på kortet igen for at flytte markøren."
              : "Tip: Click the map again to move the drop point."}
          </div>
        )}
      </div>
    </div>
  );
}
