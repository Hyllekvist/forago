import Link from "next/link";
import styles from "./PostCard.module.css";
import { VoteButton } from "./VoteButton";

export type PostItem = {
  id: string;
  created_at?: string | null;
  locale?: string | null;
  type?: string | null;
  title?: string | null;
  body?: string | null;

  // meta (fra RPC)
  vote_score?: number | null;
  comment_count?: number | null;
  my_vote?: number | null;
};

function fmt(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} · ${hh}:${mm}`;
}

export function PostCard({ post, locale }: { post: PostItem; locale: string }) {
  const title = post.title ?? "Untitled";
  const excerpt = (post.body ?? "").slice(0, 160);

  return (
    <div className={styles.card}>
      <div className={styles.vote}>
        <VoteButton
          postId={post.id}
          initialScore={post.vote_score ?? 0}
          initialMyVote={post.my_vote ?? 0}
        />
      </div>

      <div className={styles.main}>
        <div className={styles.top}>
          <span className={styles.type}>{post.type ?? "Post"}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.when}>{fmt(post.created_at)}</span>
          <span className={styles.spacer} />
          <span className={styles.comments}>
            💬 {post.comment_count ?? 0}
          </span>
        </div>

        {/* senere kan vi linke til /[locale]/ask/[id] */}
        <Link className={styles.title} href={`/${locale}/ask`}>
          {title}
        </Link>

        {excerpt ? <p className={styles.body}>{excerpt}{(post.body?.length ?? 0) > 160 ? "…" : ""}</p> : null}
      </div>
    </div>
  );
}