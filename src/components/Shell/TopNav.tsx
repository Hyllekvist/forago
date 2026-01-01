"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";
import type { User } from "@supabase/supabase-js";

type Props = {
  locale: string;
  user?: User | null;
};

function normalizePath(p?: string | null) {
  if (!p) return "";
  const noQuery = p.split("?")[0].split("#")[0];
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

function isActivePath(pathname: string, href: string) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (p === h) return true;
  if (h !== "/" && p.startsWith(h + "/")) return true;
  return false;
}

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname() || "";
  const dk = locale === "dk";

  const homeHref = `/${locale}`;

  const seasonHref = `/${locale}/season`;
  const speciesHref = `/${locale}/species`;
  const guidesHref = `/${locale}/guides`;
  const mapHref = `/${locale}/map`;

  const authHref = user ? `/${locale}/me` : `/${locale}/login`;
  const authLabel = user ? "Me" : dk ? "Login" : "Login";

  const items = [
    { key: "season", label: dk ? "Sæson" : "Season", href: seasonHref },
    { key: "species", label: dk ? "Arter" : "Species", href: speciesHref },
    { key: "guides", label: "Guides", href: guidesHref },
    { key: "map", label: dk ? "Kort" : "Map", href: mapHref },
  ] as const;

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link className={styles.brand} href={homeHref} aria-label="Forago home">
          <span className={styles.logoWrap} aria-hidden="true">
            <Image
              src="/forago-mushroom.svg"
              alt=""
              width={18}
              height={18}
              className={styles.logo}
              priority
            />
          </span>
          <span className={styles.word}>Forago</span>
        </Link>

        {/* Desktop segmented nav */}
        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.segment}>
            {items.map((it) => {
              const active = isActivePath(pathname, it.href);
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className={[styles.segItem, active ? styles.segActive : ""].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right actions (desktop + mobile) */}
        <div className={styles.right}>
          {/* Mobile quick links */}
          <div className={styles.mobileQuick} aria-label="Quick links">
            <Link
              href={guidesHref}
              className={[
                styles.quickPill,
                isActivePath(pathname, guidesHref) ? styles.quickActive : "",
              ].join(" ")}
            >
              Guides
            </Link>
            <Link
              href={mapHref}
              className={[
                styles.quickPill,
                isActivePath(pathname, mapHref) ? styles.quickActive : "",
              ].join(" ")}
            >
              {dk ? "Kort" : "Map"}
            </Link>
          </div>

          <Link
            href={authHref}
            className={[styles.mePill, isActivePath(pathname, authHref) ? styles.meActive : ""].join(
              " "
            )}
            aria-label={authLabel}
          >
            {authLabel}
          </Link>

          <span className={styles.toggleWrap}>
            <ThemeToggle />
          </span>
        </div>
      </div>
    </header>
  );
}