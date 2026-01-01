// src/components/Shell/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import styles from "./BottomNav.module.css";

type Locale = string;

type Key = "season" | "species" | "scan" | "guides" | "map";

type NavItem = {
  key: Key;
  label: string;
  href: string;
  icon: Key;
};

function Icon({ kind }: { kind: Key }) {
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
        <path
          d="M12 6.5v12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );

  if (kind === "species")
    return (
      <svg {...common}>
        <path
          d="M10.5 12.2c-2.4-2.4-2.7-6.2-.7-8.2 2-2 5.8-1.7 8.2.7 2.2 2.2 2.6 5.7 1 7.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 13.2c-2.2 2.2-4.2 4.1-5.1 5.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14.8 14.8 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16.8 12.8a3.6 3.6 0 1 1-5.1-5.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.75"
          strokeLinecap="round"
        />
      </svg>
    );

  if (kind === "guides")
    return (
      <svg {...common}>
        <path
          d="M7 5.5h9.5A2.5 2.5 0 0 1 19 8v12.5H8.8A2.8 2.8 0 0 0 6 23V8A2.5 2.5 0 0 1 8.5 5.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 8.5H17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M8.5 11.5H16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
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
        <path
          d="M9 4v14M15 6v14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );

  // scan (default)
  return (
    <svg {...common}>
      <path
        d="M9 6h6l1.2 2H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.8L9 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 17a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href.endsWith("/")) href = href.slice(0, -1);
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({ locale, user }: { locale: Locale; user: User | null }) {
  const pathname = usePathname();

  const dk = locale === "dk";

  const items: NavItem[] = [
    { key: "season", label: dk ? "Sæson" : "Season", href: `/${locale}/season`, icon: "season" },
    { key: "species", label: dk ? "Arter" : "Species", href: `/${locale}/species`, icon: "species" },
    { key: "scan", label: dk ? "Scan" : "Scan", href: `/${locale}/scan`, icon: "scan" },
    { key: "guides", label: dk ? "Guides" : "Guides", href: `/${locale}/guides`, icon: "guides" },
    { key: "map", label: dk ? "Kort" : "Map", href: `/${locale}/map`, icon: "map" },
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
          const isScan = it.key === "scan";

          return (
            <Link
              key={it.key}
              href={it.href}
              className={[
                styles.item,
                active ? styles.itemActive : "",
                isScan ? styles.itemScan : "",
              ].join(" ")}
              data-key={it.key}
              data-active={active ? "true" : "false"}
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