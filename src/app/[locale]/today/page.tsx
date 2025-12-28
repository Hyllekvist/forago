import styles from "./Today.module.css";
import { supabaseServer } from "@/lib/supabase/server";

type SeasonItem = {
  id: string;
  name: string;
  latin: string;
  group: "fungus" | "plant";
  confidence: "high" | "medium" | "low";
  reason: string;
};

export default async function TodayPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale;
  const supabase = await supabaseServer();

  // MOCK / placeholder – kobles senere på rigtig season-logic
  const seasonNow: SeasonItem[] = [
    {
      id: "1",
      name: "Tragtkantarel",
      latin: "Craterellus tubaeformis",
      group: "fungus",
      confidence: "high",
      reason: "Kulde + fugt = peak lige nu",
    },
    {
      id: "2",
      name: "Æblerose (hyben)",
      latin: "Rosa rugosa",
      group: "plant",
      confidence: "medium",
      reason: "Stadig fine efter frost",
    },
    {
      id: "3",
      name: "Ramsløg (blade)",
      latin: "Allium ursinum",
      group: "plant",
      confidence: "low",
      reason: "Kun tidlige tegn – kig efter blade",
    },
  ];

  return (
    <main className={styles.wrap}>
      {/* HEADER */}
      <header className={styles.header}>
        <h1 className={styles.h1}>I dag</h1>
        <p className={styles.sub}>
          Naturen omkring dig · Opdateret for din position
        </p>
      </header>

      {/* I SÆSON NU */}
      <section className={styles.section}>
        <h2 className={styles.h2}>I sæson nu</h2>

        <div className={styles.grid}>
          {seasonNow.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.group}>{item.group}</span>
                <span
                  className={`${styles.confidence} ${styles[item.confidence]}`}
                >
                  {item.confidence === "high"
                    ? "Høj"
                    : item.confidence === "medium"
                    ? "Mellem"
                    : "Lav"}
                </span>
              </div>

              <div className={styles.name}>{item.name}</div>
              <div className={styles.latin}>{item.latin}</div>

              <p className={styles.reason}>{item.reason}</p>

              <a
                href={`/${locale}/species/${item.id}`}
                className={styles.cta}
              >
                Se kendetegn →
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* TÆT PÅ DIG */}
      <section className={styles.section}>
        <div className={styles.nearby}>
          <div>
            <div className={styles.nearbyTitle}>Tæt på dig</div>
            <div className={styles.nearbySub}>
              7 relevante spots baseret på sæson & habitat
            </div>
          </div>

          <a href={`/${locale}/map`} className={styles.mapBtn}>
            Åbn kort →
          </a>
        </div>
      </section>

      {/* HANDLINGER */}
      <section className={styles.actions}>
        <a href={`/${locale}/log`} className={styles.actionPrimary}>
          Log fund
        </a>
        <a href={`/${locale}/find`} className={styles.action}>
          Find art
        </a>
        <a href={`/${locale}/map`} className={styles.action}>
          Se på kort
        </a>
      </section>
    </main>
  );
}