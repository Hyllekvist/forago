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
  const [type, setType] = useState("Identification");
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locale = (pathname?.split("/")[1] || "dk") as string;

  // ✅ Prefill fra URL: /ask?q=... (&type=How-to)
  useEffect(() => {
    const q = clamp(searchParams?.get("q") || "", 180);
    const t = clamp(searchParams?.get("type") || "", 30);

    if (q) setTitle((prev) => (prev ? prev : q)); // overskriv ikke hvis user allerede skriver
    if (t) setType(t);

    // Hvis du vil auto-fokusere Title når q findes:
    // requestAnimationFrame(() => document.getElementById("pc-title")?.focus());
  }, [searchParams]);

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
      setType("Identification");

      // ✅ Ryd URL query så eksemplet ikke bliver ved med at prefill'e
      router.replace(pathname || `/${locale}/ask`);

      // Optional:
      // router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        Type
        <select
          className={styles.input}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>Identification</option>
          <option>How-to</option>
          <option>Recipe</option>
          <option>Guide</option>
        </select>
      </label>

      <label className={styles.label}>
        Title
        <input
          id="pc-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
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
