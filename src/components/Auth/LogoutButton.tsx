"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styles from "./Me.module.css";

export default function LogoutButton({ locale }: { locale: "dk" | "en" | "se" | "de" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <button
      className={styles.dangerBtn}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const supabase = supabaseBrowser();
          await supabase.auth.signOut();
          router.replace(`/${locale}/login?returnTo=/${locale}/today`);
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (locale === "dk" ? "Logger ud…" : "Signing out…") : (locale === "dk" ? "Log ud" : "Sign out")}
    </button>
  );
}
