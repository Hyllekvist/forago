"use client"; 

import { useMemo, useState } from "react";

type Props = {
  locale: "dk" | "en";
  lat: number;
  lng: number;

  isBusy?: boolean;
  error?: string | null;

  isAuthed: boolean;                 // ✅
  onRequireAuth: () => void;         // ✅

  onClose: () => void;
  onCreateAndLog: (args: { name: string; speciesSlug: string | null }) => void;
};

function fmt(n: number) {
  return Number(n).toFixed(5);
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
  const [speciesSlug, setSpeciesSlug] = useState("");

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

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: `calc(var(--bottom-nav-h, 92px) + 14px + env(safe-area-inset-bottom))`, // ✅ over bundnav
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
          disabled={!isAuthed} // ✅ lock inputs
        />

        <input
          value={speciesSlug}
          onChange={(e) => setSpeciesSlug(e.target.value)}
          placeholder={locale === "dk" ? "Art slug (valgfrit) fx 'kantarel'" : "Species slug (optional)"}
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid var(--glassLine)",
            background: "rgba(255,255,255,0.03)",
            padding: "10px 12px",
            outline: "none",
          }}
          disabled={!isAuthed} // ✅ lock inputs
        />

        <button
          disabled={!!isBusy}
          onClick={() => {
            if (!isAuthed) return onRequireAuth(); // ✅ go login
            onCreateAndLog({
              name: name.trim() || "Nyt spot",
              speciesSlug: speciesSlug.trim() ? speciesSlug.trim().toLowerCase() : null,
            });
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
