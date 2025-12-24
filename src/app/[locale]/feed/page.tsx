// src/app/[locale]/feed/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./FeedPage.module.css";
import { supabaseServer } from "@/lib/supabase/server";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function t(locale: Locale) {
  const dk = locale === "dk";
  return {
    title: dk ? "Feed" : "Feed",
    subtitle: dk ? "De seneste fund fra fællesskabet — og dine egne." : "Latest finds from the community — and yours.",
    newLog: dk ? "Log fund" : "Log find",
    emptyTitle: dk ? "Ingen fund endnu" : "No finds yet",
    emptyBody: dk ? "Vær den første til at logge et fund." : "Be the first to log a find.",
    mine: dk ? "Mit" : "Mine",
    public: dk ? "Offentlig" : "Public",
    private: dk ? "Privat" : "Private",
    unknown: dk ? "Ukendt art" : "Unknown species",
    justNow: dk ? "Lige nu" : "Just now",
    today: dk ? "I dag" : "Today",
  };
}

function formatWhen(iso: string, locale: Locale) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.abs(now.getTime() - d.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 2) return t(locale).justNow;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;

  // fallback date
  return d.toLocaleDateString(locale === "dk" ? "da-DK" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type LogRow = {
  id: string;
  created_at: string;
  user_id: string;
  locale: string;
  species_query: string | null;
  note: string | null;
  visibility: "public" | "private";
  photo_path: string | null;
};

export default async function FeedPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = safeLocale(params?.locale);
  const copy = t(locale);

  const supabase = await supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  // You can require login if you want:
  // if (!userId) redirect("/login");

  // Fetch logs: public + own private
  // (RLS should enforce this too, but we keep it clean here)
  let query = supabase
    .from("logs")
    .select(
      "id, created_at, user_id, locale, species_query, note, visibility, photo_path"
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (userId) {
    query = query.or(`visibility.eq.public,user_id.eq.${userId}`);
  } else {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;
  const rows: LogRow[] = (data ?? []) as any;

  // Precompute photo URLs
  const photoUrls = new Map<string, string>();
  for (const r of rows) {
    if (!r.photo_path) continue;
    const { data: pub } = supabase.storage
      .from("log-photos")
      .getPublicUrl(r.photo_path);
    if (pub?.publicUrl) photoUrls.set(r.id, pub.publicUrl);
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.h1}>{copy.title}</h1>
          <p className={styles.sub}>{copy.subtitle}</p>
        </div>

        <Link className={styles.cta} href={`/${locale}/log`}>
          <span className={styles.ctaDot} aria-hidden="true" />
          {copy.newLog}
        </Link>
      </header>

      {error ? (
        <div className={styles.alert} role="alert">
          <div className={styles.alertTitle}>Error</div>
          <div className={styles.alertBody}>{error.message}</div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon}>🪴</div>
          <div className={styles.emptyTitle}>{copy.emptyTitle}</div>
          <div className={styles.emptyBody}>{copy.emptyBody}</div>

          <Link className={styles.emptyCta} href={`/${locale}/log`}>
            {copy.newLog}
          </Link>
        </section>
      ) : (
        <section className={styles.grid} aria-label="Feed items">
          {rows.map((r) => {
            const isMine = !!userId && r.user_id === userId;
            const when = formatWhen(r.created_at, locale);
            const title = r.species_query?.trim() || copy.unknown;
            const photoUrl = photoUrls.get(r.id);

            return (
              <article key={r.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.metaRow}>
                    <span className={styles.when}>{when}</span>
                    <span className={styles.sep}>·</span>
                    <span
                      className={`${styles.badge} ${
                        r.visibility === "private" ? styles.badgePrivate : styles.badgePublic
                      }`}
                    >
                      {r.visibility === "private" ? copy.private : copy.public}
                    </span>
                    {isMine ? (
                      <>
                        <span className={styles.sep}>·</span>
                        <span className={styles.mine}>{copy.mine}</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className={styles.h2}>{title}</h2>
                  {r.note ? <p className={styles.note}>{r.note}</p> : null}
                </div>

                <div className={styles.media}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.img} src={photoUrl} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.mediaEmpty}>
                      <div className={styles.mediaIcon}>📷</div>
                      <div className={styles.mediaText}>
                        {locale === "dk" ? "Intet foto" : "No photo"}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <Link className={styles.open} href={`/${locale}/log/${r.id}`}>
                    {locale === "dk" ? "Åbn" : "Open"}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}