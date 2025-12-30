"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

type Mode = "signin" | "signup";

export default function LoginPanel() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale as string) || "dk";

  const supabase = useMemo(() => getSupabase(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const afterLogin = `/${locale}/map`; // <-- justér til din “første side efter login”
  const resetRedirectTo = `${origin}/${locale}/reset`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    try {
      if (!email.trim()) throw new Error("Indtast email.");
      if (!password.trim()) throw new Error("Indtast password.");

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.replace(afterLogin);
        router.refresh();
        return;
      }

      // signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // hvis du kræver email confirmation i Supabase
          emailRedirectTo: `${origin}/${locale}/auth/callback`,
        },
      });
      if (error) throw error;

      setMsg(
        "Konto oprettet. Hvis email-bekræftelse er slået til, så tjek din inbox."
      );
    } catch (err: any) {
      setMsg(err?.message ?? "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    setMsg(null);
    setBusy(true);
    try {
      if (!email.trim()) throw new Error("Skriv din email først.");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectTo,
      });
      if (error) throw error;

      setMsg("Tjek din mail for link til at vælge nyt password.");
    } catch (err: any) {
      setMsg(err?.message ?? "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  async function onMagicLinkFallback() {
    setMsg(null);
    setBusy(true);

    try {
      if (!email.trim()) throw new Error("Indtast email.");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/${locale}/auth/callback`,
        },
      });
      if (error) throw error;

      setMsg("Magic link sendt. Åbn linket i samme browser som du logger ind i.");
    } catch (err: any) {
      setMsg(err?.message ?? "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>
        {mode === "signin" ? "Log ind" : "Opret konto"}
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="mail@domæne.dk"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Arbejder..." : mode === "signin" ? "Log ind" : "Opret konto"}
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            disabled={busy}
          >
            {mode === "signin" ? "Opret konto" : "Har du allerede konto? Log ind"}
          </button>

          <button type="button" onClick={onForgotPassword} disabled={busy}>
            Glemt password?
          </button>
        </div>

        <hr style={{ opacity: 0.25 }} />

        <button type="button" onClick={onMagicLinkFallback} disabled={busy}>
          Send magic link (fallback)
        </button>

        {msg ? (
          <p style={{ margin: "8px 0 0", opacity: 0.9 }}>{msg}</p>
        ) : null}
      </form>
    </div>
  );
}
