// src/app/[locale]/log/page.tsx
import styles from "./LogPage.module.css";
import { supabaseServer } from "@/lib/supabase/server";

type SpeciesRow = {
  id: string;
  slug: string;
  primary_group: string;
  scientific_name: string | null;
};

type FindRow = {
  id: string;
  created_at: string;
  observed_at: string | null;
  notes: string | null;
  photo_urls: string[];
  visibility: string;
  spot_id: string;
  species_id: string | null;
  species: SpeciesRow | null; // ✅ vi normaliserer til object
};

function normalizeFind(row: any): FindRow {
  const sp = Array.isArray(row?.species) ? row.species[0] ?? null : row?.species ?? null;

  return {
    id: String(row?.id ?? ""),
    created_at: String(row?.created_at ?? ""),
    observed_at: row?.observed_at ? String(row.observed_at) : null,
    notes: typeof row?.notes === "string" ? row.notes : null,
    photo_urls: Array.isArray(row?.photo_urls) ? row.photo_urls : [],
    visibility: String(row?.visibility ?? "private"),
    spot_id: String(row?.spot_id ?? ""),
    species_id: row?.species_id ? String(row.species_id) : null,
    species: sp
      ? {
          id: String(sp.id),
          slug: String(sp.slug),
          primary_group: String(sp.primary_group),
          scientific_name: sp.scientific_name ? String(sp.scientific_name) : null,
        }
      : null,
  };
}

export default async function LogPage() {
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (!userId) {
    return (
      <main className={styles.page}>
        <h1 className={styles.h1}>Mine fund</h1>
        <p className={styles.sub}>Du skal være logget ind.</p>
      </main>
    );
  }

  const { data: finds, error } = await supabase
    .from("finds")
    .select(
      `
      id,
      created_at,
      observed_at,
      notes,
      photo_urls,
      visibility,
      spot_id,
      species_id,
      species:species_id (
        id,
        slug,
        primary_group,
        scientific_name
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className={styles.page}>
        <h1 className={styles.h1}>Mine fund</h1>
        <p className={styles.sub}>{error.message}</p>
      </main>
    );
  }

  const initial: FindRow[] = (finds ?? []).map(normalizeFind);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Mine fund</h1>
        <p className={styles.sub}>Dine seneste logs.</p>
      </header>

      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Total</div>
          <div className={styles.kpiValue}>{initial.length}</div>
        </div>
      </div>

      <section className={styles.list}>
        {initial.map((f) => (
          <article key={f.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.title}>{f.species?.slug ?? "ukendt"}</div>
              <div className={styles.meta}>{f.species?.primary_group ?? ""}</div>
            </div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span>Spot</span>
                <span>{f.spot_id}</span>
              </div>
              <div className={styles.row}>
                <span>Synlighed</span>
                <span>{f.visibility}</span>
              </div>
              <div className={styles.row}>
                <span>Billeder</span>
                <span>{f.photo_urls?.length ?? 0}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}