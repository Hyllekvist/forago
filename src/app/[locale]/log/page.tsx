"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./Log.module.css";

type Locale = "dk" | "en" | "se" | "de";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function fmtNow(locale: Locale) {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dayLabel = locale === "dk" ? "I dag" : "Today";
  return `${dayLabel} · ${hh}:${mm}`;
}

export default function LogPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useMemo(() => safeLocale(params?.locale), [params]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function openPicker() {
    fileInputRef.current?.click();
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);

    setPhotoFile(f);
    setPhotoPreviewUrl(URL.createObjectURL(f));
  }

  function removePhoto() {
    if (photoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveLog() {
    setErr(null);
    setSaving(true);

    try {
      const fd = new FormData();
      fd.set("locale", locale);
      fd.set("speciesQuery", query.trim());
      fd.set("visibility", "public");
      if (photoFile) fd.set("photo", photoFile);

      const res = await fetch("/api/logs/create", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const json = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        throw new Error(json?.error || `Failed (${res.status})`);
      }

      removePhoto();
      setQuery("");
      router.push(`/${locale}/feed`);
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const t = {
    title: locale === "dk" ? "Log fund" : "Log find",
    photo: locale === "dk" ? "Foto" : "Photo",
    photoSub:
      locale === "dk"
        ? "Valgfrit — men hjælper andre med at lære."
        : "Optional — helps others learn.",
    pick: locale === "dk" ? "Vælg foto" : "Choose photo",
    remove: locale === "dk" ? "Fjern" : "Remove",
    speciesPlaceholder: locale === "dk" ? "Søg art (valgfrit)" : "Search species (optional)",
    save: locale === "dk" ? "Gem fund" : "Save",
    saving: locale === "dk" ? "Gemmer…" : "Saving…",
    emptyPhoto: locale === "dk" ? "Ingen foto endnu" : "No photo yet",
    back: locale === "dk" ? "Tilbage" : "Back",
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
          aria-label={t.back}
        >
          ←
        </button>

        <div className={styles.titleWrap}>
          <h1 className={styles.h1}>{t.title}</h1>
          <div className={styles.meta}>{fmtNow(locale)}</div>
        </div>
      </header>

      {err ? (
        <div className={styles.alert} role="alert">
          <div className={styles.alertTitle}>{locale === "dk" ? "Noget gik galt" : "Something went wrong"}</div>
          <div className={styles.alertBody}>{err}</div>
        </div>
      ) : null}

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.h2}>{t.photo}</h2>
            <div className={styles.sub}>{t.photoSub}</div>
          </div>

          <button
            type="button"
            className={styles.ghostBtn}
            onClick={photoFile ? removePhoto : openPicker}
          >
            {photoFile ? t.remove : t.pick}
          </button>
        </div>

        <div
          className={styles.photoBox}
          onClick={!photoFile ? openPicker : undefined}
          role={!photoFile ? "button" : undefined}
          aria-label={t.pick}
        >
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.photo} src={photoPreviewUrl} alt="" />
          ) : (
            <div className={styles.photoEmpty}>
              <div className={styles.photoEmptyIcon}>📷</div>
              <div className={styles.photoEmptyText}>{t.emptyPhoto}</div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.pillBtn} onClick={openPicker}>
            {t.pick}
          </button>

          <button
            type="button"
            className={styles.pillBtn}
            onClick={photoFile ? removePhoto : openPicker}
          >
            {photoFile ? t.remove : (locale === "dk" ? "Tilføj" : "Add")}
          </button>

          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept="image/*"
            onChange={onPickFile}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{locale === "dk" ? "Hvad fandt du?" : "What did you find?"}</label>
          <div className={styles.help}>
            {locale === "dk" ? "Du kan logge uden at kende arten." : "You can log without knowing the species."}
          </div>
          <input
            className={styles.input}
            placeholder={t.speciesPlaceholder}
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <div className={styles.sticky}>
        <button type="button" className={styles.primaryBtn} onClick={saveLog} disabled={saving}>
          {saving ? t.saving : t.save}
        </button>
      </div>
    </main>
  );
}