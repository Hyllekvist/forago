import styles from "./Ask.module.css";
import { PostComposer } from "@/components/Posts/PostComposer";

export default function Ask() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>Ask</h1>
      <p className={styles.sub}>
        Be specific: season, habitat, traits, and clear photos. No exact spots.
      </p>
      <PostComposer />
    </div>
  );
}
