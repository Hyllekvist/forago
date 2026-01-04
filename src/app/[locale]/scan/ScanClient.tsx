// src/app/[locale]/scan/ScanClient.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ScanPage.module.css";

type Candidate = {
  slug: string;
  name: string;
  latin?: string;
  confidence: "high" | "medium" | "low";
  why: string[];
  score: number; // 0-100
};

type RefItem = {
  slug: string;
  name: string;
  latin?: string;
  image_url: string; // public url
};

type WorkerMsg =
  | { type: "embed"; id: string; imageUrl: string; size?: number }
  | { type: "embed_result"; id: string; vector: number[] }
  | { type: "error"; id?: string; error: string };

function uid() {
  // crypto.randomUUID er ikke altid tilgængelig i alle runtime contexts
  // så vi har fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function cosine(a: Float32Array, b: Float32Array) {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const den = Math.sqrt(na) * Math.sqrt(nb);
  return den > 0 ? dot / den : 0;
}

// super simpel, stabil scoring (cosine -1..1 -> 0..100)
function scoreFromCos(sim: number) {
  const s = (sim + 1) / 2; // 0..1
  return Math.round(clamp01(s) * 100);
}

function confFromScore(score: number): Candidate["confidence"] {
  if (score >= 72) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function whyFromScore(score: number) {
  if (score >= 72) return ["Meget tæt visuel match", "Særligt lighed i form/struktur", "Høj samlet lighedsscore"];
  if (score >= 55) return ["Delvist match", "Nogle kendetegn matcher", "Tjek detaljer (bladform/lameller/stilk)"];
  return ["Svag match", "Prøv et skarpere nærbillede", "Sørg for god belysning og fokus"];
}

/**
 * Minimal IDB cache til embeddings (så refs bliver lynhurtige efter første kørsel)
 * Key: `ref:${slug}` / Value: number[]
 */
const IDB_NAME = "forago_scan";
const IDB_STORE = "embeds";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key: string): Promise<number[] | null> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as number[]) ?? null);
    req.onerror = () => resolve(null);
    tx.oncomplete = () => db.close();
  });
}
async function idbSet(key: string, val: number[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put(val, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      resolve();
    };
  });
}

export default function ScanClient() {
  const params = useParams();
  const locale = (params?.locale as string) || "dk";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // worker
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<string, (v: Float32Array) => void>());

  // refs
  const [refs, setRefs] = useState<RefItem[] | null>(null);
  const [refsError, setRefsError] = useState<string | null>(null);

  const canScan = useMemo(() => !!file && !loading, [file, loading]);

  useEffect(() => {
    // module worker (vigtigt for at undgå “import.meta outside module code” situations)
    const w = new Worker(new URL("../../../workers/vision.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = w;

    w.onmessage = (ev: MessageEvent<WorkerMsg>) => {
      const msg = ev.data;
      if (!msg) return;

      if (msg.type === "embed_result") {
        const cb = pendingRef.current.get(msg.id);
        if (cb) {
          pendingRef.current.delete(msg.id);
          cb(new Float32Array(msg.vector));
        }
      }

      if (msg.type === "error") {
        // hvis en pending findes – fail den ved at resolve tom vektor
        if (msg.id) {
          const cb = pendingRef.current.get(msg.id);
          if (cb) {
            pendingRef.current.delete(msg.id);
            cb(new Float32Array());
          }
        }
      }
    };

    return () => {
      w.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  useEffect(() => {
    // load refs (én gang) – du kan evt. tilføje kind=plant/mushroom senere
    let alive = true;
    (async () => {
      try {
        setRefsError(null);
        const res = await fetch("/api/scan/refs", { cache: "no-store" });
        if (!res.ok) throw new Error("Kunne ikke hente reference-billeder");
        const json = (await res.json()) as { ok: true; refs: RefItem[] } | { ok: false; error: string };

        if (!alive) return;
        if (!("ok" in json) || json.ok === false) throw new Error(("error" in json && json.error) || "REFS fejlede");
        setRefs(json.refs || []);
      } catch (e: any) {
        if (!alive) return;
        setRefsError(e?.message ?? "Kunne ikke hente refs");
        setRefs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function workerEmbedUrl(imageUrl: string) {
    return new Promise<Float32Array>((resolve, reject) => {
      const w = workerRef.current;
      if (!w) return reject(new Error("NO_WORKER"));

      const id = uid();
      pendingRef.current.set(id, resolve);
      w.postMessage({ type: "embed", id, imageUrl, size: 224 } satisfies WorkerMsg);
    });
  }

  function revokePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }

  function onPick(f: File | null) {
    setError(null);
    setCandidates(null);
    setSheetOpen(false);

    setFile(f);
    revokePreview();

    if (!f) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  useEffect(() => {
    // cleanup når component unmount
    return () => revokePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCandidates(null);
    setSheetOpen(false);

    try {
      // 1) lav temp public URL til input (via objectURL) så worker kan fetch via blob:
      // Worker kan ikke altid læse objectURL direkte på tværs, så vi laver en blob URL “stabilt”
      const inputUrl = previewUrl || URL.createObjectURL(file);

      // 2) embedding for input
      const inputVec = await workerEmbedUrl(inputUrl);
      if (!inputVec || inputVec.length === 0) throw new Error("Embedding fejlede (input)");

      // 3) refs skal være klar
      const refList = refs ?? [];
      if (refList.length === 0) throw new Error(refsError || "Ingen reference-billeder endnu");

      // 4) embeddings for refs (cache i IDB)
      const refVectors: { ref: RefItem; vec: Float32Array }[] = [];

      // lille batch, så UI ikke føles “låst”
      for (const r of refList) {
        const key = `ref:${r.slug}`;
        const cached = await idbGet(key);
        if (cached && cached.length > 0) {
          refVectors.push({ ref: r, vec: new Float32Array(cached) });
          continue;
        }
        const vec = await workerEmbedUrl(r.image_url);
        if (vec && vec.length > 0) {
          refVectors.push({ ref: r, vec });
          // cache
          void idbSet(key, Array.from(vec));
        }
      }

      if (refVectors.length === 0) throw new Error("Ingen reference-embeddings kunne beregnes");

      // 5) match
      const scored = refVectors
        .map(({ ref, vec }) => {
          const sim = cosine(inputVec, vec);
          const score = scoreFromCos(sim);
          return { ref, sim, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      const out: Candidate[] = scored.map((x) => ({
        slug: x.ref.slug,
        name: x.ref.name,
        latin: x.ref.latin,
        score: x.score,
        confidence: confFromScore(x.score),
        why: whyFromScore(x.score),
      }));

      setCandidates(out);
      setSheetOpen(true);

      // 6) scroll så resultater “appear” uden at brugeren skal scrolle
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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

        {(error || refsError) && <div className={styles.error}>{error || refsError}</div>}
      </section>

      {/* Anchor for auto-scroll */}
      <div ref={resultsRef} />

      {/* Sheet (resultater) */}
      <div
        aria-hidden={!sheetOpen}
        className={styles.sheetOverlay}
        data-open={sheetOpen ? "1" : "0"}
        onClick={() => setSheetOpen(false)}
      />

      <section className={styles.sheet} data-open={sheetOpen ? "1" : "0"} role="dialog" aria-label="Scanresultater">
        <div className={styles.sheetHandleRow}>
          <button className={styles.sheetHandleBtn} onClick={() => setSheetOpen(false)} aria-label="Luk">
            <span className={styles.sheetHandle} />
          </button>
        </div>

        <div className={styles.sheetInner}>
          <div className={styles.resultsHead}>Mulige arter</div>

          {candidates ? (
            <div className={styles.grid}>
              {candidates.map((c) => (
                <article key={c.slug} className={styles.resultCard}>
                  <div className={styles.resultTop}>
                    <div className={styles.names}>
                      <div className={styles.name}>{c.name}</div>
                      {c.latin && <div className={styles.latin}>{c.latin}</div>}
                    </div>

                    <div className={styles.confWrap}>
                      <span className={styles.score}>{c.score}</span>
                      <span className={styles.conf} data-conf={c.confidence}>
                        {c.confidence === "high" ? "Høj" : c.confidence === "medium" ? "Medium" : "Lav"}
                      </span>
                    </div>
                  </div>

                  <ul className={styles.why}>
                    {c.why.slice(0, 3).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>

                  <a className={styles.open} href={`/${locale}/species/${c.slug}`}>
                    Åbn artsside →
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.tip}>Kør et scan for at se matches.</div>
          )}
        </div>
      </section>
    </main>
  );
}
