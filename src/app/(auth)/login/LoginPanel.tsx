"use client";

import { useState } from "react";
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

  async function sendMagicLink() {
    setErr(null);
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? "Noget gik galt");
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
            style={{ width: "100%", padding: 12, borderRadius: 12 }}
          />
          <button
            onClick={sendMagicLink}
            disabled={loading || !email.trim()}
            style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 12 }}
          >
            {loading ? "Sender…" : "Send login-link"}
          </button>
          {err ? <p style={{ marginTop: 10 }}>{err}</p> : null}
        </>
      )}
    </div>
  );
}