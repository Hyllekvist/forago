import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import styles from "./Me.module.css";

export const dynamic = "force-dynamic";

export default async function MePage({ params }: { params: { locale: string } }) {
  const locale = params.locale || "dk";
  const supabase = await supabaseServer();

  const { data } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Me</h1>
        <p className={styles.sub}>Account + app preferences.</p>
      </header>

      <section className={styles.card}>
        {user ? (
          <>
            <div className={styles.row}>
              <div className={styles.k}>Signed in as</div>
              <div className={styles.v}>{user.email ?? user.id}</div>
            </div>

            <div className={styles.actions}>
              <Link className={styles.pill} href={`/${locale}/me/settings`}>
                Settings
              </Link>
              <Link className={styles.pill} href={`/${locale}/ask`}>
                Ask
              </Link>
            </div>

            <p className={styles.note}>
              Logout kan vi lave som en lille client-knap bagefter.
            </p>
          </>
        ) : (
          <>
            <p className={styles.note}>
              Du er ikke logget ind. Login kræves for at poste og logge fund.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/login">
                Login
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}