// src/components/Shell/Shell.tsx
"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import styles from "./Shell.module.css";

import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

type Locale = "dk" | "en" | "se" | "de";

export default function Shell({
  children,
  locale,
  user,
}: {
  children: React.ReactNode;
  locale: Locale;
  user: User | null;
}) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = locale === "dk" ? "da" : locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.auth = user ? "in" : "out";
  }, [user]);

  const hideBottomNav = useMemo(() => {
    // Skjul på map (og evt. underpaths)
    // matcher både /dk/map og /dk/map/...
    const base = `/${locale}/map`;
    return pathname === base || pathname?.startsWith(base + "/");
  }, [pathname, locale]);

  return (
    <div className={styles.shell} data-hide-bottomnav={hideBottomNav ? "1" : "0"}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <TopNav locale={locale} user={user} />

      <div className={styles.stack}>{children}</div>

      {hideBottomNav ? null : <BottomNav locale={locale} user={user} />}
    </div>
  );
}