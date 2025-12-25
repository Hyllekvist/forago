"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";

export function TopNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          className={styles.brand}
          href={`/${locale}`}
          aria-label="Forago home"
        >
          <img
            src="/forago-mushroom.svg"
            alt=""
            aria-hidden="true"
            className={styles.logo}
          />
          <span className={styles.word}>Forago</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <Link
            className={`${styles.link} ${
              isActive(`/${locale}/guides`) ? styles.active : ""
            }`}
            href={`/${locale}/guides`}
          >
            <span className={styles.icon} aria-hidden="true">
              {/* book */}
              <svg viewBox="0 0 24 24">
                <path
                  d="M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 4v13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.label}>Guides</span>
          </Link>

          <Link
            className={`${styles.link} ${
              isActive(`/login`) ? styles.active : ""
            }`}
            href="/login"
          >
            <span className={styles.icon} aria-hidden="true">
              {/* user */}
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 9a7 7 0 0 0-14 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.label}>Login</span>
          </Link>

          <div className={styles.toggle}>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      <div className={styles.hairline} />
    </header>
  );
}