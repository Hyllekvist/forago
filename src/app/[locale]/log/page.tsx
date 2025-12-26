import styles from "./LogPage.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { LogClient, type FindRow } from "./LogClient";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

type SpeciesRow = {
  id: string;
  slug: string;
  primary_group: string;
  scientific_name: string | null;
};

type FindRowRaw = Omit<FindRow, "species"> & {
  // supabase kan returnere relationer som array
  species?: SpeciesRow[] | SpeciesRow | null;
};

function normalizeFinds(rows: FindRowRaw[]): FindRow[] {
  return (rows ?? []).map((r) => {
    const spAny = (r as any).species;
    const species =
      Array.isArray(spAny) ? (spAny[0] ?? null) : spAny ?? null;

    return {
      id: r.id,
      created_at: r.created_at,
      observed_at: r.observed_at ?? null,
      notes: r.notes ?? null,
      photo_urls: r.photo_urls ?? null,
      visibility: r.visibility ?? null,
      spot_id: r.spot_id ?? null,
      species_id: r.species_id ?? null,
      species: species
        ? {
            id: species.id,
            slug: species.slug,
            primary_group: species.primary_group,
            scientific_name: species.scientific_name ?? null,
          }
        : null,
    };
  });
}

export default async function LogPage({ params }: { params: { locale: string } }) {
  const locale = safeLocale(params?.locale);
  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.h1}>{locale === "dk" ? "Mine fund" : "My finds"}</h1>
          <p className={styles.sub}>
            {locale === "dk" ? "Log ind for at se dine fund." : "Sign in to see your finds."}
          </p>
        </header>
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const initial = normalizeFinds(((finds ?? []) as unknown) as FindRowRaw[]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Mine fund" : "My finds"}</h1>
        <p className={styles.sub}>
          {error
            ? locale === "dk"
              ? "Kunne ikke hente fund lige nu."
              : "Could not load finds right now."
            : locale === "dk"
              ? "Dine seneste logs."
              : "Your latest logs."}
        </p>
      </header>

      <LogClient locale={locale} initialFinds={initial} />
    </main>
  );
}