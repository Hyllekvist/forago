import styles from "./CommentList.module.css";

const DEMO = [
  { id: "c1", author: "Sanker42", text: "Check leaf shape + smell. LOTV has no garlic smell." },
  { id: "c2", author: "FieldGuide", text: "Add habitat info and underside photo if possible." },
];

export function CommentList() {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Replies</h2>
      <div className={styles.list}>
        {DEMO.map((c) => (
          <div key={c.id} className={styles.card}>
            <div className={styles.author}>{c.author}</div>
            <div className={styles.text}>{c.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
