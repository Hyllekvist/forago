"use client"; 

import { useMemo, useState, useTransition } from "react";
import styles from "./LogClient.module.css";

export type FindRow = {
  id: string;
  created_at: string;
  observed_at: string | null;
  notes: string | null;
  photo_urls: string[] | null;
  visibility: string | null;
  spot_id: string | null;
  species_id: string | null;
  species?: {
    id: string;
    slug: string;
    primary_group: string;
    scientific_name: string | null;
  } | null;
};

type Props = {
  locale: "dk" | "en" | "se" | "de";
  initialFinds: FindRow[];
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  // DB kan være "YYYY-MM-DD" eller ISO
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toISOString().slice(0, 10);
}

function titleFor(find: FindRow) {
  const slug = find.species?.slug;
  if (slug) return slug.replace(/-/g, " ");
  return "Ukendt art";
}

export function LogClient({ locale, initialFinds }: Props) {
  const [items, setItems] = useState<FindRow[]>(initialFinds);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = items.length;

  const emptyText =
    locale === "dk"
      ? "Ingen fund endnu. Gå til Map og tryk “Log fund”."
      : "No finds yet. Go to Map and tap “Log find”.";

  const refreshLabel = locale === "dk" ? "Opdatér" : "Refresh";

  const onRefresh = () => {
    startTransition(async () => {
      try {
        setErr(null);
        const res = await fetch("/api/finds/mine", { method: "GET" });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Refresh failed");
        setItems(json.finds as FindRow[]);
      } catch (e: any) {
        setErr(e?.message ?? "Ukendt fejl");
      }
    });
  };

  const groups = useMemo(() => {
    // simpel gruppering efter dato
    const m = new Map<string, FindRow[]>();
    for (const f of items) {
      const key = fmtDate(f.observed_at ?? f.created_at);
      const arr = m.get(key) ?? [];
      arr.push(f);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [items]);

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>{locale === "dk" ? "Total" : "Total"}</div>
          <div className={styles.kpiValue}>{total}</div>
        </div>

        <button className={styles.refresh} onClick={onRefresh} type="button" disabled={isPending}>
          {isPending ? (locale === "dk" ? "Henter…" : "Loading…") : refreshLabel}
        </button>
      </div>

      {err ? <div className={styles.error}>{err}</div> : null}

      {items.length === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : (
        <div className={styles.list}>
          {groups.map(([date, rows]) => (
            <div key={date} className={styles.day}>
              <div className={styles.dayHeader}>{date}</div>

              {rows.map((f) => (
                <article key={f.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.title}>{titleFor(f)}</div>
                    <div className={styles.meta}>
                      {f.species?.primary_group ? f.species.primary_group : "—"}
                    </div>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.label}>Spot</span>
                    <span className={styles.value}>{f.spot_id ?? "—"}</span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.label}>{locale === "dk" ? "Synlighed" : "Visibility"}</span>
                    <span className={styles.value}>{f.visibility ?? "private"}</span>
                  </div>

                  {f.notes ? (
                    <div className={styles.notes}>{f.notes}</div>
                  ) : null}

                  <div className={styles.photosRow}>
                    <span className={styles.photosLabel}>
                      {locale === "dk" ? "Billeder" : "Photos"}
                    </span>
                    <span className={styles.photosValue}>
                      {Array.isArray(f.photo_urls) ? f.photo_urls.length : 0}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}