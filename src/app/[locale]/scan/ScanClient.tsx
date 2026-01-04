"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./ScanPage.module.css";

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  why: string[];
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

  const canScan = useMemo(() => !!file && !loading, [file, loading]);

  async function onPick(f: File | null) {
    setError(null);
    setCandidates(null);
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

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/scan", { method: "POST", body: form });
      const json = (await res.json()) as ScanResponse | { ok: false; error: string };

      if (!res.ok || !("ok" in json) || json.ok === false) {
        throw new Error(("error" in json && json.error) || "Scan fejlede");
      }

      setCandidates(json.candidates);
    } catch (e: any) {
      setError(e?.message ?? "Scan fejlede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Scan</h1>
        <p className={styles.sub}>
          Tag/Upload et billede og få et kvalificeret bud. Spis aldrig baseret på scan alene.
        </p>
      </header>

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
        </div>

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

        {error && <div className={styles.error}>{error}</div>}
      </section>

      {candidates && (
        <section className={styles.results}>
          <div className={styles.resultsHead}>Mulige arter</div>

          <div className={styles.grid}>
            {candidates.map((c) => (
              <article key={c.slug} className={styles.resultCard}>
                <div className={styles.resultTop}>
                  <div className={styles.names}>
                    <div className={styles.name}>{c.name}</div>
                    {c.latin && <div className={styles.latin}>{c.latin}</div>}
                  </div>
                  <span className={styles.conf} data-conf={c.confidence}>
                    {c.confidence === "high" ? "Høj" : c.confidence === "medium" ? "Medium" : "Lav"}
                  </span>
                </div>

                <ul className={styles.why}>
                  {c.why.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>

                <a className={styles.open} href={`/species/${c.slug}`}>
                  Åbn artsside →
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}