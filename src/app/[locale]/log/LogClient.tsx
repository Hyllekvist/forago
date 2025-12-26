"use client";

import styles from "./LogClient.module.css";

type FindRow = {
  id: string;
  created_at: string;
  observed_at: string;
  visibility: string;
  photo_urls: string[];
  spot_id: string;
  species: {
    id: string;
    slug: string;
    primary_group: string;
    scientific_name: string | null;
  };
};

function toLabel(v: string) {
  if (v === "public_aggregate") return "Offentlig (aggregat)";
  if (v === "friends") return "Venner";
  if (v === "private") return "Privat";
  return v;
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

      <section className={styles.list} aria-label="Finds">
        {initial.map((f) => (
          <article key={f.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.nameBlock}>
                <div className={styles.name}>{f.species.slug}</div>
                <div className={styles.sciname}>
                  {f.species.scientific_name ?? "—"}
                </div>
              </div>

              <span className={styles.badge}>
                {f.species.primary_group}
              </span>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Spot</span>
                <span className={styles.metaVal}>{f.spot_id}</span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Synlighed</span>
                <span className={styles.metaVal}>{toLabel(f.visibility)}</span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Billeder</span>
                <span className={styles.metaVal}>{f.photo_urls.length}</span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Dato</span>
                <span className={styles.metaVal}>{f.observed_at}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}