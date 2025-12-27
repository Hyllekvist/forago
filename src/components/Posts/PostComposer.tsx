"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./PostComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function clamp(s: string, n: number) {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n) : t;
}

type Draft = {
  title: string;
  body: string;
  type: string;
  ts: number;
};

export function PostComposer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = (pathname?.split("/")[1] || "dk") as string;

  // ✅ Default væk fra “Identification”
  const [type, setType] = useState("How-to");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------- Draft storage (så login ikke smider teksten væk) ----------
  const draftKey = useMemo(() => `forago_draft:${locale}:ask`, [locale]);

  function saveDraft(partial?: Partial<Draft>) {
    if (typeof window === "undefined") return;
    const draft: Draft = {
      title,
      body,
      type,
      ts: Date.now(),
      ...(partial ?? {}),
    };
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {}
  }

  function clearDraft() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {}
  }

  // Restore draft on mount (fx efter login redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;

      // drop old drafts (7 dage)
      if (!d?.ts || Date.now() - d.ts > 7 * 24 * 60 * 60 * 1000) {
        clearDraft();
        return;
      }

      if (d.title) setTitle((prev) => (prev ? prev : d.title));
      if (d.body) setBody((prev) => (prev ? prev : d.body));
      if (d.type) setType(d.type);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Gem draft løbende (lightweight)
  useEffect(() => {
    // gem ikke tomt
    if (!title && !body) return;
    const t = window.setTimeout(() => saveDraft(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, type]);

  // ---------- Prefill fra URL (eksempler) ----------
  const qParam = (searchParams?.get("q") || "").trim();
  const typeParam = (searchParams?.get("type") || "").trim();

  useEffect(() => {
    const q = clamp(qParam, 180);
    const t = clamp(typeParam, 30);

    if (q) {
      setTitle((prev) => (prev ? prev : q));
      // Gem med det samme så login-loop ikke mister det
      saveDraft({ title: q });
    }
    if (t) {
      setType(t);
      saveDraft({ type: t });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, typeParam]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkId(null);
    setLoading(true);

    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, type, title, body }),
      });

      const json = (await res.json()) as ApiResp;

      // Ikke logged in → gem draft og send til login
      if (res.status === 401) {
        saveDraft();
        const returnTo = encodeURIComponent(pathname || `/${locale}/ask`);
        router.push(`/${locale}/login?returnTo=${returnTo}`);
        return;
      }

      // Fejl (TS-sikkert)
      if (!res.ok || json.ok === false) {
        setErr(json.ok === false ? json.error : "Failed");
        return;
      }

      // ✅ Success: ryd draft + redirect til post-siden (samme som PostCard)
      setOkId(json.id);
      clearDraft();
      router.push(`/${locale}/post/${json.id}`);
      return;
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.advancedBtn}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Skjul avanceret" : "Avanceret"}
        </button>

        <div className={styles.hint}>Tip: 1 sætning i titel + 1–3 linjer i detaljer.</div>
      </div>

      {showAdvanced ? (
        <label className={styles.label}>
          Type
          <select className={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
            <option>How-to</option>
            <option>Guide</option>
            <option>Recipe</option>
            <option>Identification</option>
          </select>
        </label>
      ) : null}

      <label className={styles.label}>
        Title
        <input
          id="pc-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Fx: Bedste kaffebar til at arbejde i København?"
        />
      </label>

      <label className={styles.label}>
        Details
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
          placeholder="Giv lidt kontekst: område, budget, hvad du allerede har prøvet…"
        />
      </label>

      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? "Posting…" : "Post"}
      </button>

      {err ? <div className={styles.err}>{err}</div> : null}
      {okId ? <div className={styles.ok}>Posted ✅ (id: {okId})</div> : null}
    </form>
  );
}
