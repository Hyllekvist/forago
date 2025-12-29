"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./LoginPanel.module.css";
import { createClient } from "@/lib/supabase/client";

function safeLocalReturnTo(v: string | null) {
  if (!v) return null;
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//")) return null;
  return v;
}

export function LoginPanel() {
  const supabase = useMemo(() => createClient(), []);
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setError(null);
    setBusy(true);

    const returnTo = safeLocalReturnTo(sp?.get("returnTo")) || safeLocalReturnTo(sp?.get("next"));

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/callback${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) setError(error.message);
    else setSent(true);

    setBusy(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.h1}>Login</h1>
        <p className={styles.sub}>We’ll send a magic link to your email.</p>

        {sent ? (
          <div className={styles.ok}>
            Check your inbox. You can close this tab after logging in.
          </div>
        ) : (
          <form onSubmit={onMagicLink} className={styles.form}>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            {error && <div className={styles.err}>{error}</div>}

            <button className={styles.btn} type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
