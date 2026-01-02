"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

export function TopNav({ locale, user }: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [scope, setScope] = useState<"species" | "guides">("species");
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // optional: prefill from URL
  useEffect(() => {
    const query = sp?.get("q") || "";
    if (query && !q) setQ(query);
    const s = sp?.get("scope");
    if (s === "guides" || s === "species") setScope(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const hrefHome = `/${locale}`;
  const hrefSeason = `/${locale}/season`;
  const hrefMap = `/${locale}/map`;
  const hrefAuth = user ? `/${locale}/me` : `/${locale}/login`;

  const authLabel = user ? (locale === "dk" ? "Profil" : "Profile") : "Login";

  const searchPlaceholder = locale === "dk" ? "Søg arter eller guides…" : "Search species or guides…";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    // send til en dedikeret search side hvis du har den
    // ellers kan du route til species/guides index med query
    const target =
      scope === "species" ? `/${locale}/species` : `/${locale}/guides`;

    const url = `${target}?q=${encodeURIComponent(query)}`;
    router.push(url);
  };

  const activePath = useMemo(() => normalizePath(pathname), [pathname]);

  const seasonActive = activePath.startsWith(`/${locale}/season`);
  const mapActive = activePath.startsWith(`/${locale}/map`);
  const authActive = activePath.startsWith(`/${locale}/me`) || activePath.startsWith(`/${locale}/login`);

  return (
    <header className={styles.header} data-scrolled={scrolled ? "true" : "false"} role="banner">
      <div className={styles.inner}>
        <Link className={styles.brand} href={hrefHome} aria-label="Forago home">
          <span className={styles.logoWrap} aria-hidden="true">
            <Image src="/forago-mushroom.svg" alt="" width={18} height={18} className={styles.logo} priority />
          </span>
          <span className={styles.word}>Forago</span>
        </Link>

        {/* Desktop: search i midten */}
        <div className={styles.search} aria-label="Search">
          <form className={styles.searchForm} onSubmit={onSubmit}>
            <div className={styles.scope}>
              <button
                type="button"
                className={[styles.scopeBtn, scope === "species" ? styles.scopeActive : ""].join(" ")}
                onClick={() => setScope("species")}
                aria-pressed={scope === "species"}
              >
                {locale === "dk" ? "Arter" : "Species"}
              </button>
              <button
                type="button"
                className={[styles.scopeBtn, scope === "guides" ? styles.scopeActive : ""].join(" ")}
                onClick={() => setScope("guides")}
                aria-pressed={scope === "guides"}
              >
                Guides
              </button>
            </div>

            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              inputMode="search"
            />

            <button className={styles.searchGo} type="submit" aria-label="Search">
              <span className={styles.searchGoIcon} aria-hidden>
                ⌕
              </span>
            </button>
          </form>
        </div>

        {/* Højre: få, tydelige actions */}
        <div className={styles.right}>
          <nav className={styles.actions} aria-label="Header actions">
            <Link className={[styles.actionLink, seasonActive ? styles.actionActive : ""].join(" ")} href={hrefSeason}>
              {locale === "dk" ? "Sæson" : "Season"}
            </Link>
            <Link className={[styles.actionLink, mapActive ? styles.actionActive : ""].join(" ")} href={hrefMap}>
              {locale === "dk" ? "Kort" : "Map"}
            </Link>
          </nav>

          <ThemeToggle />

          <Link className={[styles.authBtn, authActive ? styles.authActive : ""].join(" ")} href={hrefAuth}>
            {authLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
