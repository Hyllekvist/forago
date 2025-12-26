"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  } | null; // 👈 vigtigt: kan være null
};

export default function LogClient({ initial }: { initial: FindRow[] }) {
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) || "dk";

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

      <section className={styles.list}>
        {initial.map((f) => {
          const slug = f.species?.slug ?? "ukendt";
          const group = f.species?.primary_group ?? "—";
          const sci = f.species?.scientific_name ?? null;

          const visLabel =
            f.visibility === "public_aggregate"
              ? "Offentlig (aggregat)"
              : f.visibility === "public"
                ? "Offentlig"
                : "Privat";

          return (
            <article key={f.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.nameBlock}>
                  <div className={styles.name}>{slug}</div>
                  {sci ? <div className={styles.sciname}>{sci}</div> : null}
                </div>

                <span className={styles.badge}>{visLabel}</span>
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
                  className={styles.primaryBtn}
                  href={`/${locale}/map?spot=${encodeURIComponent(f.spot_id)}`}
                >
                  Vis på kort
                </Link>

                <button className={styles.secondaryBtn} type="button" disabled>
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