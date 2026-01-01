"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./Guides.module.css";

type GuideCard = { slug: string; title: string; excerpt: string };

type SpeciesHit = {
  slug: string;
  scientific_name: string | null;
  primary_group: string | null;
};

function norm(s: string) {
  return (s || "").toLowerCase().trim();
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SearchClient({
  locale,
  guides,
}: {
  locale: string;
  guides: GuideCard[];
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialQ = sp.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const dq = useDebounced(q, 200);

  // keep input in sync if user navigates back/forward
  useEffect(() => {
    const urlQ = sp.get("q") || "";
    if (urlQ !== q) setQ(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // URL-sync (shareable)
  useEffect(() => {
    const next = new URLSearchParams(sp.toString());
    if (dq) next.set("q", dq);
    else next.delete("q");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const filteredGuides = useMemo(() => {
    const nq = norm(dq);
    if (!nq) return guides;
    return guides.filter((g) => {
      const hay = `${g.slug} ${g.title} ${g.excerpt}`.toLowerCase();
      return hay.includes(nq);
    });
  }, [dq, guides]);

  // Species suggestions (API)
  const [species, setSpecies] = useState<SpeciesHit[]>([]);
  const [loadingSpecies, setLoadingSpecies] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const nq = norm(dq);
    if (!nq || nq.length < 2) {
      setSpecies([]);
      setLoadingSpecies(false);
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoadingSpecies(true);
    fetch(`/api/search/suggest?q=${encodeURIComponent(nq)}&locale=${encodeURIComponent(locale)}`, {
      signal: ac.signal,
      headers: { "accept": "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        setSpecies((json?.species as SpeciesHit[]) ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingSpecies(false));

    return () => ac.abort();
  }, [dq, locale]);

  const quick = [
    { label: "Sikkerhed", q: "sikkerhed" },
    { label: "Forveksling", q: "forveksling" },
    { label: "Svampe", q: "svamp" },
    { label: "Tang", q: "tang" },
    { label: "Planter", q: "plante" },
    { label: "Sæson", q: "sæson" },
  ];

  return (
    <>
      {/* Hero search */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.searchRow}>
            <div className={styles.searchIcon} aria-hidden>⌕</div>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Søg guides og arter… fx “forveksling”, “kantarel”, “sukkertang”"
              inputMode="search"
              aria-label="Søg guides og arter"
            />
            {q ? (
              <button className={styles.clearBtn} onClick={() => setQ("")} aria-label="Ryd søgning">
                ✕
              </button>
            ) : null}
          </div>

          <div className={styles.quickRow}>
            {quick.map((x) => (
              <button
                key={x.q}
                className={styles.quickChip}
                onClick={() => setQ(x.q)}
              >
                {x.label}
              </button>
            ))}
            <Link className={styles.quickGhost} href={`/${locale}/species`}>
              Udforsk alle arter →
            </Link>
          </div>

          <div className={styles.heroMeta}>
            <span className={styles.heroMetaPill}>{filteredGuides.length} guides</span>
            <span className={styles.heroMetaSep} aria-hidden>•</span>
            <span className={styles.heroMetaText}>
              {dq ? `Søgning: “${dq}”` : "Tip: brug 2+ tegn for arts-forslag"}
            </span>
          </div>
        </div>
      </section>

      {/* Results grid */}
      <section className={styles.grid}>
        {/* Left: Guides */}
        <div className={styles.colMain}>
          {filteredGuides.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyTitle}>Ingen match</div>
              <div className={styles.emptyText}>
                Prøv et andet ord — eller hop over i <Link className={styles.inlineLink} href={`/${locale}/species`}>Arter</Link>.
              </div>
            </div>
          ) : (
            <div className={styles.cards}>
              {filteredGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/${locale}/guides/${encodeURIComponent(g.slug)}`}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardTitle}>{g.title}</div>
                    <div className={styles.badge}>Guide</div>
                  </div>
                  <div className={styles.cardExcerpt}>{g.excerpt}</div>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardSlug}>/{g.slug}</span>
                    <span className={styles.cardArrow} aria-hidden>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Species suggestions */}
        <aside className={styles.colAside} aria-label="Arter">
          <div className={styles.asideCard}>
            <div className={styles.asideTitle}>Arter</div>
            <div className={styles.asideSub}>
              Søgning viser forslag til arter. Klik for at åbne artssiden.
            </div>

            {loadingSpecies ? (
              <div className={styles.asideMuted}>Søger…</div>
            ) : species.length === 0 ? (
              <div className={styles.asideMuted}>
                {dq && dq.length >= 2
                  ? "Ingen arts-forslag på den søgning endnu."
                  : "Skriv 2+ tegn for arts-forslag."}
              </div>
            ) : (
              <div className={styles.speciesList}>
                {species.map((s) => (
                  <Link
                    key={s.slug}
                    className={styles.speciesItem}
                    href={`/${locale}/species/${encodeURIComponent(s.slug)}`}
                  >
                    <div className={styles.speciesTop}>
                      <div className={styles.speciesSlug}>{s.slug}</div>
                      <div className={styles.speciesBadge}>
                        {s.primary_group || "art"}
                      </div>
                    </div>
                    {s.scientific_name ? (
                      <div className={styles.speciesSci}>{s.scientific_name}</div>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}

            <div className={styles.asideActions}>
              <Link className={styles.asideBtn} href={`/${locale}/species`}>Alle arter</Link>
              <Link className={styles.asideBtnPrimary} href={`/${locale}/season`}>Se sæson</Link>
            </div>
          </div>
        </aside>

        {/* Mobile: species as collapsible */}
        <div className={styles.mobileAside}>
          <details className={styles.mobileBox}>
            <summary className={styles.mobileSummary}>
              <span>Arter</span>
              <span className={styles.mobileHint}>
                {loadingSpecies ? "Søger…" : `${species.length} forslag`}
              </span>
            </summary>

            <div className={styles.mobileBody}>
              {species.length === 0 ? (
                <div className={styles.asideMuted}>
                  {dq && dq.length >= 2
                    ? "Ingen arts-forslag på den søgning endnu."
                    : "Skriv 2+ tegn for arts-forslag."}
                </div>
              ) : (
                <div className={styles.speciesList}>
                  {species.map((s) => (
                    <Link
                      key={`${s.slug}-m`}
                      className={styles.speciesItem}
                      href={`/${locale}/species/${encodeURIComponent(s.slug)}`}
                    >
                      <div className={styles.speciesTop}>
                        <div className={styles.speciesSlug}>{s.slug}</div>
                        <div className={styles.speciesBadge}>
                          {s.primary_group || "art"}
                        </div>
                      </div>
                      {s.scientific_name ? (
                        <div className={styles.speciesSci}>{s.scientific_name}</div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}

              <div className={styles.asideActions}>
                <Link className={styles.asideBtn} href={`/${locale}/species`}>Alle arter</Link>
                <Link className={styles.asideBtnPrimary} href={`/${locale}/season`}>Se sæson</Link>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}