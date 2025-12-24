"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const items = [
  { key: "feed", label: "Feed", icon: "feed" },
  { key: "season", label: "Season", icon: "season" },
  { key: "log", label: "Log", icon: "log" },
  { key: "map", label: "Map", icon: "map" },
  { key: "me", label: "Me", icon: "me" },
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

export function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Bottom navigation">
      <div className={styles.inner}>
        {items.map((it) => {
          const href = `/${locale}/${it.key}`;
          const active = pathname === href;

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
              <span className={styles.label}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}