"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./VoteButton.module.css";

type Props = {
  postId: string;
  initialScore?: number;
  initialMyVote?: number; // -1 | 0 | 1
};

type ApiOk = { ok: true; score: number; my_vote: number };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export function VoteButton({
  postId,
  initialScore = 0,
  initialMyVote = 0,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname?.split("/")[1] || "dk") as string;

  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<number>(initialMyVote);
  const [busy, setBusy] = useState(false);

  const label = useMemo(() => {
    if (myVote === 1) return "Upvoted";
    if (myVote === -1) return "Downvoted";
    return "Vote";
  }, [myVote]);

  function goLogin() {
    const returnTo = encodeURIComponent(pathname || `/${locale}/ask`);
    router.push(`/${locale}/login?returnTo=${returnTo}`);
  }

  // Optimistic: beregn ny score ift. nuværende vote -> next vote
  function computeNextScore(currentScore: number, currentVote: number, nextVote: number) {
    // nextVote: -1, 0, 1
    // currentVote: -1, 0, 1
    // ændring = next - current
    return currentScore + (nextVote - currentVote);
  }

  async function applyVote(next: number) {
    if (busy) return;
    setBusy(true);

    const prevScore = score;
    const prevVote = myVote;

    // toggle: klik samme igen => remove (0)
    const effectiveNext = myVote === next ? 0 : next;

    // ✅ optimistic update
    setMyVote(effectiveNext);
    setScore(computeNextScore(score, myVote, effectiveNext));

    try {
      let res: Response;

      if (effectiveNext === 0) {
        res = await fetch(
          `/api/posts/vote?post_id=${encodeURIComponent(postId)}`,
          { method: "DELETE" }
        );
      } else {
        res = await fetch("/api/posts/vote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ post_id: postId, value: effectiveNext }),
        });
      }

      if (res.status === 401) {
        // rollback
        setScore(prevScore);
        setMyVote(prevVote);
        goLogin();
        return;
      }

      const json = (await res.json()) as ApiResp;

      if (!res.ok || json.ok === false) {
        // rollback on any error
        setScore(prevScore);
        setMyVote(prevVote);
        return;
      }

      // server truth
      setScore(json.score);
      setMyVote(json.my_vote);
    } catch {
      setScore(prevScore);
      setMyVote(prevVote);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap} aria-label="Votes" data-busy={busy ? "1" : "0"}>
      <button
        className={`${styles.btn} ${myVote === 1 ? styles.on : ""}`}
        onClick={() => applyVote(1)}
        disabled={busy}
        type="button"
        aria-label="Upvote"
        title="Upvote"
      >
        ▲
      </button>

      <div className={styles.score} title={label} aria-label="Score">
        {score}
      </div>

      <button
        className={`${styles.btn} ${myVote === -1 ? styles.on : ""}`}
        onClick={() => applyVote(-1)}
        disabled={busy}
        type="button"
        aria-label="Downvote"
        title="Downvote"
      >
        ▼
      </button>
    </div>
  );
}