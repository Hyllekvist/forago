"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";
import type { User } from "@supabase/supabase-js";

type Item = {
  key: "feed" | "season" | "log" | "map" | "me";
  icon: "feed" | "season" | "log" | "map" | "me";
  href: (locale: string) => string;
  label: (locale: string) => string;
};

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

  // feed/default
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
  const authed = !!user;

  const items: Item[] = [
    {
      key: "feed",
      icon: "feed",
      href: (l) => `/${l}/feed`,
      label: (l) => (l === "dk" ? "Feed" : "Feed"),
    },
    {
      key: "season",
      icon: "season",
      href: (l) => `/${l}/season`,
      label: (l) => (l === "dk" ? "Sæson" : "Season"),
    },
    {
      key: "log",
      icon: "log",
      href: (l) => `/${l}/log`,
      label: (l) => (l === "dk" ? "Log" : "Log"),
    },
    {
      key: "map",
      icon: "map",
      href: (l) => `/${l}/map`,
      label: (l) => (l === "dk" ? "Kort" : "Map"),
    },
    {
      key: "me",
      icon: "me",
      href: (l) => (authed ? `/${l}/me` : `/${l}/login`),
      label: (l) => {
        if (!authed) return l === "dk" ? "Login" : "Login";
        return l === "dk" ? "Me" : "Me";
      },
    },
  ];

  return (
    <nav
      className={styles.nav}
      aria-label="Bottom navigation"
      data-auth={authed ? "in" : "out"}
    >
      <div className={styles.inner}>
        {items.map((it) => {
          const href = it.href(locale);
          const active = isActivePath(pathname, href);

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
              aria-current={active ? "page" : undefined}
            >
              <Icon kind={it.icon} />
              <span className={styles.label}>{it.label(locale)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}