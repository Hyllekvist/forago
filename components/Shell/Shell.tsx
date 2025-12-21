import styles from "./Shell.module.css";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

export function Shell({ locale, children }: { locale: string; children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <TopNav locale={locale} />
      <main className={styles.main}>{children}</main>
      <BottomNav locale={locale} />
    </div>
  );
}
