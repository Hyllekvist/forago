// src/components/Shell/TopNav.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import styles from "./TopNav.module.css";
import { ThemeToggle } from "@/components/UI/ThemeToggle";

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

function Icon({
  kind,
  className,
}: {
  kind:
    | "guides"
    | "map"
    | "season"
    | "species"
    | "scan"
    | "search"
    | "user"
    | "login"
    | "chev";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  if (kind === "chev")
    return (
      <svg {...common}>
        <path
          d="M8.5 10.2 12 13.7l3.5-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (kind === "search")
    return (
      <svg {...common}>
        <path
          d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M16.5 16.5 21 21"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  if (kind === "user")
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

  if (kind === "season")
    return (
      <svg {...common}>
        <path
          d="M12 3c3.9 0 7 3.1 7 7 0 4.4-3.6 9-7 11-3.4-2-7-6.6-7-11 0-3.9 3.1-7 7-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 6.5v12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );

  if (kind === "species")
    return (
      <svg {...common}>
        <path
          d="M10.5 12.2c-2.4-2.4-2.7-6.2-.7-8.2 2-2 5.8-1.7 8.2.7 2.2 2.2 2.6 5.7 1 7.9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 13.2c-2.2 2.2-4.2 4.1-5.1 5.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M14.8 14.8 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M16.8 12.8a3.6 3.6 0 1 1-5.1-5.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.75"
          strokeLinecap="round"
        />
      </svg>
    );

  if (kind === "guides")
    return (
      <svg {...common}>
        <path
          d="M7 5.5h9.5A2.5 2.5 0 0 1 19 8v12.5H8.8A2.8 2.8 0 0 0 6 23V8A2.5 2.5 0 0 1 8.5 5.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 8.5H17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M8.5 11.5H16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
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
        <path
          d="M9 4v14M15 6v14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );

  // scan
  return (
    <svg {...common}>
      <path
        d="M9 6h6l1.2 2H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3.8L9 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 17a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getAvatarUrl(user?: User | null) {
  if (!user) return null;
  const m = user.user_metadata as any;
  return (
    m?.avatar_url ??
    m?.picture ??
    m?.photoURL ??
    m?.image ??
    null
  );
}

function getInitials(user?: User | null) {
  if (!user) return "F";
  const m = user.user_metadata as any;
  const name: string =
    (m?.full_name || m?.name || m?.username || user.email || "Forago").toString();
  const parts = name
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const dk = locale === "dk";

  const homeHref = `/${locale}`;
  const guidesHref = `/${locale}/guides`;
  const mapHref = `/${locale}/map`;
  const seasonHref = `/${locale}/season`;
  const speciesHref = `/${locale}/species`;
  const scanHref = `/${locale}/scan`;
  const meHref = `/${locale}/me`;
  const loginHref = `/${locale}/login`;
  const authHref = user ? meHref : loginHref;

  const authLabel = user ? (dk ? "Profil" : "Profile") : "Login";

  // scroll-aware header
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // desktop search -> species?q=
  const [q, setQ] = useState("");
  const searchLabel = dk ? "Søg arter" : "Search species";

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `${speciesHref}?q=${encodeURIComponent(term)}` : speciesHref);
  }

  // profile dropdown (desktop)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function logout() {
    try {
      await fetch(`/${locale}/logout`, { method: "POST" });
    } finally {
      setMenuOpen(false);
      router.push(homeHref);
      router.refresh();
    }
  }

  const avatarUrl = useMemo(() => getAvatarUrl(user), [user]);
  const initials = useMemo(() => getInitials(user), [user]);

  return (
    <header className={styles.header} data-scrolled={scrolled ? "true" : "false"} role="banner">
      <div className={styles.inner}>
        {/* Brand */}
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

        {/* Desktop primary nav */}
        <nav className={styles.nav} aria-label="Primary">
          <Link
            href={seasonHref}
            className={[styles.pill, isActivePath(pathname, seasonHref) ? styles.pillActive : ""].join(
              " "
            )}
          >
            <Icon kind="season" className={styles.pillIco} />
            <span>{dk ? "Sæson" : "Season"}</span>
          </Link>

          <Link
            href={speciesHref}
            className={[styles.pill, isActivePath(pathname, speciesHref) ? styles.pillActive : ""].join(
              " "
            )}
          >
            <Icon kind="species" className={styles.pillIco} />
            <span>{dk ? "Arter" : "Species"}</span>
          </Link>

          <Link
            href={guidesHref}
            className={[styles.pill, isActivePath(pathname, guidesHref) ? styles.pillActive : ""].join(
              " "
            )}
          >
            <Icon kind="guides" className={styles.pillIco} />
            <span>Guides</span>
          </Link>

          <Link
            href={mapHref}
            className={[styles.pill, isActivePath(pathname, mapHref) ? styles.pillActive : ""].join(" ")}
          >
            <Icon kind="map" className={styles.pillIco} />
            <span>{dk ? "Kort" : "Map"}</span>
          </Link>

          <Link
            href={scanHref}
            className={[styles.pill, isActivePath(pathname, scanHref) ? styles.pillActive : ""].join(" ")}
          >
            <Icon kind="scan" className={styles.pillIco} />
            <span>Scan</span>
          </Link>
        </nav>

        {/* Desktop search entry point */}
        <form className={styles.search} role="search" aria-label={searchLabel} onSubmit={submitSearch}>
          <span className={styles.searchIco} aria-hidden="true">
            <Icon kind="search" className={styles.searchSvg} />
          </span>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dk ? "Søg: ramsløg, kantarel…" : "Search: chanterelle, wild garlic…"}
            inputMode="search"
          />
          <button className={styles.searchBtn} type="submit">
            {dk ? "Søg" : "Go"}
          </button>
        </form>

        {/* Right actions */}
        <div className={styles.right}>
          <ThemeToggle />

          {/* Mobile quick auth icon (desktop uses dropdown) */}
          <Link className={styles.authIconMobile} href={authHref} aria-label={authLabel} title={authLabel}>
            <span className={styles.authIconWrap} aria-hidden="true">
              <Icon kind={user ? "user" : "login"} className={styles.authSvg} />
            </span>
          </Link>

          {/* Desktop profile dropdown */}
          <div className={styles.profile} ref={menuRef} data-open={menuOpen ? "true" : "false"}>
            <button
              type="button"
              className={styles.profileBtn}
              aria-label={authLabel}
              aria-haspopup="menu"
              aria-expanded={menuOpen ? "true" : "false"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className={styles.avatar} aria-hidden="true">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarFallback}>{initials}</span>
                )}
              </span>

              <span className={styles.profileText}>{user ? (dk ? "Profil" : "Profile") : "Login"}</span>

              <Icon kind="chev" className={styles.chev} />
            </button>

            <div className={styles.menu} role="menu" aria-label={dk ? "Profilmenu" : "Profile menu"}>
              {!user ? (
                <>
                  <Link className={styles.menuItem} href={loginHref} role="menuitem" onClick={() => setMenuOpen(false)}>
                    {dk ? "Log ind" : "Log in"}
                  </Link>
                  <div className={styles.menuHint}>
                    {dk ? "Log ind for at gemme fund og få en personlig log." : "Log in to save finds and keep your log."}
                  </div>
                </>
              ) : (
                <>
                  <Link className={styles.menuItem} href={meHref} role="menuitem" onClick={() => setMenuOpen(false)}>
                    {dk ? "Åbn profil" : "Open profile"}
                  </Link>
                  <Link
                    className={styles.menuItem}
                    href={`/${locale}/log`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    {dk ? "Min log" : "My log"}
                  </Link>
                  <button className={styles.menuItemDanger} type="button" role="menuitem" onClick={logout}>
                    {dk ? "Log ud" : "Log out"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}