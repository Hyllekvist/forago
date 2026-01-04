"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./ScanPage.module.css";

import type { Match, Checkpoint } from "@/lib/vision/types";
import { l2Normalize, topK } from "@/lib/vision/similarity";

type Ref = { slug: string; name: string; latin?: string; imageUrl: string };

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  checks: Checkpoint[];
};

type RefsResponse = { ok: true; refs: Ref[] } | { ok: false; error: string };
type ScanResponse = { ok: true; candidates: Candidate[] } | { ok: false; error: string };

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
  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [refs, setRefs] = useState<Ref[] | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);

  const [checked, setChecked] = useState<Record<string, Set<string>>>({});

  const workerRef = useRef<Worker | null>(null);
  const refVecsRef = useRef<{ slug: string; vec: Float32Array }[] | null>(null);

  const canScan = useMemo(() => !!file && !loading && modelReady && !!refs?.length, [file, loading, modelReady, refs]);

  function closeSheet() {
    setSheetOpen(false);
  }

  // lock body scroll when sheet open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  // ESC close
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    requestAnimationFrame(() => sheetBodyRef.current?.scrollTo({ top: 0 }));
  }, [sheetOpen]);

  // init worker + model once
  useEffect(() => {
    const w = new Worker(new URL("../../../workers/vision.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;

    const onMsg = (ev: MessageEvent<WorkerReply>) => {
      if (ev.data.type === "ready") setModelReady(true);
      if (ev.data.type === "err") setError(ev.data.error);
    };

    w.addEventListener("message", onMsg);

    const modelUrl = "/models/forago_embed.onnx";
    const init: WorkerMsg = { type: "init", modelUrl };
    w.postMessage(init);

    return () => {
      w.removeEventListener("message", onMsg);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // fetch refs from server (Supabase -> public bucket URLs)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/scan/refs?kind=mushroom&limit=40", { cache: "no-store" });
      const j = (await r.json()) as RefsResponse;
      if (!r.ok || !("ok" in j) || (j as any).ok === false) throw new Error((j as any).error || "REFS_FAILED");
      setRefs((j as any).refs as Ref[]);
    })().catch((e: any) => setError(e?.message ?? "REFS_FAILED"));
  }, []);

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

  async function ensureRefVecs() {
    if (!refs?.length) throw new Error("REFS_NOT_READY");
    if (refVecsRef.current) return refVecsRef.current;

    const vecs: { slug: string; vec: Float32Array }[] = [];
    for (const it of refs) {
      const v = await workerEmbedUrl(it.imageUrl);
      vecs.push({ slug: it.slug, vec: v });
    }
    refVecsRef.current = vecs;
    return vecs;
  }

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

  async function runScan() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({});

    try {
      const refVecs = await ensureRefVecs();

      const buf = await file.arrayBuffer();
      const q = await workerEmbedBlob(buf);

      const matches: Match[] = topK(q, refVecs, 3);
      const slugs = matches.map((m) => m.slug);

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs }),
      });

      const json = (await res.json()) as ScanResponse;
      if (!res.ok || !("ok" in json) || (json as any).ok === false) {
        throw new Error((json as any).error || "Scan fejlede");
      }

      const hydrated = (json as any).candidates as Candidate[];

      const ordered = slugs.map((slug, i) => {
        const c = hydrated.find((x) => x.slug === slug);
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

                      {(c.checks?.length
                        ? c.checks
                        : [
                            { id: "cap", label: "Tjek hat-form og farve" },
                            { id: "underside", label: "Tjek underside (ribber/lameller/porer)" },
                            { id: "stem", label: "Tjek stok (farve, ring, volva)" },
                          ]
                      ).map((chk) => {
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
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./ScanPage.module.css";

import type { Match, Checkpoint } from "@/lib/vision/types";
import { l2Normalize, topK } from "@/lib/vision/similarity";

type Ref = { slug: string; name: string; latin?: string; imageUrl: string };

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  checks: Checkpoint[];
};

type RefsResponse = { ok: true; refs: Ref[] } | { ok: false; error: string };
type ScanResponse = { ok: true; candidates: Candidate[] } | { ok: false; error: string };

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
  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [refs, setRefs] = useState<Ref[] | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);

  const [checked, setChecked] = useState<Record<string, Set<string>>>({});

  const workerRef = useRef<Worker | null>(null);
  const refVecsRef = useRef<{ slug: string; vec: Float32Array }[] | null>(null);

  const canScan = useMemo(() => !!file && !loading && modelReady && !!refs?.length, [file, loading, modelReady, refs]);

  function closeSheet() {
    setSheetOpen(false);
  }

  // lock body scroll when sheet open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  // ESC close
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    requestAnimationFrame(() => sheetBodyRef.current?.scrollTo({ top: 0 }));
  }, [sheetOpen]);

  // init worker + model once
  useEffect(() => {
    const w = new Worker(new URL("../../../workers/vision.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;

    const onMsg = (ev: MessageEvent<WorkerReply>) => {
      if (ev.data.type === "ready") setModelReady(true);
      if (ev.data.type === "err") setError(ev.data.error);
    };

    w.addEventListener("message", onMsg);

    const modelUrl = "/models/forago_embed.onnx";
    const init: WorkerMsg = { type: "init", modelUrl };
    w.postMessage(init);

    return () => {
      w.removeEventListener("message", onMsg);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // fetch refs from server (Supabase -> public bucket URLs)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/scan/refs?kind=mushroom&limit=40", { cache: "no-store" });
      const j = (await r.json()) as RefsResponse;
      if (!r.ok || !("ok" in j) || (j as any).ok === false) throw new Error((j as any).error || "REFS_FAILED");
      setRefs((j as any).refs as Ref[]);
    })().catch((e: any) => setError(e?.message ?? "REFS_FAILED"));
  }, []);

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

  async function ensureRefVecs() {
    if (!refs?.length) throw new Error("REFS_NOT_READY");
    if (refVecsRef.current) return refVecsRef.current;

    const vecs: { slug: string; vec: Float32Array }[] = [];
    for (const it of refs) {
      const v = await workerEmbedUrl(it.imageUrl);
      vecs.push({ slug: it.slug, vec: v });
    }
    refVecsRef.current = vecs;
    return vecs;
  }

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

  async function runScan() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);
    setChecked({});

    try {
      const refVecs = await ensureRefVecs();

      const buf = await file.arrayBuffer();
      const q = await workerEmbedBlob(buf);

      const matches: Match[] = topK(q, refVecs, 3);
      const slugs = matches.map((m) => m.slug);

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs }),
      });

      const json = (await res.json()) as ScanResponse;
      if (!res.ok || !("ok" in json) || (json as any).ok === false) {
        throw new Error((json as any).error || "Scan fejlede");
      }

      const hydrated = (json as any).candidates as Candidate[];

      const ordered = slugs.map((slug, i) => {
        const c = hydrated.find((x) => x.slug === slug);
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

                      {(c.checks?.length
                        ? c.checks
                        : [
                            { id: "cap", label: "Tjek hat-form og farve" },
                            { id: "underside", label: "Tjek underside (ribber/lameller/porer)" },
                            { id: "stem", label: "Tjek stok (farve, ring, volva)" },
                          ]
                      ).map((chk) => {
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
