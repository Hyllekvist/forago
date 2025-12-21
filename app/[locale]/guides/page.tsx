import Link from "next/link";
import styles from "./Guides.module.css";

const GUIDES = [
  { slug: "safety-basics", title: "Safety basics" },
  { slug: "privacy-first-geo", title: "Privacy-first geo" },
];

export default function Guides({ params }: { params: { locale: string } }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Guides</h1>
      <p className={styles.sub}>Evergreen knowledge pages for SEO + onboarding.</p>

      <div className={styles.list}>
        {GUIDES.map((g) => (
          <Link key={g.slug} className={styles.item} href={`/${params.locale}/guides/${g.slug}`}>
            {g.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
