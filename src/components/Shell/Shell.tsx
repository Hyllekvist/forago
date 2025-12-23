// src/components/Shell/Shell.tsx 
"use client";

import { useEffect } from "react";
import styles from "./Shell.module.css";

type Locale = "dk" | "en" | "se" | "de";

export default function Shell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  // Sæt html lang + data-locale (kan bruges i CSS / analytics)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "dk" ? "da" : locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return (
    <div className={styles.shell}>
      {/* Vibrant but nature-friendly background layers */}
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.noise} aria-hidden="true" />

      {/* Content */}
      <div className={styles.stack}>{children}</div>
    </div>
  );
}