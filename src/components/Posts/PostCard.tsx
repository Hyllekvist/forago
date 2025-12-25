// src/components/Posts/PostCard.tsx
import Link from "next/link";
import styles from "./PostCard.module.css";
import { VoteButton } from "./VoteButton";

type Props = {
  locale: string;
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt?: string | null;
  score?: number;
  myVote?: number;
  commentCount?: number;
};

export function PostCard({
  locale,
  id,
  type,
  title,
  body,
  createdAt,
  score = 0,
  myVote = 0,
  commentCount = 0,
}: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.voteCol}>
        <VoteButton postId={id} initialScore={score} initialMyVote={myVote} />
      </div>

      <Link className={styles.content} href={`/${locale}/post/${id}`}>
        <div className={styles.meta}>
          <span className={styles.pill}>{type}</span>
          <span className={styles.sep}>·</span>
          <time className={styles.time}>{createdAt ?? ""}</time>

          <span className={styles.spacer} />

          <span className={styles.comments} aria-label="Comments">
            💬 {commentCount}
          </span>
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.excerpt}>{body}</p>
      </Link>
    </article>
  );
}