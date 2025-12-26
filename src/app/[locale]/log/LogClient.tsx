"use client";

import Link from "next/link";
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
  } | null;
};

function prettyVisibility(v?: string | null) {
  if (!v) return "—";
  if (v === "public_aggregate") return "Offentlig (aggregat)";
  if (v === "public") return "Offentlig";
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

          <div className={styles.totalCard} aria-label="Total logs">
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalValue}>{initial.length}</div>
          </div>
        </div>
      </header>

      <section className={styles.list} aria-label="Finds list">
        {initial.map((f) => {
          const slug = f.species?.slug ?? "unclassified";
          const group = f.species?.primary_group ?? "—";
          const sci = f.species?.scientific_name ?? null;

          return (
            <article key={f.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.nameBlock}>
                  <div className={styles.name}>{slug}</div>
                  {sci ? <div className={styles.sciname}>{sci}</div> : null}
                </div>

                <span className={styles.badge}>{prettyVisibility(f.visibility)}</span>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Dato</span>
                  <span className={styles.metaVal}>{f.observed_at || "—"}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Gruppe</span>
                  <span className={styles.metaVal}>{group}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Spot</span>
                  <span className={styles.metaVal}>{f.spot_id}</span>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Billeder</span>
                  <span className={styles.metaVal}>{f.photo_urls?.length ?? 0}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Link
                  className={styles.cta}
                  href={`/map?spot=${encodeURIComponent(f.spot_id)}`}
                >
                  Vis på kort
                </Link>

                <button
                  className={styles.secondary}
                  type="button"
                  onClick={() => alert("Tilføj foto (kommer)")}
                >
                  Tilføj foto
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}