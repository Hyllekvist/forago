"use client";

import styles from "./LogClient.module.css";

export type SpeciesRow = {
  id: string;
  slug: string;
  primary_group: string;
  scientific_name: string | null;
};

export type FindRow = {
  id: string;
  created_at: string;
  observed_at: string;
  notes: string;
  visibility: string;
  photo_urls: string[];
  spot_id: string;
  species_id: string | null;

  // ✅ IMPORTANT: must be nullable (species_id can be null / deleted)
  species: SpeciesRow | null;
};

function prettyDate(s: string) {
  if (!s) return "—";
  return s;
}

function badgeLabel(v: string) {
  if (v === "public_aggregate") return "Offentlig";
  if (v === "friends") return "Venner";
  return "Privat";
}

export default function LogClient({ initial }: { initial: FindRow[] }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.h1}>Mine fund</h1>
            <p className={styles.sub}>Dine seneste logs.</p>
          </div>

          <div className={styles.totalCard}>
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalValue}>{initial.length}</div>
          </div>
        </div>
      </header>

      {initial.length === 0 ? (
        <section className={styles.empty}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyTitle}>Ingen fund endnu</div>
            <div className={styles.emptySub}>Gå til kortet og log dit første fund.</div>
          </div>
        </section>
      ) : (
        <section className={styles.list}>
          {initial.map((f) => {
            const name = f.species?.slug ?? "ukendt";
            const group = f.species?.primary_group ?? "—";
            const sci = f.species?.scientific_name ?? null;

            return (
              <article key={f.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.nameBlock}>
                    <div className={styles.name}>{name}</div>
                    {sci ? <div className={styles.sciname}>{sci}</div> : null}
                  </div>

                  <div className={styles.badge}>{badgeLabel(f.visibility)}</div>
                </div>

                <div className={styles.metaGrid}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Dato</span>
                    <span className={styles.metaVal}>{prettyDate(f.observed_at)}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Gruppe</span>
                    <span className={styles.metaVal}>{group}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Spot</span>
                    <span className={styles.metaVal}>{f.spot_id || "—"}</span>
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Billeder</span>
                    <span className={styles.metaVal}>{f.photo_urls.length}</span>
                  </div>

                  {f.notes ? (
                    <div className={styles.note}>
                      <span className={styles.noteKey}>Note</span>
                      <span className={styles.noteVal}>{f.notes}</span>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}