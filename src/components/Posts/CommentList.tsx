import styles from "./CommentList.module.css";

type CommentItem = {
  id: string;
  author: string;
  body: string;
  created_at?: string | null;
};

export function CommentList({ comments = [] }: { comments?: CommentItem[] }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Replies</h2>

      <div className={styles.list}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
            Ingen replies endnu. Vær den første.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.author}>{c.author}</div>
              <div className={styles.text}>{c.body}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
