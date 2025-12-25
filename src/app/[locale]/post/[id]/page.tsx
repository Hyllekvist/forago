// src/app/[locale]/post/[id]/page.tsx
import styles from "./PostPage.module.css";
import { CommentList } from "@/components/Posts/CommentList";
import { VoteButton } from "@/components/Posts/VoteButton";

export default function PostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.row}>
          <div>
            <div className={styles.type}>Identification</div>
            <h1 className={styles.h1}>Demo post: {params.id}</h1>
            <p className={styles.sub}>
              Replace with Supabase <code>posts</code> + <code>comments</code>{" "}
              fetching.
            </p>
          </div>

          <VoteButton postId={params.id} initialScore={8} initialMyVote={0} />
        </div>

        <div className={styles.body}>
          Describe season, habitat, traits, and what you ruled out.
        </div>
      </div>

      <CommentList />
    </div>
  );
}