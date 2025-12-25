"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./VoteButton.module.css";

type Props = {
  postId: string;
  initialScore?: number;
  initialMyVote?: number; // -1 | 0 | 1
};

type ApiOk = { ok: true; score: number; my_vote: number };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export function VoteButton({ postId, initialScore = 0, initialMyVote = 0 }: Props) {
  const router = useRouter();

  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<number>(initialMyVote);
  const [busy, setBusy] = useState(false);

  const label = useMemo(() => {
    if (myVote === 1) return "Upvoted";
    if (myVote === -1) return "Downvoted";
    return "Vote";
  }, [myVote]);

  async function setVote(next: number) {
    if (busy) return;
    setBusy(true);

    try {
      // toggle: klik samme igen => remove
      if (myVote === next) {
        const res = await fetch(`/api/posts/vote?post_id=${encodeURIComponent(postId)}`, {
          method: "DELETE",
        });

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        const json = (await res.json()) as ApiResp;
        if (!res.ok || !json.ok) return;

        setScore(json.score);
        setMyVote(0);
        return;
      }

      const res = await fetch("/api/posts/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ post_id: postId, value: next }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const json = (await res.json()) as ApiResp;
      if (!res.ok || !json.ok) return;

      setScore(json.score);
      setMyVote(json.my_vote);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap} aria-label="Votes">
      <button
        className={`${styles.btn} ${myVote === 1 ? styles.on : ""}`}
        onClick={() => setVote(1)}
        disabled={busy}
        type="button"
        aria-label="Upvote"
      >
        ▲
      </button>

      <div className={styles.score} title={label}>
        {score}
      </div>

      <button
        className={`${styles.btn} ${myVote === -1 ? styles.on : ""}`}
        onClick={() => setVote(-1)}
        disabled={busy}
        type="button"
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
