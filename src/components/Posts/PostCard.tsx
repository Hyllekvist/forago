import styles from "./PostCard.module.css";

type PostRow = {
  id: string;
  created_at: string;
  locale: string;
  type: string;
  title: string;
  body: string;
  user_id: string | null;
};

function fmt(ts: string) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} · ${hh}:${mm}`;
}

export function PostCard({
  post,
  isMine,
  locale,
}: {
  post: PostRow;
  isMine: boolean;
  locale: string;
}) {
  const type = post.type || "Question";

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.badge}>{type}</span>
        {isMine ? <span className={styles.mine}>{locale === "dk" ? "Dig" : "You"}</span> : null}
        <span className={styles.sep}>·</span>
        <span className={styles.when}>{fmt(post.created_at)}</span>
      </div>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.body}>{post.body}</p>
    </article>
  );
}