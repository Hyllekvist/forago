"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./PostComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { error: string };

function localeFromPath(pathname: string | null) {
  const seg = (pathname ?? "/").split("/").filter(Boolean)[0];
  return seg && ["dk", "en", "se", "de"].includes(seg) ? seg : "dk";
}

export function PostComposer() {
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(() => localeFromPath(pathname), [pathname]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("Identification");

  const [loading, setLoading] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkId(null);
    setLoading(true);

    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          type,
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const json = (await res.json()) as ApiOk | ApiErr;

      if (res.status === 401) {
        // ikke logget ind
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(("error" in json && json.error) || "Failed to post");
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
          disabled={loading}
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
          disabled={loading}
        />
      </label>

      <label className={styles.label}>
        Details
        <textarea
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          disabled={loading}
        />
      </label>

      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? "Posting…" : "Post"}
      </button>

      {err && <div className={styles.err}>{err}</div>}
      {okId && <div className={styles.ok}>Saved ✓</div>}
    </form>
  );
}