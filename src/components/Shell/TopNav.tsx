// src/components/Shell/TopNav.tsx
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

function isActivePath(pathname: string | null, href: string) {
  const p = normalizePath(pathname ?? "");
  const h = normalizePath(href);
  if (p === h) return true;
  if (h !== "/" && p.startsWith(h + "/")) return true;
  return false;
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 9a7 7 0 0 0-14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLogin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 12H4m0 0 3-3M4 12l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname();

  const homeHref = `/${locale}`;
  const guidesHref = `/${locale}/guides`;
  const speciesHref = `/${locale}/species`;
  const seasonHref = `/${locale}/season`;
  const mapHref = `/${locale}/map`;

  const authHref = user ? `/${locale}/me` : `/${locale}/login`;
  const authLabel = user ? (locale === "dk" ? "Profil" : "Profile") : locale === "dk" ? "Login" : "Login";
  const AuthIcon = user ? IconUser : IconLogin;

  const dk = locale === "dk";

  const desktopItems = [
    { key: "season", label: dk ? "Sæson" : "Season", href: seasonHref },
    { key: "species", label: dk ? "Arter" : "Species", href: speciesHref },
    { key: "guides", label: dk ? "Guides" : "Guides", href: guidesHref },
    { key: "map", label: dk ? "Kort" : "Map", href: mapHref },
  ] as const;

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link className={styles.brand} href={homeHref} aria-label="Forago home">
          <span className={styles.logoWrap} aria-hidden="true">
            <Image src="/forago-mushroom.svg" alt="" width={18} height={18} className={styles.logo} priority />
          </span>
          <span className={styles.word}>Forago</span>
        </Link>

        {/* Desktop: segmented primary nav */}
        <nav className={styles.nav} aria-label="Primary">
          <div className={styles.segment}>
            {desktopItems.map((it) => {
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

        {/* Right actions: always visible */}
        <div className={styles.right} aria-label="Header actions">
          <Link className={styles.iconBtn} href={authHref} aria-label={authLabel} title={authLabel}>
            <span className={styles.iconWrap} aria-hidden="true">
              <AuthIcon className={styles.icon} />
            </span>
          </Link>

          <div className={styles.themeWrap}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile hint row (optional, super subtle) */}
      <div className={styles.mobileHint} aria-hidden="true">
        <span className={styles.hintText}>
          {dk ? "Navigation ligger i bunden" : "Navigation is at the bottom"}
        </span>
      </div>
    </header>
  );
}