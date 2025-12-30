// src/components/Shell/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import styles from "./BottomNav.module.css";

type ItemKey = "feed" | "season" | "log" | "map" | "me";

const LABELS = {
  dk: { feed: "Feed", season: "Sæson", log: "Log", map: "Kort", me: "Me", login: "Login" },
  en: { feed: "Feed", season: "Season", log: "Log", map: "Map", me: "Me", login: "Login" },
} as const;

function Icon({ kind }: { kind: ItemKey }) {
  const common = {
    className: styles.icon,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (kind === "season")
    return (
      <svg {...common}>
        <path
          d="M12 3c3.9 0 7 3.1 7 7 0 4.4-3.6 9-7 11-3.4-2-7-6.6-7-11 0-3.9 3.1-7 7-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );

  if (kind === "log")
    return (
      <svg {...common}>
        <path
          d="M6 7h12M6 12h12M6 17h8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  if (kind === "map")
    return (
      <svg {...common}>
        <path
          d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (kind === "me")
    return (
      <svg {...common}>
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 9a7 7 0 0 0-14 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  // feed
  return (
    <svg {...common}>
      <path
        d="M5 7h14M5 12h14M5 17h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizePath(p?: string | null) {
  if (!p) return "";
  const noQuery = p.split("?")[0].split("#")[0];
  // drop trailing slash (except root "/")
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export function BottomNav({ locale, user }: { locale: string; user: User | null }) {
  const pathnameRaw = usePathname();
  const pathname = normalizePath(pathnameRaw);

  // ✅ rigtige routes (Feed = /{locale}, ikke /{locale}/feed)
  const hrefs = {
    feed: `/${locale}`,
    season: `/${locale}/season`,
    log: `/${locale}/log`,
    map: `/${locale}/map`,
    me: user ? `/${locale}/me` : `/${locale}/login`,
  } satisfies Record<ItemKey, string>;

  // ✅ label skifter ved login/logout
  const L = (locale === "dk" ? LABELS.dk : LABELS.en);
  const items: { key: ItemKey; label: string }[] = [
    { key: "feed", label: L.feed },
    { key: "season", label: L.season },
    { key: "log", label: L.log },
    { key: "map", label: L.map },
    { key: "me", label: user ? L.me : L.login },
  ];

  // ✅ find præcis én aktiv (mest specifik vinder)
  const activeKey: ItemKey | null = ((): ItemKey | null => {
    // check me/map/log/season før feed så “/dk/map/..” ikke ender som feed
    const order: ItemKey[] = ["me", "map", "log", "season", "feed"];
    for (const k of order) {
      const href = normalizePath(hrefs[k]);
      if (isActivePath(pathname, href)) return k;
    }
    return null;
  })();

  return (
    <nav
      className={styles.nav}
      data-auth={user ? "in" : "out"}
      aria-label="Bottom navigation"
    >
      <div className={styles.inner}>
        {items.map((it) => {
          const href = hrefs[it.key];
          const active = activeKey === it.key;

          return (
            <Link
              key={it.key}
              href={href}
              className={[styles.item, active ? styles.itemActive : ""].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.iconWrap} aria-hidden="true