"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

function initialsFromUser(user: User | null | undefined) {
  const email = user?.email || "";
  const base = email.split("@")[0] || "me";
  const parts = base.split(/[._-]+/).filter(Boolean);
  const a = (parts[0]?.[0] || base[0] || "M").toUpperCase();
  const b = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (a + b).slice(0, 2);
}

export function TopNav({ locale, user }: Props) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;
  const dk = locale === "dk";

  const homeHref = `/${locale}`;
  const seasonHref = `/${locale}/season`;
  const speciesHref = `/${locale}/species`;
  const guidesHref = `/${locale}/guides`;
  const mapHref = `/${locale}/map`;

  const profileHref = `/${locale}/me`;
  const loginHref = `/${locale}/login`;

  const authed = !!user;
  const authHref = authed ? profileHref : loginHref;

  // scroll-aware header
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // dropdown (desktop)
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // search entry (desktop) -> routes to species/guides with ?q=
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"species" | "guides">("species");

  const searchActionHref = useMemo(() => {
    const base = scope === "guides" ? guidesHref : speciesHref;
    const s = q.trim();
    return s ? `${base}?q=${encodeURIComponent(s)}` : base;
  }, [q, scope, guidesHref, speciesHref]);

  async function onLogout() {
    try {
      // route: src/app/[locale]/(auth)/logout/route.ts -> /{locale}/logout
      await fetch(`/${locale}/logout`, { method: "POST" });
    } catch {}
    setOpen(false);
    router.replace(homeHref);
    router.refresh();
  }

  const avatar = initialsFromUser(user);

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

        {/* Desktop search */}
        <div className={styles.search} aria-label="Search">
          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(searchActionHref);
            }}
          >
            <div className={styles.searchScope} aria-hidden="true">
              <button
                type="button"
                className={[styles.scopeBtn, scope === "species" ? styles.scopeActive : ""].join(" ")}
                onClick={() => setScope("species")}
              >
                {dk ? "Arter" : "Species"}
              </button>
              <button
                type="button"
                className={[styles.scopeBtn, scope === "guides" ? styles.scopeActive : ""].join(" ")}
                onClick={() => setScope("guides")}
              >
                {dk ? "Guides" : "Guides"}
              </button>
            </div>

            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={dk ? "Søg arter eller guides…" : "Search species or guides…"}
              inputMode="search"
              aria-label={dk ? "Søg" : "Search"}
            />

            <button className={styles.searchGo} type="submit" aria-label={dk ? "Søg" : "Search"}>
              <span className={styles.searchGoIcon} aria-hidden="true">
                ⌕
              </span>
            </button>
          </form>
        </div>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Primary">
          <Link
            className={[styles.link, isActivePath(pathname, seasonHref) ? styles.active : ""].join(" ")}
            href={seasonHref}
          >
            {dk ? "Sæson" : "Season"}
          </Link>
          <Link
            className={[styles.link, isActivePath(pathname, speciesHref) ? styles.active : ""].join(" ")}
            href={speciesHref}
          >
            {dk ? "Arter" : "Species"}
          </Link>
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
            {dk ? "Kort" : "Map"}
          </Link>
        </nav>

        {/* Right actions */}
        <div className={styles.right}>
          <ThemeToggle />

          {/* Profile / Login */}
          <div className={styles.profileWrap} ref={menuRef}>
            {authed ? (
              <>
                <button
                  type="button"
                  className={styles.avatarBtn}
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open ? "true" : "false"}
                  aria-label={dk ? "Åbn profilmenu" : "Open profile menu"}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {avatar}
                  </span>
                </button>

                <div className={styles.menu} data-open={open ? "true" : "false"} role="menu">
                  <Link className={styles.menuItem} href={profileHref} role="menuitem" onClick={() => setOpen(false)}>
                    {dk ? "Profil" : "Profile"}
                  </Link>

                  <Link
                    className={styles.menuItem}
                    href={`${profileHref}?tab=settings`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    {dk ? "Indstillinger" : "Settings"}
                  </Link>

                  <div className={styles.menuRule} />

                  <button className={styles.menuDanger} type="button" role="menuitem" onClick={onLogout}>
                    {dk ? "Log ud" : "Log out"}
                  </button>
                </div>
              </>
            ) : (
              <Link
                className={[styles.loginBtn, isActivePath(pathname, authHref) ? styles.loginActive : ""].join(" ")}
                href={authHref}
              >
                {dk ? "Login" : "Login"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}