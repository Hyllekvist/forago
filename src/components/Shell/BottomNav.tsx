// src/components/Nav/BottomNav.tsx  (eller hvor din ligger)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";
import type { User } from "@supabase/supabase-js";

const BASE_ITEMS = [
  { key: "feed", labelDK: "Feed", labelEN: "Feed", icon: "feed", href: (l: string) => `/${l}/feed` },
  { key: "season", labelDK: "Sæson", labelEN: "Season", icon: "season", href: (l: string) => `/${l}/season` },
  { key: "log", labelDK: "Log", labelEN: "Log", icon: "log", href: (l: string) => `/${l}/log` },
  { key: "map", labelDK: "Kort", labelEN: "Map", icon: "map", href: (l: string) => `/${l}/map` },
] as const;

function Icon({ kind }: { kind: string }) {
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
          strokeLinejoin="round"
        />
        <path
          d="M3 12h9m0 0-3-3m3 3-3 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // feed default
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
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav({
  locale,
  user,
}: {
  locale: string;
  user?: User | null;
}) {
  const pathname = usePathname();
  const loggedIn = !!user;

  const lastHref = loggedIn ? `/${locale}/me` : `/${locale}/login`;
  const lastLabel =
    locale === "dk"
      ? loggedIn
        ? "Me"
        : "Login"
      : loggedIn
      ? "Me"
      : "Login";
  const lastIcon = loggedIn ? "me" : "login";

  return (
    <nav
      className={`${styles.nav} ${loggedIn ? styles.loggedIn : styles.loggedOut}`}
      aria-label="Bottom navigation"
      data-auth={loggedIn ? "in" : "out"}
    >
      <div className={styles.inner}>
        {BASE_ITEMS.map((it) => {
          const href = it.href(locale);
          const active = isActivePath(pathname, href);
          const label = locale === "dk" ? it.labelDK : it.labelEN;

          return (
            <Link
              key={it.key}
              href={href}
              className={[
                styles.item,
                "hoverable",
                "pressable",
                active ? styles.itemActive : "",
              ].join(" ")}
            >
              <Icon kind={it.icon} />
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}

        {/* Dynamic auth slot */}
        <Link
          href={lastHref}
          className={[
            styles.item,
            "hoverable",
            "pressable",
            isActivePath(pathname, lastHref) ? styles.itemActive : "",
          ].join(" ")}
        >
          <Icon kind={lastIcon} />
          <span className={styles.label}>{lastLabel}</span>
        </Link>
      </div>
    </nav>
  );
}