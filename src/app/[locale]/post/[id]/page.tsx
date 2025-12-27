// src/app/[locale]/post/[id]/page.tsx 
import styles from "./PostPage.module.css";
import { supabaseServer } from "@/lib/supabase/server";
import { CommentList } from "@/components/Posts/CommentList";
import { VoteButton } from "@/components/Posts/VoteButton";

type CommentItem = {
  id: string;
  body: string;
  created_at?: string | null;
  author: string;
};

export default async function PostPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const supabase = supabaseServer();
  const locale = params.locale;
  const postId = params.id;

  // 1) Fetch post
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, locale, type, title, body, created_at, user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postErr || !post) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.type}>Not found</div>
          <h1 className={styles.h1}>Post findes ikke</h1>
          <p className={styles.sub}>Tjek linket og prøv igen.</p>
        </div>
      </div>
    );
  }

  // 2) Fetch votes (score + my vote)
  const [{ data: votes }, { data: auth }] = await Promise.all([
    supabase.from("post_votes").select("user_id, vote").eq("post_id", postId),
    supabase.auth.getUser(),
  ]);

  const score =
    (votes ?? []).reduce((sum, v) => sum + (v?.vote ?? 0), 0) || 0;

  const myVote =
    (auth?.user?.id
      ? (votes ?? []).find((v) => v.user_id === auth.user.id)?.vote ?? 0
      : 0) || 0;

  // 3) Fetch comments (with profile)
  const { data: commentsRaw } = await supabase
    .from("post_comments")
    .select("id, body, created_at, profiles(handle, display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const comments: CommentItem[] =
    (commentsRaw ?? []).map((c: any) => {
      const p = c.profiles || {};
      const author =
        p.display_name || p.handle || "User";
      return {
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        author,
      };
    }) ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.row}>
          <div>
            <div className={styles.type}>{post.type}</div>
            <h1 className={styles.h1}>{post.title}</h1>
            <p className={styles.sub}>{post.created_at ?? ""}</p>
          </div>

          <VoteButton
            postId={postId}
            initialScore={score}
            initialMyVote={myVote}
          />
        </div>

        <div className={styles.body}>{post.body}</div>
      </div>

      <CommentList comments={comments} />
    </div>
  );
}
