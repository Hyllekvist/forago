import styles from "./Season.module.css";
import { SeasonRings } from "@/components/Season/SeasonRings";
import { SeasonGrid } from "@/components/Season/SeasonGrid";

export const dynamic = "force-dynamic";

export default function SeasonNow() {
  // Later: fetch seasonality from Supabase based on locale.
  return (
    <div className={styles.wrap}>
      <h1 className={styles.h1}>In season now</h1>
      <p className={styles.sub}>
        This is a starter view. Next step: fill species + seasonality in Supabase and
        generate localized season pages.
      </p>

      <SeasonRings today={6} thisWeek={18} safePicks={7} />
      <SeasonGrid />
    </div>
  );
}
