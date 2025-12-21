import styles from "./PostPage.module.css";
import { CommentList } from "@/components/Posts/CommentList";
import { VoteButton } from "@/components/Posts/VoteButton";

export default function PostPage({ params }: { params: { id: string } }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.row}>
          <div>
            <div className={styles.type}>Identification</div>
            <h1 className={styles.h1}>Demo post: {params.id}</h1>
            <p className={styles.sub}>
              Replace with Supabase `posts` + `post_comments` fetching.
            </p>
          </div>
          <VoteButton initial={8} />
        </div>
        <div className={styles.body}>
          Describe season, habitat, traits, and what you ruled out.
        </div>
      </div>

      <CommentList />
    </div>
  );
}
