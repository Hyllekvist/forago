"use client";

import styles from "./TimeRangeChips.module.css";

export type RangeDays = 7 | 14 | 30;

export function TimeRangeChips({
  value,
  onChange,
}: {
  value: RangeDays;
  onChange: (v: RangeDays) => void;
}) {
  const items: RangeDays[] = [7, 14, 30];

  return (
    <div className={styles.row} role="tablist" aria-label="Tidsfilter">
      {items.map((d) => (
        <button
          key={d}
          className={styles.chip}
          data-active={value === d ? "1" : "0"}
          onClick={() => onChange(d)}
          role="tab"
          aria-selected={value === d}
        >
          {d}d
        </button>
      ))}
    </div>
  );
}