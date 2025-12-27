"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./ReplyComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export function ReplyComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locale = (pathname?.split("/")[1] || "dk") as string;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, body }),
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

      setBody("");
      router.refresh(); // ✅ viser nyt reply med det samme
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} aria-label="Write a reply">
      <div className={styles.head}>
        <div className={styles.title}>Skriv et svar</div>
        <div className={styles.hint}>Hold det kort og konkret.</div>
      </div>

      <textarea
        className={styles.textarea}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        required
        placeholder="Dit svar…"
      />

      <div className={styles.actions}>
        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "Poster…" : "Post svar"}
        </button>
        {err ? <div className={styles.err}>{err}</div> : null}
      </div>
    </form>
  );
}
