"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./PostComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function clamp(s: string, n: number) {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n) : t;
}

export function PostComposer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // ✅ Default væk fra “Identification” (forago er ikke svampe-only længere)
  const [type, setType] = useState("How-to");

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locale = (pathname?.split("/")[1] || "dk") as string;

  // ✅ Prefill fra URL: /ask?q=... (&type=How-to)
  const qParam = (searchParams?.get("q") || "").trim();
  const typeParam = (searchParams?.get("type") || "").trim();

  useEffect(() => {
    const q = clamp(qParam, 180);
    const t = clamp(typeParam, 30);

    if (q) setTitle((prev) => (prev ? prev : q));
    if (t) setType(t);
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

      if (res.status === 401) {
        const returnTo = encodeURIComponent(pathname || `/${locale}/ask`);
        router.push(`/${locale}/login?returnTo=${returnTo}`);
        return;
      }

      if (!res.ok || json.ok === false) {
        setErr(json.ok === false ? json.error : "Failed");
        return;
      }

      setOkId(json.id);
      setTitle("");
      setBody("");
      setType("How-to");
      setShowAdvanced(false);

      router.replace(pathname || `/${locale}/ask`);
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {/* ✅ Avanceret toggle i stedet for at vise Type upfront */}
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.advancedBtn}
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Skjul avanceret" : "Avanceret"}
        </button>

        <div className={styles.hint}>
          Tip: 1 sætning i titel + 1–3 linjer i detaljer.
        </div>
      </div>

      {showAdvanced ? (
        <label className={styles.label}>
          Type
          <select
            className={styles.input}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
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
