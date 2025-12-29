"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  locale: "dk" | "en";
  spotId: string;
  defaultSpeciesSlug?: string | null;
};

function isoDateToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function SpotLogCTA({ locale, spotId, defaultSpeciesSlug }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [speciesSlug, setSpeciesSlug] = useState(defaultSpeciesSlug ?? "");
  const [observedAt, setObservedAt] = useState(isoDateToday());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canSubmit = useMemo(() => !!spotId && speciesSlug.trim().length >= 2, [spotId, speciesSlug]);

  async function submit() {
    if (!canSubmit || loading) return;

    try {
      setLoading(true);
      setErr(null);

      const res = await fetch("/api/finds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: spotId,
          species_slug: speciesSlug.trim().toLowerCase(),
          observed_at: observedAt,
          visibility: "public_aggregate",
          country: "DK",
          geo_precision_km: 1,
          photo_urls: [],
          notes: null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Kunne ikke logge fund");

      setOpen(false);
      router.refresh(); // opdater counts + top arter + seneste fund
    } catch (e: any) {
      setErr(e?.message ?? "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid var(--glassLine)",
        background: "var(--glassBg)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "var(--shadow-1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900 }}>Log et fund her</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Skriv artens slug (fx <code>kantarel</code>) og vælg dato.
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          type="button"
          style={{
            border: "1px solid var(--glassLine)",
            background: "color-mix(in srgb, var(--panel, #111827) 75%, transparent)",
            color: "var(--ink)",
            borderRadius: 999,
            padding: "10px 12px",
            fontWeight: 900,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "Luk" : "Log fund"}
        </button>
      </div>

      {open ? (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 850, opacity: 0.8 }}>Art (species slug)</div>
            <input
              value={speciesSlug}
              onChange={(e) => setSpeciesSlug(e.target.value)}
              placeholder={locale === "dk" ? "fx kantarel / blåbær / ramsløg" : "e.g. chanterelle / blueberry"}
              style={{
                height: 44,
                borderRadius: 12,
                border: "1px solid var(--glassLine)",
                background: "transparent",
                color: "var(--ink)",
                padding: "0 12px",
                fontWeight: 800,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 850, opacity: 0.8 }}>Dato</div>
            <input
              type="date"
              value={observedAt}
              onChange={(e) => setObservedAt(e.target.value)}
              style={{
                height: 44,
                borderRadius: 12,
                border: "1px solid var(--glassLine)",
                background: "transparent",
                color: "var(--ink)",
                padding: "0 12px",
                fontWeight: 800,
              }}
            />
          </label>

          {err ? (
            <div style={{ fontSize: 12, fontWeight: 850, color: "#ef4444" }}>{err}</div>
          ) : null}

          <button
            onClick={submit}
            type="button"
            disabled={!canSubmit || loading}
            style={{
              height: 46,
              borderRadius: 14,
              border: "1px solid var(--glassLine)",
              background: "var(--accent, #10b981)",
              color: "#06121a",
              fontWeight: 950,
              cursor: !canSubmit || loading ? "not-allowed" : "pointer",
              opacity: !canSubmit || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Logger…" : "Gem fund"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.65 }}>
            Tip: Når du har logget, bliver “Top arter” og “Seneste fund” opdateret.
          </div>
        </div>
      ) : null}
    </div>
  );
}
