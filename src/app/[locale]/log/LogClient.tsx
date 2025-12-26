"use client"; 

import styles from "./LogClient.module.css";

export type FindRow = {
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

type Props = {
  initial: FindRow[];
};

export default function LogClient({ initial }: Props) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Mine fund</h1>
        <p>Dine seneste logs.</p>
        <div className={styles.total}>Total {initial.length}</div>
      </header>

      <section className={styles.list}>
        {initial.map((f) => (
          <article key={f.id} className={styles.card}>
            <div className={styles.titleRow}>
              <strong>{f.species.slug}</strong>
              <span className={styles.group}>{f.species.primary_group}</span>
            </div>

            <div className={styles.metaRow}>
              <span>Spot</span>
              <span>{f.spot_id}</span>
            </div>

            <div className={styles.metaRow}>
              <span>Synlighed</span>
              <span>{f.visibility}</span>
            </div>

            <div className={styles.metaRow}>
              <span>Billeder</span>
              <span>{f.photo_urls.length}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}