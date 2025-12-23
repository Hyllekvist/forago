import styles from "./GuidePage.module.css";

export default function GuidePage({ params }: { params: { slug: string } }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>{params.slug.replace(/-/g, " ")}</h1>
      <div className={styles.card}>
        <p className={styles.p}>
          Starter guide page. Replace with content from `src/content/locales/*/guides.json`
          or Supabase for CMS-like editing.
        </p>
      </div>
    </div>
  );
}
