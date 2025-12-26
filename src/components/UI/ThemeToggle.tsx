"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("forago_theme") as Theme | null;
    const t = stored ?? "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("forago_theme", next);
  }

  return (
    <button
      className={styles.toggle}
      data-theme={theme}
      onClick={toggle}
      aria-label="Toggle theme"
    >
      <span className={styles.knob}>
        {theme === "dark" ? "☾" : "☀︎"}
      </span>
    </button>
  );
}