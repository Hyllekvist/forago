"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "dark" | "light";

function getStored(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem("forago_theme");
  return v === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = getStored();
    setTheme(t);
    document.documentElement.dataset.theme = t;
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("forago_theme", next);
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      type="button"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className={styles.icon} aria-hidden>
        {theme === "dark" ? "☾" : "☀︎"}
      </span>
    </button>
  );
}