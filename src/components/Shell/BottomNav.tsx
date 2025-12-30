"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";
import type { User } from "@supabase/supabase-js";

type Props = {
  locale: string;
  user?: User | null;
};

type Item = {
  key: "feed" | "season" | "log" | "map" | "me";
  label: string;
  icon: "feed" | "season" | "log" | "map" | "me" | "login";
  href: string;
};

function Icon({ kind }: { kind: Item["icon"] }) {
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
          d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 12h10m0 0-3-3m3 3-3 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // feed fallback
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
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

// robust active check: exact match or nested routes
function isActivePath(pathname: string, href: string) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (p === h) return true;
  if (h !== "/" && p.startsWith(h + "/")) return true;
  return false;
}

export function BottomNav({ locale, user }: Props) {
  const pathname = usePathname();

  const items: Item[] = [
    { key: "feed", label: "Feed", icon: "feed", href: `/${locale}/feed` },
    { key: "season", label: "Season", icon: "season", href: `/${locale}/season` },
    { key: "log", label: "Log", icon: "log", href: `/${locale}/log` },
    { key: "map", label: locale === "dk" ? "Kort" : "Map", icon: "map", href: `/${locale}/map` },
    user
      ? { key: "me", label: "Me", icon: "me", href: `/${locale}/me` }
      : { key: "me", label: "Login", icon: "login", href: `/${locale}/login` },
  ];

  return (
    <nav
      className={styles.nav}
      aria-label="Bottom navigation"
      data-auth={user ? "in" : "out"}
    >
      <div className={styles.inner}>
        {items.map((it) => {
          const active = isActivePath(pathname, it.href);

          return (
            <Link
              key={it.key}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={[styles.item, active ? styles.itemActive : ""].join(" ")}
            >
              <span className={styles.iconWrap} aria-hidden="true">
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