"use client"; 

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Onboarding.module.css";

type Props = {
  locale: "dk" | "en" | "se" | "de";
  returnTo: string | null;
};

function safeLocalReturnTo(v: string | null) {
  if (!v) return null;
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//")) return null;
  return v;
}

export function OnboardingClient({ locale, returnTo }: Props) {
  const router = useRouter();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rt = useMemo(() => safeLocalReturnTo(returnTo) ?? `/${locale}/today`, [returnTo, locale]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setErr(null);

    try {
      const res = await fetch("/api/profile/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          display_name: displayName,
          bio,
          locale,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Kunne ikke gemme profil");

      router.replace(rt);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Ukendt fejl");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Opret sankeprofil</h1>
        <p className={styles.sub}>
          Så kan du logge fund og få en tydelig identitet i appen.
        </p>
      </header>

      <section className={styles.card}>
        <form onSubmit={onSave} className={styles.form}>
          <label className={styles.label}>
            Handle (unik)
            <input
              className={styles.input}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="fx viggo_4400"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <div className={styles.hint}>Kun a-z, 0-9 og _ (min 3 tegn)</div>
          </label>

          <label className={styles.label}>
            Visningsnavn (valgfrit)
            <input
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="fx Viggo"
            />
          </label>

          <label className={styles.label}>
            Bio (valgfrit)
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Hvad sanker du? (kort)"
              rows={3}
            />
          </label>

          {err ? <div className={styles.err}>{err}</div> : null}

          <button className={styles.btn} type="submit" disabled={busy}>
            {busy ? "Gemmer…" : "Gem profil"}
          </button>
        </form>
      </section>
    </main>
  );
}
