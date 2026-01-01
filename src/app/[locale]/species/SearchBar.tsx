"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./SpeciesIndex.module.css";

export default function SearchBar({
  locale,
  initialQ,
  initialGroup,
}: {
  locale: string;
  initialQ: string;
  initialGroup: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [group, setGroup] = useState(initialGroup);

  // debounce push
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp?.toString() ?? "");

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (group.trim()) params.set("group", group.trim());
      else params.delete("group");

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 220);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, group]);

  return (
    <div className={styles.search}>
      <input
        className={styles.searchInput}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={locale === "dk" ? "Søg (fx rørhat…)" : "Search (e.g., chanterelle…)"}
        aria-label={locale === "dk" ? "Søg arter" : "Search species"}
      />

      <select
        className={styles.searchSelect}
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        aria-label={locale === "dk" ? "Vælg gruppe" : "Choose group"}
      >
        <option value="">{locale === "dk" ? "Alle grupper" : "All groups"}</option>
        <option value="fungus">{locale === "dk" ? "Svampe" : "Fungi"}</option>
        <option value="plant">{locale === "dk" ? "Planter" : "Plants"}</option>
        <option value="berry">{locale === "dk" ? "Bær" : "Berries"}</option>
        <option value="tree">{locale === "dk" ? "Træer" : "Trees"}</option>
      </select>
    </div>
  );
}