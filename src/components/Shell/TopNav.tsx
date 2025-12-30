"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/UI/ThemeToggle";
import type { User } from "@supabase/supabase-js";
import styles from "./TopNav.module.css";

type Props = {
  locale: string;
  user?: User | null;
};

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const authHref = user ? `/${locale}/me` : `/${locale}/login`;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href={`/${locale}`} className={styles.brand} aria-label="Forago home">
          <Image
            src="/forago-mushroom.svg"
            alt=""
            width={18}
            height={18}
            priority
          />
          <span className={styles.brandText}>Forago</span>
        </Link>

        {/* Desktop nav only */}
        <nav className={styles.nav} aria-label="Primary">
          <Link
            href={`/${locale}/guides`}
            className={`${styles.link} ${isActive(`/${locale}/guides`) ? styles.active : ""}`}
          >
            Guides
          </Link>

          <Link
            href={`/${locale}/map`}
            className={`${styles.link} ${isActive(`/${locale}/map`) ? styles.active : ""}`}
          >
            {locale === "dk" ? "Kort" : "Map"}
          </Link>

          <Link
            href={authHref}
            className={`${styles.link} ${isActive(authHref) ? styles.active : ""}`}
          >
            Me
          </Link>
        </nav>

        {/* Right */}
        <div className={styles.right}>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}