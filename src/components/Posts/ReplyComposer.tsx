"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./ReplyComposer.module.css";

type ApiOk = { ok: true; id: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

function safeLocale(v: string) {
  const s = (v || "").toLowerCase();
  return s === "dk" || s === "en" || s === "se" || s === "de" ? s : "dk";
}

function safeReturnTo(pathname: string | null, fallback: string) {
  const p = pathname || fallback;
  if (!p.startsWith("/")) return fallback;
  if (p.startsWith("//")) return fallback;
  return p;
}

export function ReplyComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = safeLocale((pathname?.split("/")[1] || "dk") as string);

  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);

    try {
      const res = await fetch("/api/comments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, body }),
      });

      const json = (await res.json()) as ApiResp;

      if (res.status === 401) {
        const rt = safeReturnTo(pathname, `/${locale}/ask`);
        const returnTo = encodeURIComponent(rt);
        router.push(`/${locale}/login?returnTo=${returnTo}`);
        return;
      }

      if (!res.ok || json.ok === false) {
        setErr(json.ok === false ? json.error : "Failed");
        return;
      }

      setOk(true);
      setBody("");

      // refresh så ny kommentar vises
      setTimeout(() => {
        router.refresh();
      }, 350);
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
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

        {ok ? <div className={styles.ok}>Svar postet ✓</div> : null}
        {err ? <div className={styles.err}>{err}</div> : null}
      </div>
    </form>
  );
}