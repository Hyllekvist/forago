"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

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

export default function ConfirmClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname() || "/dk/confirm";
  const locale = useMemo(() => inferLocaleFromPath(pathname), [pathname]);

  const [msg, setMsg] = useState(locale === "dk" ? "Bekræfter…" : "Confirming…");
  const [err, setErr] = useState<string | null>(null);

  const returnTo = useMemo(() => {
    return safeLocalReturnTo(sp.get("returnTo")) || `/${locale}/today`;
  }, [sp, locale]);

  useEffect(() => {
    const run = async () => {
      const errorDesc = sp.get("error_description") || sp.get("error");
      if (errorDesc) {
        setErr(errorDesc);
        setMsg(locale === "dk" ? "Noget gik galt." : "Something went wrong.");
        return;
      }

      const code = sp.get("code");
      if (!code) {
        setErr("Missing code");
        setMsg(locale === "dk" ? "Noget gik galt." : "Something went wrong.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setErr(error.message);
        setMsg(locale === "dk" ? "Kunne ikke bekræfte." : "Could not confirm.");
        return;
      }

      router.replace(returnTo);
      router.refresh();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>
        {locale === "dk" ? "Bekræfter konto…" : "Confirming account…"}
      </h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>{msg}</p>

      {err ? (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255, 80, 80, 0.35)",
            background: "rgba(255, 80, 80, 0.10)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Fejl</div>
          <div style={{ fontSize: 13 }}>{err}</div>
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85 }}>
            Tip: Åbn linket i samme browser hvor du oprettede kontoen (undgå in-app browser).
          </div>
        </div>
      ) : null}
    </main>
  );
}
