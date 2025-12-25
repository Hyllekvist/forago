"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./PostComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export function PostComposer() {
  const router = useRouter();
  const pathname = usePathname();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("Identification");
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // udleder locale fra URL ("/dk/ask" => "dk")
  const locale = (pathname?.split("/")[1] || "dk") as string;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkId(null);
    setLoading(true);

    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          type,
          title,
          body,
        }),
      });

      const json = (await res.json()) as ApiResp;

      if (!res.ok || !json.ok) {
        // hvis ikke logged in → send til login
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setErr(!json.ok ? json.error : "Failed");
        return;
      }

      setOkId(json.id);
      setTitle("");
      setBody("");
      setType("Identification");
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