// src/components/Shell/Shell.tsx
"use client";

import { useEffect } from "react";
import styles from "./Shell.module.css";

import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

type Locale = "dk" | "en" | "se" | "de";

export default function Shell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  useEffect(() => {
    document.documentElement.lang = locale === "dk" ? "da" : locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return (
    <div className={styles.shell}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      <TopNav locale={locale} />

      <div className={styles.stack}>{children}</div>

      <BottomNav locale={locale} />
    </div>
  );
}