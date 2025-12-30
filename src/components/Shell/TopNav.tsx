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

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const authHref = user ? `/${locale}/me` : `/${locale}/login`;
  const authLabel = user ? (locale === "dk" ? "Me" : "Me") : locale === "dk" ? "Log ind" : "Login";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={`/${locale}`} aria-label="Forago home">
          <Image
            src="/forago-mushroom.svg"
            alt="Forago"
            width={20}
            height={20}
            className={styles.brandIcon}
            priority
          />
          <span className={styles.word}>Forago</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            className={`${styles.link} ${isActive(`/${locale}/guides`) ? styles.active : ""}`}
            href={`/${locale}/guides`}
          >
            <span className={styles.icon} aria-hidden="true">📚</span>
            <span>Guides</span>
          </Link>

          <Link
            className={`${styles.link} ${isActive(`/${locale}/map`) ? styles.active : ""}`}
            href={`/${locale}/map`}
          >
            <span className={styles.icon} aria-hidden="true">🗺️</span>
            <span>{locale === "dk" ? "Kort" : "Map"}</span>
          </Link>

          <Link
            className={`${styles.link} ${isActive(authHref) ? styles.active : ""}`}
            href={authHref}
          >
            <span className={styles.icon} aria-hidden="true">{user ? "👤" : "🔑"}</span>
            <span>{authLabel}</span>
          </Link>

          <div className={styles.right}>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
