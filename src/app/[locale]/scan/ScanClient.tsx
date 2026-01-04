// src/app/[locale]/scan/ScanClient.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ScanPage.module.css";

type Group = "plant" | "mushroom" | "tree" | "weed" | "all";

type RefRow = {
  slug: string;
  group: string; // primary_group
  scientific_name: string;
  image_url: string;
};

type RefsResponse =
  | { ok: true; refs: RefRow[] }
  | { ok: false; error: string };

type Candidate = {
  slug: string;
  scientific_name: string;
  group: string;
  score: number; // 0..1 cosine-ish
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreToConf(score: number): "high" | "medium" | "low" {
  // konservativt: hellere underlove end overpromise
  if (score >= 0.34) return "high";
  if (score >= 0.26) return "medium";
  return "low";
}

function confLabel(c: "high" | "medium" | "low") {
  return c === "high" ? "Høj" : c === "medium" ? "Medium" : "Lav";
}

export default function ScanClient() {
  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const [group, setGroup] = useState<Group>("all");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const [refs, setRefs] = useState<RefRow[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const canScan = useMemo(() => !!file && !loading, [file, loading]);

  // ---------- Worker lifecycle ----------
  useEffect(() => {
    // module-worker så onnxruntime-web kan køre som ESM
    const w = new Worker(new URL("../../../workers/vision.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = w;

    const onMsg = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "progress") {
        setProgress(typeof msg.text === "string" ? msg.text : null);
        return;
      }

      if (msg.type === "rank:ok") {
        setCandidates(msg.candidates ?? []);
        setSheetOpen(true);
        setProgress(null);
        return;
      }

      if (msg.type === "rank:error") {
        setError(msg.error || "Scan fejlede");
        setProgress(null);
        return;
      }
    };

    w.addEventListener("message", onMsg);
    return () => {
      w.removeEventListener("message", onMsg);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // ---------- Fetch refs (live) ----------
  async function loadRefs(nextGroup: Group) {
    setError(null);
    setProgress("Henter reference-arter…");
    try {
      const qs = new URLSearchParams();
      if (nextGroup && nextGroup !== "all") qs.set("group", nextGroup);

      const res = await fetch(`/api/scan/refs?${qs.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as RefsResponse;

      if (!res.ok || !("ok" in json) || json.ok === false) {
        throw new Error(("error" in json && json.error) || "Kunne ikke hente refs");
      }

      setRefs(json.refs || []);
      setProgress(null);
      return json.refs || [];
    } catch (e: any) {
      setProgress(null);
      setError(e?.message ?? "Kunne ikke hente refs");
      setRefs(null);
      return null;
    }
  }

  // preload refs når group ændrer sig (så scan føles instant)
  useEffect(() => {
    void loadRefs(group);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  // ---------- Pick image ----------
  function onPick(f: File | null) {
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setProgress(null);

    // cleanup old preview url
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(f);

    if (!f) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  // ---------- Run scan (real) ----------
  async function runScan() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);

    try {
      // sikre refs er loaded
      let curRefs = refs;
      if (!curRefs) curRefs = await loadRefs(group);
      if (!curRefs || curRefs.length === 0) {
        throw new Error("Ingen reference-arter med billeder fundet");
      }

      const w = workerRef.current;
      if (!w) throw new Error("NO_WORKER");

      setProgress("Forbereder scan…");

      const id = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
      w.postMessage({
        type: "rank",
        id,
        topK: 12,
        file,
        refs: curRefs.map((r) => ({
          slug: r.slug,
          scientific_name: r.scientific_name,
          group: r.group,
          image_url: r.image_url,
        })),
      });
    } catch (e: any) {
      setError(e?.message ?? "Scan fejlede");
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-scroll til resultater når de kommer (så man ikke skal scrolle manuelt)
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    // scroll target = sheet/result container (brug jeres layout)
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [candidates]);

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
              <div className={styles.tip}>Tip: tag helhed + nærbillede af kendetegn</div>
            </div>
          )}
        </div>

        {/* Filter (bruger tokens / themes – ingen hardcode) */}
        <div className={styles.filters} aria-label="Filtrér artstype">
          {(
            [
              ["all", "Alle"],
              ["mushroom", "Svamp"],
              ["plant", "Plante"],
              ["tree", "Træ"],
              ["weed", "Ukrudt"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={styles.filterChip}
              data-active={group === k}
              onClick={() => setGroup(k)}
            >
              {label}
            </button>
          ))}
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

        {progress && <div className={styles.progress}>{progress}</div>}
        {error && <div className={styles.error}>{error}</div>}
      </section>

      {/* Resultater + “sheet” wrapper */}
      <div ref={resultsRef} />

      {candidates && (
        <section className={styles.results} data-open={sheetOpen ? "1" : "0"}>
          <div className={styles.resultsHead}>
            Mulige matches <span className={styles.count}>{candidates.length}</span>
            <button
              type="button"
              className={styles.sheetClose}
              onClick={() => setSheetOpen(false)}
              aria-label="Luk"
            >
              ✕
            </button>
          </div>

          <div className={styles.grid}>
            {candidates.map((c) => {
              const conf = scoreToConf(c.score);
              const pct = Math.round(clamp01(c.score) * 100);

              return (
                <article key={c.slug} className={styles.resultCard}>
                  <div className={styles.resultTop}>
                    <div className={styles.names}>
                      <div className={styles.name}>{c.scientific_name}</div>
                      <div className={styles.meta}>{c.group}</div>
                    </div>

                    <span className={styles.conf} data-conf={conf}>
                      {confLabel(conf)} · {pct}%
                    </span>
                  </div>

                  <div className={styles.scorebar} aria-hidden>
                    <span className={styles.scorefill} style={{ width: `${pct}%` }} />
                  </div>

                  <a className={styles.open} href={`/${locale}/species/${c.slug}`}>
                    Åbn artsside →
                  </a>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
