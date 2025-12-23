import styles from "./SpeciesIndex.module.css";
import Link from "next/link";
import { SpeciesCard } from "@/components/Species/SpeciesCard";

const DEMO = [
  { slug: "ramsons", title: "Ramsløg", safety: "Watch look-alikes (lily of the valley).", season: "Apr–Jun" },
  { slug: "chanterelle", title: "Kantarel", safety: "Learn key traits + habitat.", season: "Jul–Oct" },
  { slug: "elderflower", title: "Hyldeblomst", safety: "Avoid confusing ornamental varieties.", season: "Jun–Jul" },
];

export default function SpeciesIndex({ params }: { params: { locale: string } }) {
  const l = params.locale;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Species</h1>
      <p className={styles.sub}>
        Canonical knowledge pages are the SEO backbone. Keep them sober, factual, and
        localizable.
      </p>

      <div className={styles.grid}>
        {DEMO.map((s) => (
          <Link key={s.slug} href={`/${l}/species/${s.slug}`} className={styles.link}>
            <SpeciesCard title={s.title} season={s.season} safety={s.safety} />
          </Link>
        ))}
      </div>
    </div>
  );
}
