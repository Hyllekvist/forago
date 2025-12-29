"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function safeLocalPath(p: string | null) {
  if (!p) return null;
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//")) return null;
  return p;
}

function inferLocaleFromPath(pathname: string) {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "dk" || seg === "en" || seg === "se" || seg === "de" ? seg : "dk";
}

export default function CallbackClient() {
  const pathname = usePathname() || "/dk/callback";
  const search = useSearchParams();

  const locale = useMemo(() => inferLocaleFromPath(pathname), [pathname]);

  const [status, setStatus] = useState<"working" | "error">("working");
  const [msg, setMsg] = useState<string>("Logger ind…");

  useEffect(() => {
    const code = search.get("code");

    const errorDesc = search.get("error_description") || search.get("error");
    const returnTo =
      safeLocalPath(search.get("returnTo")) ||
      safeLocalPath(search.get("next")) ||
      safeLocalPath(search.get("redirectTo"));

    if (errorDesc) {
      window.location.replace(`/${locale}/login?e=callback_failed`);
      return;
    }

    if (!code) {
      window.location.replace(`/${locale}/login?e=missing_code`);
      return;
    }

    // IMPORTANT:
    // Din server-route laver selve exchange: src/app/[locale]/callback/route.ts
    // Så vi navigerer til den route (samme URL/query), som vil sætte cookies og redirecte.
    const qs = new URLSearchParams();
    qs.set("code", code);
    if (returnTo) qs.set("returnTo", returnTo);

    setMsg("Færdiggør login…");
    window.location.replace(`/${locale}/callback?${qs.toString()}`);
  }, [search, locale]);

  // fallback UI (den vil normalt kun blitze kort)
  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>Callback</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>{msg}</p>

      {status === "error" ? (
        <p style={{ marginTop: 16 }}>
          Noget gik galt. Prøv igen fra <a href={`/${locale}/login`}>login</a>.
        </p>
      ) : null}
    </main>
  );
}