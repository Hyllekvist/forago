"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

function inferLocaleFromPath(pathname: string) {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "dk" || seg === "en" || seg === "se" || seg === "de" ? seg : "dk";
}

export function LogoutButton({ className }: { className?: string }) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const pathname = usePathname() || "/dk/me";
  const locale = inferLocaleFromPath(pathname);

  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await supabase.auth.signOut();
          router.replace(`/${locale}/login`);
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.04)",
        color: "inherit",
        cursor: loading ? "default" : "pointer",
        fontWeight: 800,
      }}
    >
      {loading ? "Logger ud…" : locale === "dk" ? "Log ud" : "Log out"}
    </button>
  );
}
