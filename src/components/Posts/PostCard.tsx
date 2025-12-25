// src/components/Posts/PostCard.tsx
import Link from "next/link";
import styles from "./PostCard.module.css";
import { VoteButton } from "./VoteButton";

export type PostItem = {
  id: string;
  locale: string;
  type: string;
  title: string;
  body: string;
  created_at?: string | null;
  score?: number;
  my_vote?: number;
  comment_count?: number;
};

type Props = {
  post: PostItem;
  locale: string;
};

export function PostCard({ post, locale }: Props) {
  const {
    id,
    type,
    title,
    body,
    created_at,
    score = 0,
    my_vote = 0,
    comment_count = 0,
  } = post;

  return (
    <article className={styles.card}>
      <div className={styles.voteCol}>
        <VoteButton postId={id} initialScore={score} initialMyVote={my_vote} />
      </div>

      <Link className={styles.content} href={`/${locale}/post/${id}`}>
        <div className={styles.meta}>
          <span className={styles.pill}>{type}</span>
          <span className={styles.sep}>·</span>
          <time className={styles.time}>{created_at ?? ""}</time>

          <span className={styles.spacer} />

          <span className={styles.comments} aria-label="Comments">
            💬 {comment_count}
          </span>
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.excerpt}>{body}</p>
      </Link>
    </article>
  );
}
