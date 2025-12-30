"use client";

import { useMemo, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Mode = "signin" | "signup";

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
  if (!path.startsWith("/")) return "/";
  if (!query) return path;
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

export function LoginPanel() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const router = useRouter();
  const pathname = usePathname() || "/dk/login";
  const searchParams = useSearchParams();

  const locale = useMemo(() => inferLocaleFromPath(pathname), [pathname]);

  const returnToBase = useMemo(() => {
    const fromQuery =
      safeLocalReturnTo(searchParams?.get("returnTo")) ||
      safeLocalReturnTo(searchParams?.get("next"));

    return fromQuery ?? `/${locale}/today`;
  }, [searchParams, locale]);

  // carry drop payload (fra map gate)
  const returnTo = useMemo(() => {
    const dropRaw = searchParams?.get("drop");
    const dropParam = typeof dropRaw === "string" && dropRaw.length > 0 ? dropRaw : null;
    return dropParam
      ? safeLocalUrlWithQuery(returnToBase, `drop=${encodeURIComponent(dropParam)}`)
      : returnToBase;
  }, [returnToBase, searchParams]);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sentMagic, setSentMagic] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = useMemo(() => {
    const dk = locale === "dk";
    return {
      title: dk ? "Login" : "Login",
      subtitle: dk ? "Log ind med password – eller brug magic link som fallback." : "Sign in with password — or use magic link as fallback.",
      email: dk ? "Email" : "Email",
      password: dk ? "Password" : "Password",
      signin: dk ? "Log ind" : "Sign in",
      signup: dk ? "Opret konto" : "Create account",
      haveAccount: dk ? "Har du allerede konto? Log ind" : "Already have an account? Sign in",
      noAccount: dk ? "Ingen konto? Opret konto" : "No account? Create one",
      forgot: dk ? "Glemt password?" : "Forgot password?",
      magic: dk ? "Send magic link (fallback)" : "Send magic link (fallback)",
      sending: dk ? "Arbejder…" : "Working…",
      after: dk ? "Efter login sendes du tilbage til:" : "After login you’ll return to:",
    };
  }, [locale]);

  const cleanEmail = email.trim().toLowerCase();

  const onPasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErr(null);
      setMsg(null);
      setSentMagic(false);

      if (!cleanEmail) return;
      if (!password.trim()) {
        setErr(locale === "dk" ? "Indtast password." : "Enter password.");
        return;
      }

      setLoading(true);
      try {
        if (mode === "signin") {
          const { error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (error) throw error;

          router.replace(returnTo);
          router.refresh();
          return;
        }

        // signup
        const origin = window.location.origin;

        // Bemærk: signup kan kræve email confirmation afhængigt af Supabase settings.
        // Hvis confirmation er ON, får brugeren en mail og ender via callback (token_hash/type) eller code (afhængigt af template).
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${origin}/${locale}/confirm?returnTo=${encodeURIComponent(returnTo)}`,
          },
        });
        if (error) throw error;

        setMsg(locale === "dk"
          ? "Konto oprettet. Hvis email-bekræftelse er slået til, så tjek din inbox."
          : "Account created. If email confirmation is enabled, check your inbox."
        );
      } catch (e: any) {
        const m =
          e?.message ||
          e?.error_description ||
          e?.details ||
          (typeof e === "string" ? e : null) ||
          "Noget gik galt";
        setErr(String(m));
      } finally {
        setLoading(false);
      }
    },
    [cleanEmail, password, mode, supabase, router, returnTo, locale]
  );

  const onForgotPassword = useCallback(async () => {
    setErr(null);
    setMsg(null);
    setSentMagic(false);

    if (!cleanEmail) return;

    setLoading(true);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/${locale}/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });
      if (error) throw error;

      setMsg(locale === "dk"
        ? "Tjek din mail for link til at vælge nyt password."
        : "Check your email for a link to set a new password."
      );
    } catch (e: any) {
      const m =
        e?.message ||
        e?.error_description ||
        e?.details ||
        (typeof e === "string" ? e : null) ||
        "Noget gik galt";
      setErr(String(m));
    } finally {
      setLoading(false);
    }
  }, [cleanEmail, supabase, locale]);

  const onMagicLinkFallback = useCallback(async () => {
    setErr(null);
    setMsg(null);
    setSentMagic(false);

    if (!cleanEmail) return;

    setLoading(true);
    try {
      const origin = window.location.origin;

      // VIGTIGT: hold redirectTo præcis som før (+ returnTo)
      const redirectTo = `${origin}/${locale}/callback?returnTo=${encodeURIComponent(returnTo)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      setSentMagic(true);
    } catch (e: any) {
      const m =
        e?.message ||
        e?.error_description ||
        e?.details ||
        (typeof e === "string" ? e : null) ||
        "Noget gik galt";
      setErr(String(m));
    } finally {
      setLoading(false);
    }
  }, [cleanEmail, supabase, locale, returnTo]);

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>{t.title}</h1>
      <p style={{ opacity: 0.75, marginTop: 6 }}>{t.subtitle}</p>

      <form onSubmit={onPasswordSubmit} style={{ marginTop: 14 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
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

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.password}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          style={{
            width: "100%",
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "inherit",
            outline: "none",
          }}
        />

        <button
          disabled={loading || !cleanEmail || !password.trim()}
          type="submit"
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
          {loading ? t.sending : mode === "signin" ? t.signin : t.signup}
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
              cursor: loading ? "default" : "pointer",
              fontWeight: 700,
            }}
          >
            {mode === "signin" ? t.noAccount : t.haveAccount}
          </button>

          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading || !cleanEmail}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
              cursor: loading ? "default" : "pointer",
              fontWeight: 700,
            }}
          >
            {t.forgot}
          </button>
        </div>

        <hr style={{ opacity: 0.25, margin: "14px 0" }} />

        <button
          onClick={onMagicLinkFallback}
          disabled={loading || !cleanEmail}
          type="button"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            color: "inherit",
            cursor: loading ? "default" : "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? t.sending : t.magic}
        </button>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          {t.after} <code>{returnTo}</code>
        </div>

        {sentMagic ? (
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
              ? "Tjek din inbox. Åbn linket i samme browser, hvis muligt."
              : "Check your inbox. Open the link in the same browser if possible."}
          </div>
        ) : null}

        {msg ? (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(61,220,151,0.35)",
              background: "rgba(61,220,151,0.10)",
            }}
          >
            {msg}
          </div>
        ) : null}

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
      </form>
    </div>
  );
}
