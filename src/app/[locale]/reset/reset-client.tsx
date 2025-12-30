"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export default function ResetClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = (params?.locale as string) || "dk";

  const supabase = useMemo(() => getSupabase(), []);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    try {
      if (pw1.length < 8) throw new Error("Password skal være mindst 8 tegn.");
      if (pw1 !== pw2) throw new Error("Passwords matcher ikke.");

      // Når brugeren kommer via reset-linket, er sessionen “midlertidigt” aktiv
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;

      setMsg("Password opdateret. Sender dig videre…");
      router.replace(`/${locale}/map`);
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "Noget gik galt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Vælg nyt password</h1>

      <form onSubmit={onSetPassword} style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nyt password</span>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Gentag nyt password</span>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Arbejder..." : "Opdater password"}
        </button>

        {msg ? <p style={{ margin: "8px 0 0", opacity: 0.9 }}>{msg}</p> : null}
      </form>
    </div>
  );
}
