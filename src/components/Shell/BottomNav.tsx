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
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (kind === "season")
    return (
      <svg {...common}>
        <path d="M12 3c4 0 7 3.1 7 7 0 4.7-3.8 9.6-7 11-3.2-1.4-7-6.3-7-11 0-3.9 3-7 7-7Z" />
        <path d="M12 8v6" opacity="0.75" />
        <path d="M9.5 11.5 12 14l2.5-2.5" opacity="0.75" />
      </svg>
    );

  if (kind === "species")
    return (
      <svg {...common}>
        <path d="M20 4c-6.5.2-12 3.8-14.5 9.2C4.4 15.7 4 18 4 20c2-.1 4.3-.4 6.8-1.5C16.2 16 19.8 10.5 20 4Z" />
        <path d="M8.5 15.5 20 4" opacity="0.75" />
      </svg>
    );

  if (kind === "guides")
    return (
      <svg {...common}>
        <path d="M7 5h9a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V7a2 2 0 0 1 2-2Z" />
        <path d="M7 5v14" opacity="0.75" />
        <path d="M10 9h6" opacity="0.7" />
        <path d="M10 12h5" opacity="0.6" />
      </svg>
    );

  if (kind === "map")
    return (
      <svg {...common}>
        <path d="M9 18 3 20V6l6-2 6 2 6-2v14l-6 2-6-2Z" />
        <path d="M9 4v14" opacity="0.75" />
        <path d="M15 6v14" opacity="0.75" />
      </svg>
    );

  // scan (default)
  return (
    <svg {...common}>
      <path d="M8 7h2l1.2-2h3.6L16 7h2a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" />
      <path d="M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
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
    { key: "scan", label: "Scan", href: `/${locale}/scan`, icon: "scan" },
    { key: "guides", label: "Guides", href: `/${locale}/guides`, icon: "guides" },
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