"use client";

import { useState } from "react";
import styles from "./VoteButton.module.css";

export function VoteButton({ initial }: { initial: number }) {
  const [v, setV] = useState(initial);
  const [on, setOn] = useState(false);

  function toggle() {
    setOn(!on);
    setV((x) => x + (on ? -1 : 1));
  }

  return (
    <button className={on ? styles.on : styles.off} onClick={toggle} type="button">
      ▲ {v}
    </button>
  );
}
