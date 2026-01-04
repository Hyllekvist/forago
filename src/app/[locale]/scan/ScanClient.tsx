"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./ScanPage.module.css";

type Checkpoint = {
  id: string;
  label: string;
};

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  checks: Checkpoint[];
};

type ScanResponse = {
  ok: true;
  candidates: Candidate[];
};

export default function ScanClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);

  // ✅ local check state per candidate
  const [checked, setChecked] = useState<Record<string, Set<string>>>({});

  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const canScan = useMemo(() => !!file && !loading, [file, loading]);

  function toggleCheck(slug: string, id: string) {
    setChecked((prev) => {
      const next = new Set(prev[slug] ?? []);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [slug]: next };
    });
  }

  function onPick(f: File | null) {
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({}); // reset checks for new image
    setFile(f);

    if (!f) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function runScan() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({});

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/scan", { method: "POST", body: form });
      const json = (await res.json()) as ScanResponse | { ok: false; error: string };

      if (!res.ok || !("ok" in json) || json.ok === false) {
        throw new Error(("error" in json && json.error) || "Scan fejlede");
      }

      setCandidates(json.candidates);
      setSheetOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "Scan fejlede");
    } finally {
      setLoading(false);
    }
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  // ESC close
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // Lock body scroll when sheet open (mobile)
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  // Reset sheet scroll to top when opened
  useEffect(() => {
    if (!sheetOpen) return;
    requestAnimationFrame(() => {
      sheetBodyRef.current?.scrollTo({ top: 0 });
    });
  }, [sheetOpen]);

  function microText(slug: string, total: number) {
    const n = checked[slug]?.size ?? 0;
    if (n === 0) return "Ikke verificeret endnu";
    if (n === 1) return "Matcher et kendetegn";
    if (n < total) return "Matcher flere kendetegn";
    return "Matcher alle viste kendetegn";
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.preview}>
          {previewUrl ? (
            <Image src={previewUrl} alt="Preview" fill className={styles.previewImg} />
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} />
              <div className={styles.emptyText}>Vælg et billede for at starte</div>
              <div className={styles.tip}>Tip: tag både helhed + nærbillede af kendetegn</div>
            </div>
          )}

          {/* Controls overlay */}
          <div className={styles.controls}>
            <label className={styles.pickBtn}>
              Vælg billede
              <input
                className={styles.file}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
            </label>

            <button className={styles.scanBtn} onClick={runScan} disabled={!canScan}>
              {loading ? "Scanner…" : "Kør scan"}
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </section>

      {/* Bottom sheet results */}
      {candidates && (
        <>
          <div
            className={styles.sheetBackdrop}
            data-open={sheetOpen ? "1" : "0"}
            onClick={closeSheet}
          />

          <section
            className={styles.sheet}
            data-open={sheetOpen ? "1" : "0"}
            role="dialog"
            aria-modal="true"
            aria-label="Scan resultater"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandleRow}>
              <div className={styles.sheetHandle} />
              <button className={styles.sheetClose} onClick={closeSheet} aria-label="Luk">
                Luk
              </button>
            </div>

            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitle}>Mulige arter</div>
              <div className={styles.sheetMeta}>{candidates.length} bud · Verificér altid kendetegn</div>
            </div>

            <div ref={sheetBodyRef} className={styles.sheetBody}>
              <div className={styles.grid}>
                {candidates.map((c) => (
                  <article key={c.slug} className={styles.resultCard}>
                    <div className={styles.resultTop}>
                      <div>
                        <div className={styles.name}>{c.name}</div>
                        {c.latin && <div className={styles.latin}>{c.latin}</div>}
                      </div>

                      <span className={styles.conf} data-conf={c.confidence}>
                        {c.confidence === "high" ? "Høj" : c.confidence === "medium" ? "Medium" : "Lav"}
                      </span>
                    </div>

                    {/* ✅ micro feedback */}
                    <div className={styles.micro}>{microText(c.slug, c.checks.length)}</div>

                    {/* ✅ Tjek nu */}
                    <div className={styles.checks}>
                      <div className={styles.checksTitle}>Tjek nu</div>

                      {c.checks.map((chk) => {
                        const isOn = checked[c.slug]?.has(chk.id) ?? false;
                        return (
                          <label
                            key={chk.id}
                            className={[styles.check, isOn ? styles.checkOn : ""].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={isOn}
                              onChange={() => toggleCheck(c.slug, chk.id)}
                            />
                            <span>{chk.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <a className={styles.open} href={`/${locale}/species/${c.slug}`}>
                      Åbn artsside →
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}