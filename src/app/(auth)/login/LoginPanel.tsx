"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { usePathname, useSearchParams } from "next/navigation";

function inferLocaleFromPath(pathname: string) {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "dk" || seg === "en" || seg === "se" || seg === "de" ? seg : "dk";
}

function safeLocalReturnTo(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export function LoginPanel() {
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const pathname = usePathname() || "/dk/login";
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setErr(null);

    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const origin = window.location.origin;

      const locale = inferLocaleFromPath(pathname);

      // 👇 hvis du kommer fra en beskyttet side, bør den sende ?returnTo=/dk/post/123
      // fallback: send tilbage til /[locale]/today
      const returnToFromQuery =
        safeLocalReturnTo(searchParams?.get("returnTo")) ||
        safeLocalReturnTo(searchParams?.get("next"));

      const returnTo = returnToFromQuery ?? `/${locale}/today`;

      // ✅ callback med locale + returnTo
      const redirectTo = `${origin}/${locale}/callback?returnTo=${encodeURIComponent(returnTo)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.log("signInWithOtp error:", error);
        throw error;
      }

      setSent(true);
    } catch (e: any) {
      console.log("magic link error raw:", e);

      const msg =
        e?.message ||
        e?.error_description ||
        e?.details ||
        (typeof e === "string" ? e : null) ||
        "Noget gik galt";

      setErr(String(msg));
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
            autoComplete="email"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
            }}
          />

          <button
            onClick={sendMagicLink}
            disabled={loading || !email.trim()}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? "Sender…" : "Send login-link"}
          </button>

          {err ? (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255, 80, 80, 0.35)",
                background: "rgba(255, 80, 80, 0.10)",
              }}
            >
              {err}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}