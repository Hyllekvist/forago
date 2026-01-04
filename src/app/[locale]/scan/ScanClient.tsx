"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./ScanPage.module.css";

import { REF_ITEMS } from "@/lib/vision/refIndex";
import type { RefItem, Match, Checkpoint } from "@/lib/vision/types";
import { l2Normalize, topK } from "@/lib/vision/similarity";

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  checks: Checkpoint[];
};

type ScanResponse = { ok: true; candidates: Candidate[] };

type WorkerMsg =
  | { type: "init"; modelUrl: string }
  | { type: "embed_url"; id: string; imageUrl: string }
  | { type: "embed_blob"; id: string; data: ArrayBuffer };

type WorkerReply =
  | { type: "ready" }
  | { type: "embed_ok"; id: string; vec: number[] }
  | { type: "err"; id?: string; error: string };

function bandFromRank(rank: number): Candidate["confidence"] {
  return rank === 0 ? "high" : rank === 1 ? "medium" : "low";
}

export default function ScanClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);

  const [checked, setChecked] = useState<Record<string, Set<string>>>({});

  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const workerRef = useRef<Worker | null>(null);

  // in-memory embedding cache (reference)
  const refVecsRef = useRef<{ slug: string; vec: Float32Array }[] | null>(null);

  const canScan = useMemo(() => !!file && !loading && modelReady, [file, loading, modelReady]);

  function toggleCheck(slug: string, id: string) {
    setChecked((prev) => {
      const next = new Set(prev[slug] ?? []);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [slug]: next };
    });
  }

  function microText(slug: string, total: number) {
    const n = checked[slug]?.size ?? 0;
    if (n === 0) return "Ikke verificeret endnu";
    if (n === 1) return "Matcher et kendetegn";
    if (n < total) return "Matcher flere kendetegn";
    return "Matcher alle viste kendetegn";
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  // init worker + model once
  useEffect(() => {
    const w = new Worker(new URL("../../../workers/vision.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;

    const onMsg = (ev: MessageEvent<WorkerReply>) => {
      if (ev.data.type === "ready") setModelReady(true);
      if (ev.data.type === "err") setError(ev.data.error);
    };

    w.addEventListener("message", onMsg);

    const modelUrl = "/models/forago_embed.onnx"; // <- commit din model her
    const init: WorkerMsg = { type: "init", modelUrl };
    w.postMessage(init);

    return () => {
      w.removeEventListener("message", onMsg);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // ESC close
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // lock body scroll when sheet open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    requestAnimationFrame(() => sheetBodyRef.current?.scrollTo({ top: 0 }));
  }, [sheetOpen]);

  function onPick(f: File | null) {
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({});
    setFile(f);

    if (!f) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  function workerEmbedUrl(imageUrl: string) {
    return new Promise<Float32Array>((resolve, reject) => {
      const w = workerRef.current;
      if (!w) return reject(new Error("NO_WORKER"));
      const id = crypto.randomUUID();

      const handler = (ev: MessageEvent<WorkerReply>) => {
        const d = ev.data;
        if (d.type === "embed_ok" && d.id === id) {
          w.removeEventListener("message", handler);
          resolve(l2Normalize(new Float32Array(d.vec)));
        }
        if (d.type === "err" && d.id === id) {
          w.removeEventListener("message", handler);
          reject(new Error(d.error));
        }
      };

      w.addEventListener("message", handler);
      const msg: WorkerMsg = { type: "embed_url", id, imageUrl };
      w.postMessage(msg);
    });
  }

  function workerEmbedBlob(buf: ArrayBuffer) {
    return new Promise<Float32Array>((resolve, reject) => {
      const w = workerRef.current;
      if (!w) return reject(new Error("NO_WORKER"));
      const id = crypto.randomUUID();

      const handler = (ev: MessageEvent<WorkerReply>) => {
        const d = ev.data;
        if (d.type === "embed_ok" && d.id === id) {
          w.removeEventListener("message", handler);
          resolve(l2Normalize(new Float32Array(d.vec)));
        }
        if (d.type === "err" && d.id === id) {
          w.removeEventListener("message", handler);
          reject(new Error(d.error));
        }
      };

      w.addEventListener("message", handler);
      const msg: WorkerMsg = { type: "embed_blob", id, data: buf };
      w.postMessage(msg, [buf]);
    });
  }

  async function ensureRefVecs(items: RefItem[]) {
    if (refVecsRef.current) return refVecsRef.current;

    // embed refs (første gang) – cache i memory
    const vecs: { slug: string; vec: Float32Array }[] = [];
    for (const it of items) {
      const v = await workerEmbedUrl(it.imageUrl);
      vecs.push({ slug: it.slug, vec: v });
    }
    refVecsRef.current = vecs;
    return vecs;
  }

  async function runScan() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({});

    try {
      const refVecs = await ensureRefVecs(REF_ITEMS);

      const buf = await file.arrayBuffer();
      const q = await workerEmbedBlob(buf);

      const matches: Match[] = topK(q, refVecs, 3);

      // hydrate via server (senere: Supabase lookup for checks/artdata)
      const slugs = matches.map((m) => m.slug);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs }),
      });

      const json = (await res.json()) as ScanResponse | { ok: false; error: string };
      if (!res.ok || !("ok" in json) || (json as any).ok === false) {
        throw new Error(("error" in json && (json as any).error) || "Scan fejlede");
      }

      // bevare ranking + band
      const ordered = slugs.map((slug, i) => {
        const c = json.candidates.find((x) => x.slug === slug);
        if (!c) {
          return {
            slug,
            name: slug,
            confidence: bandFromRank(i),
            checks: [],
          } as Candidate;
        }
        return { ...c, confidence: bandFromRank(i) };
      });

      setCandidates(ordered);
      setSheetOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "Scan fejlede");
    } finally {
      setLoading(false);
    }
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
              <div className={styles.tip}>
                {modelReady ? "Tip: tag både helhed + nærbillede af kendetegn" : "Loader scan-model…"}
              </div>
            </div>
          )}

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
              {loading ? "Scanner…" : modelReady ? "Kør scan" : "Loader…"}
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </section>

      {candidates && (
        <>
          <div className={styles.sheetBackdrop} data-open={sheetOpen ? "1" : "0"} onClick={closeSheet} />

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

                    <div className={styles.micro}>{microText(c.slug, c.checks.length || 3)}</div>

                    <div className={styles.checks}>
                      <div className={styles.checksTitle}>Tjek nu</div>

                      {(c.checks?.length ? c.checks : [
                        { id: "cap", label: "Tjek hat-form og farve" },
                        { id: "underside", label: "Tjek underside (ribber/lameller/porer)" },
                        { id: "stem", label: "Tjek stok (farve, ring, volva)" },
                      ]).map((chk) => {
                        const isOn = checked[c.slug]?.has(chk.id) ?? false;
                        return (
                          <label key={chk.id} className={[styles.check, isOn ? styles.checkOn : ""].join(" ")}>
                            <input type="checkbox" checked={isOn} onChange={() => toggleCheck(c.slug, chk.id)} />
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
