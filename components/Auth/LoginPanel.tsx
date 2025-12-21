"use client";

import { useMemo, useState } from "react";
import styles from "./LoginPanel.module.css";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LoginPanel() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) setError(error.message);
    else setSent(true);
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

            <button className={styles.btn} type="submit">
              Send link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
