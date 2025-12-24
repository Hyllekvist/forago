"use client";

import { useEffect } from "react";
import styles from "./Shell.module.css";

import { TopNav } from "@/components/Nav/TopNav";
import { BottomNav } from "@/components/Nav/BottomNav";

type Locale = "dk" | "en" | "se" | "de";

export default function Shell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  // ok at keep, men gerne flyt lang til server layout senere
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

      <TopNav locale={locale} />

      {/* Content */}
      <div className={styles.stack}>{children}</div>

      <BottomNav locale={locale} />
    </div>
  );
}