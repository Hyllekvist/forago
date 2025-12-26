import styles from "./LogPage.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { LogClient, type FindRow } from "./LogClient";

type Locale = "dk" | "en" | "se" | "de";
function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
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
            {locale === "dk"
              ? "Log ind for at se dine fund."
              : "Sign in to see your finds."}
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

  const initial = (finds ?? []) as FindRow[];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Mine fund" : "My finds"}</h1>
        <p className={styles.sub}>
          {error
            ? (locale === "dk"
                ? "Kunne ikke hente fund lige nu."
                : "Could not load finds right now.")
            : locale === "dk"
              ? "Dine seneste logs."
              : "Your latest logs."}
        </p>
      </header>

      <LogClient locale={locale} initialFinds={initial} />
    </main>
  );
}