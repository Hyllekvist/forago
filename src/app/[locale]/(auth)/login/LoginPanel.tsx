"use client";

import { useMemo, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./LoginPanel.module.css";

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
      signinTitle: dk ? "Login" : "Login",
      signupTitle: dk ? "Opret konto" : "Create account",
      signinSub: dk
        ? "Log ind med password – eller brug magic link som fallback."
        : "Sign in with password — or use magic link as fallback.",
      signupSub: dk
        ? "Du opretter en ny konto med email og password."
        : "You’re creating a new account with email and password.",
      email: "Email",
      password: dk ? "Password" : "Password",
      signin: dk ? "Log ind" : "Sign in",
      signup: dk ? "Opret konto" : "Create account",
      haveAccount: dk ? "Har du allerede konto? Log ind" : "Already have an account? Sign in",
      noAccount: dk ? "Ingen konto? Opret konto" : "No account? Create one",
      forgot: dk ? "Glemt password?" : "Forgot password?",
      magic: dk ? "Send magic link (fallback)" : "Send magic link (fallback)",
      sending: dk ? "Arbejder…" : "Working…",
      after: dk ? "Efter login sendes du tilbage til:" : "After login you’ll return to:",
      magicHintSignup: dk
        ? "Magic link er kun til login. Skift til “Log ind” hvis du har en konto."
        : "Magic link is for sign-in only. Switch to “Sign in” if you already have an account.",
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

        router.refresh();
router.replace(returnTo);
          return;
        }

        const origin = window.location.origin;

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${origin}/${locale}/confirm?returnTo=${encodeURIComponent(returnTo)}`,
          },
        });

        if (error) throw error;

        // confirmation OFF -> session med det samme
        if (data?.session) {
          router.replace(returnTo);
          router.refresh();
          return;
        }

        // confirmation ON -> user oprettet, afventer mail
        if (!data?.user) {
          throw new Error(
            locale === "dk"
              ? "Signup gav ingen bruger. Prøv at logge ind i stedet."
              : "Signup returned no user. Try signing in instead."
          );
        }

        setMsg(
          locale === "dk"
            ? "Konto oprettet. Tjek din inbox + spam for bekræftelsesmail."
            : "Account created. Check your inbox + spam for the confirmation email."
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

      setMsg(
        locale === "dk"
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

  const heading = mode === "signup" ? t.signupTitle : t.signinTitle;
  const sub = mode === "signup" ? t.signupSub : t.signinSub;

  return (
    <div className={styles.wrap} data-mode={mode}>
      <div className={styles.card}>
        <div className={styles.head}>
          <h1 className={styles.h1}>{heading}</h1>
          <p className={styles.sub}>{sub}</p>

          <div className={styles.segment}>
            <button
              type="button"
              className={mode === "signin" ? styles.segActive : styles.segBtn}
              onClick={() => setMode("signin")}
              disabled={loading}
            >
              {locale === "dk" ? "Log ind" : "Sign in"}
            </button>
            <button
              type="button"
              className={mode === "signup" ? styles.segActive : styles.segBtn}
              onClick={() => setMode("signup")}
              disabled={loading}
            >
              {locale === "dk" ? "Opret" : "Sign up"}
            </button>
          </div>
        </div>

        <form className={styles.form} onSubmit={onPasswordSubmit}>
          <label className={styles.label}>
            {t.email}
            <input
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder={t.email}
            />
          </label>

          <label className={styles.label}>
            {t.password}
            <input
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={t.password}
            />
          </label>

          <button className={styles.primary} disabled={loading || !cleanEmail || !password.trim()} type="submit">
            {loading ? t.sending : mode === "signin" ? t.signin : t.signup}
          </button>

          <div className={styles.row}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              disabled={loading}
            >
              {mode === "signin" ? t.noAccount : t.haveAccount}
            </button>

            {mode === "signin" ? (
              <button
                type="button"
                className={styles.ghost}
                onClick={onForgotPassword}
                disabled={loading || !cleanEmail}
              >
                {t.forgot}
              </button>
            ) : null}
          </div>

          {mode === "signin" ? (
            <>
              <div className={styles.divider} />

              <button
                onClick={onMagicLinkFallback}
                disabled={loading || !cleanEmail}
                type="button"
                className={styles.secondary}
              >
                {loading ? t.sending : t.magic}
              </button>

              <div className={styles.hint}>
                {t.after} <code>{returnTo}</code>
              </div>

              {sentMagic ? (
                <div className={styles.ok}>
                  {locale === "dk"
                    ? "Tjek din inbox. Åbn linket i samme browser, hvis muligt."
                    : "Check your inbox. Open the link in the same browser if possible."}
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.hint}>{t.magicHintSignup}</div>
          )}

          {msg ? <div className={styles.ok}>{msg}</div> : null}
          {err ? <div className={styles.err}>{err}</div> : null}
        </form>
      </div>
    </div>
  );
}
