import styles from "./Feed.module.css";
import Link from "next/link";
import { PostCard } from "@/components/Posts/PostCard";

const DEMO = [
  { id: "p1", title: "Is this ramsons or lily-of-the-valley?", type: "Identification", votes: 12, comments: 7 },
  { id: "p2", title: "Best way to dry chanterelles without losing aroma?", type: "How-to", votes: 8, comments: 3 },
];

export default function Feed({ params }: { params: { locale: string } }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Community</h1>
          <p className={styles.sub}>Signal over hype. Ask precise questions. Cite traits.</p>
        </div>
        <Link className={styles.ask} href={`/${params.locale}/ask`}>Ask</Link>
      </div>

      <div className={styles.list}>
        {DEMO.map((p) => (
          <Link key={p.id} href={`/${params.locale}/post/${p.id}`} className={styles.link}>
            <PostCard {...p} />
          </Link>
        ))}
      </div>
    </div>
  );
}
