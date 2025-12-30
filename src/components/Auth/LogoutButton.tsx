"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./LogoutButton.module.css";

type Locale = "dk" | "en" | "se" | "de";

export default function LogoutButton({ locale }: { locale: Locale }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();

      router.replace(`/${locale}/login?returnTo=/${locale}/today`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={styles.logoutBtn}
      aria-busy={loading}
    >
      {loading
        ? locale === "dk"
          ? "Logger ud…"
          : "Signing out…"
        : locale === "dk"
        ? "Log ud"
        : "Sign out"}
    </button>
  );
}
