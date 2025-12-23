import styles from "./PostCard.module.css";

export function PostCard({
  title,
  type,
  votes,
  comments,
}: {
  title: string;
  type: string;
  votes: number;
  comments: number;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.type}>{type}</div>
        <div className={styles.meta}>
          <span>{votes} votes</span>
          <span>·</span>
          <span>{comments} replies</span>
        </div>
      </div>
      <div className={styles.title}>{title}</div>
    </div>
  );
}
