// src/components/Shell/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import styles from "./BottomNav.module.css";

type Locale = string;

type NavItem = {
  key: "feed" | "season" | "log" | "map" | "me";
  label: string;
  href: string;
  icon: "feed" | "season" | "log" | "map" | "me" | "login";
};

function Icon({ kind }: { kind: NavItem["icon"] }) {
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

  if (kind === "login")
    return (
      <svg {...common}>
        <path
          d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 12H4m0 0 3-3M4 12l3 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // feed (default)
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

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href.endsWith("/")) href = href.slice(0, -1);

  // root feed: match både /{locale} og /{locale}/
  if (href.split("/").filter(Boolean).length === 1) {
    const a = href;
    return pathname === a || pathname === `${a}/`;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({ locale, user }: { locale: Locale; user: User | null }) {
  const pathname = usePathname();

  const meHref = user ? `/${locale}/me` : `/${locale}/login`;
  const meLabel = user ? "Me" : "Login";
  const meIcon: NavItem["icon"] = user ? "me" : "login";

  const items: NavItem[] = [
    { key: "feed", label: "Feed", href: `/${locale}`, icon: "feed" },
    { key: "season", label: "Season", href: `/${locale}/season`, icon: "season" },
    { key: "log", label: "Log", href: `/${locale}/log`, icon: "log" },
    { key: "map", label: locale === "dk" ? "Kort" : "Map", href: `/${locale}/map`, icon: "map" },
    { key: "me", label: meLabel, href: meHref, icon: meIcon },
  ];

  return (
    <nav
      className={styles.nav}
      data-variant={user ? "authed" : "guest"}
      aria-label="Bottom navigation"
    >
      <div className={styles.inner}>
        {items.map((it) => {
          const active = isActivePath(pathname, it.href);

          return (
            <Link
              key={it.key}
              href={it.href}
              className={[styles.item, active ? styles.itemActive : ""].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.icoWrap} aria-hidden="true">
                <Icon kind={it.icon} />
              </span>
              <span className={styles.label}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}