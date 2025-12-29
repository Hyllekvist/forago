"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function inferLocaleFromPath(pathname: string) {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "dk" || seg === "en" || seg === "se" || seg === "de" ? seg : "dk";
}

function safeLocalPath(p: string | null) {
  if (!p) return null;
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//")) return null;
  return p;
}

export default function CallbackPage() {
  const supabase = useMemo(() => createClient(), []);
  const sp = useSearchParams();
  const pathname = usePathname() || "/dk/callback";
  const locale = useMemo(() => inferLocaleFromPath(pathname), [pathname]);

  const [msg, setMsg] = useState("Logger ind…");

  useEffect(() => {
    const code = sp.get("code");
    const errorDesc = sp.get("error_description") || sp.get("error");

    const returnTo =
      safeLocalPath(sp.get("returnTo")) ||
      safeLocalPath(sp.get("next")) ||
      safeLocalPath(sp.get("redirectTo")) ||
      `/${locale}/today`;

    (async () => {
      if (errorDesc) {
        window.location.replace(`/${locale}/login?e=callback_failed`);
        return;
      }

      if (!code) {
        window.location.replace(`/${locale}/login?e=missing_code`);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // (kort, men nok til at debugge)
        window.location.replace(`/${locale}/login?e=exchange_failed`);
        return;
      }

      setMsg("Færdig! Sender dig videre…");
      window.location.replace(returnTo);
    })();
  }, [sp, supabase, locale]);

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>Callback</h1>
      <p style={{ opacity: 0.8 }}>{msg}</p>
    </main>
  );
}
