"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(() => {
    // Brug fast prod-url hvis den findes (anbefalet), ellers fallback til origin.
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    try {
      return new URL("/callback", base).toString();
    } catch {
      return `${base}/callback`;
    }
  }, []);

  async function sendMagicLink() {
    setErr(null);
    setLoading(true);

    try {
      const clean = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        // Vis præcis Supabase-fejl (den du har brug for)
        throw error;
      }

      setSent(true);
    } catch (e: any) {
      // Supabase giver ofte { message, status, name }
      const msg =
        e?.message ||
        e?.error_description ||
        JSON.stringify(e, null, 2) ||
        "Error sending magic link email";

      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Login</h1>

      {sent ? (
        <p>Tjek din email for login-linket.</p>
      ) : (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            style={{ width: "100%", padding: 12, borderRadius: 12 }}
          />
          <button
            onClick={sendMagicLink}
            disabled={loading || !email.trim()}
            style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12 }}
          >
            {loading ? "Sender…" : "Send login-link"}
          </button>

          {err ? (
            <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", opacity: 0.9 }}>
              {err}
            </pre>
          ) : null}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            redirectTo: {redirectTo}
          </div>
        </>
      )}
    </div>
  );
}