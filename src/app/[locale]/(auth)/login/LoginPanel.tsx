"use client";

import { useMemo, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

function safeLocalUrlWithQuery(path: string, query: string) {
  // fail closed: kun interne paths
  if (!path.startsWith("/")) return "/";
  if (!query) return path;
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

export function LoginPanel() {
  const supabase = useMemo(() => createClient(), []);

  const pathname = usePathname() || "/dk/login";
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locale = useMemo(() => inferLocaleFromPath(pathname), [pathname]);

  const returnTo = useMemo(() => {
    const fromQuery =
      safeLocalReturnTo(searchParams?.get("returnTo")) ||
      safeLocalReturnTo(searchParams?.get("next"));

    return fromQuery ?? `/${locale}/today`;
  }, [searchParams, locale]);

  const sendMagicLink = useCallback(async () => {
    setErr(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const origin = window.location.origin;

      // Hvis login flowet kom fra map drop-gate, så ligger drop payload i login url'en.
      // Vi skal sende den med tilbage til returnTo, så MapClient kan restore drop.
      const dropRaw = searchParams?.get("drop");
      const dropParam = typeof dropRaw === "string" && dropRaw.length > 0 ? dropRaw : null;

      const returnToWithDrop = dropParam
        ? safeLocalUrlWithQuery(returnTo, `drop=${encodeURIComponent(dropParam)}`)
        : returnTo;

      // ✅ callback route: /[locale]/callback (din route ligger under src/app/[locale]/(auth)/callback/route.ts)
      const redirectTo = `${origin}/${locale}/callback?returnTo=${encodeURIComponent(returnToWithDrop)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setSent(true);
    } catch (e: any) {
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
  }, [email, locale, returnTo, searchParams, supabase]);

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Login</h1>

      <p style={{ opacity: 0.75, marginTop: 6 }}>
        {locale === "dk" ? "Vi sender et magic link til din email." : "We’ll send a magic link to your email."}
      </p>

      {sent ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid rgba(61,220,151,0.35)",
            background: "rgba(61,220,151,0.10)",
          }}
        >
          {locale === "dk"
            ? "Tjek din inbox. Du kan lukke fanen efter login."
            : "Check your inbox. You can close this tab after logging in."}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={locale === "dk" ? "Email" : "Email"}
            inputMode="email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
              outline: "none",
            }}
          />

          <button
            onClick={sendMagicLink}
            disabled={loading || !email.trim()}
            type="button"
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
              fontWeight: 800,
            }}
          >
            {locale === "dk" ? (loading ? "Sender…" : "Send login-link") : loading ? "Sending…" : "Send login link"}
          </button>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            {locale === "dk" ? (
              <>
                Efter login sendes du tilbage til: <code>{returnTo}</code>
              </>
            ) : (
              <>
                After login you’ll return to: <code>{returnTo}</code>
              </>
            )}
          </div>

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
        </div>
      )}
    </div>
  );
}
