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
  const pathname = usePathname();

  const homeHref = `/${locale}`;
  const guidesHref = `/${locale}/guides`;
  const mapHref = `/${locale}/map`;
  const authHref = user ? `/${locale}/me` : `/${locale}/login`;

  const authLabel = user ? "Me" : locale === "dk" ? "Login" : "Login";

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

        {/* Desktop nav (skjules på mobil) */}
        <nav className={styles.nav} aria-label="Primary">
          <Link
            className={[styles.link, isActivePath(pathname, guidesHref) ? styles.active : ""].join(" ")}
            href={guidesHref}
          >
            Guides
          </Link>

          <Link
            className={[styles.link, isActivePath(pathname, mapHref) ? styles.active : ""].join(" ")}
            href={mapHref}
          >
            {locale === "dk" ? "Kort" : "Map"}
          </Link>

          <Link
            className={[styles.link, isActivePath(pathname, authHref) ? styles.active : ""].join(" ")}
            href={authHref}
          >
            {authLabel}
          </Link>
        </nav>

        <div className={styles.right}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}