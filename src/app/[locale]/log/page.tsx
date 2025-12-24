"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./Log.module.css";

type Locale = "dk" | "en" | "se" | "de";

type LogDraft = {
  id: string;
  createdAt: string;
  locale: string;
  photoDataUrl?: string; // base64
  speciesQuery?: string;
};

const LS_KEY = "forago_logs_v1";

function safeLocale(v: unknown): Locale {
  return v === "dk" || v === "en" || v === "se" || v === "de" ? v : "dk";
}

function readAll(): LogDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as LogDraft[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(next: LogDraft[]) {
  window.localStorage.setItem(LS_KEY, JSON.stringify(next));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
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

  // Photo state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Species query
  const [query, setQuery] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);

  // cleanup object URL
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
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const photoDataUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;

      const draft: LogDraft = {
        id,
        createdAt,
        locale,
        photoDataUrl,
        speciesQuery: query.trim() || undefined,
      };

      const all = readAll();
      writeAll([draft, ...all].slice(0, 200));

      removePhoto();
      setQuery("");

      router.push(`/${locale}/feed`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <main className={styles.page}>
        {/* Header row */}
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
            aria-label={locale === "dk" ? "Tilbage" : "Back"}
          >
            ←
          </button>

          <div className={styles.titleBlock}>
            <h1 className={styles.h1}>{locale === "dk" ? "Log fund" : "Log find"}</h1>
            <div className={styles.meta}>{fmtNow(locale)}</div>
          </div>
        </div>

        {/* Content */}
        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.cardTitle}>{locale === "dk" ? "Foto" : "Photo"}</div>
                <div className={styles.cardSub}>
                  {locale === "dk"
                    ? "Valgfrit — men hjælper andre med at lære."
                    : "Optional — helps others learn."}
                </div>
              </div>

              <div className={styles.cardActions}>
                {photoFile ? (
                  <button type="button" className={styles.ghostBtn} onClick={removePhoto}>
                    {locale === "dk" ? "Fjern" : "Remove"}
                  </button>
                ) : (
                  <button type="button" className={styles.ghostBtn} onClick={openPicker}>
                    {locale === "dk" ? "Tilføj" : "Add"}
                  </button>
                )}
              </div>
            </div>

            <div
              className={styles.photoBox}
              onClick={!photoFile ? openPicker : undefined}
              role={!photoFile ? "button" : undefined}
              tabIndex={!photoFile ? 0 : -1}
              onKeyDown={(e) => {
                if (!photoFile && (e.key === "Enter" || e.key === " ")) openPicker();
              }}
              aria-label={!photoFile ? (locale === "dk" ? "Tilføj foto" : "Add photo") : undefined}
            >
              {photoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.photo} src={photoPreviewUrl} alt="" />
              ) : (
                <div className={styles.photoEmpty}>
                  <div className={styles.photoEmptyIcon} aria-hidden="true">
                    +
                  </div>
                  <div>{locale === "dk" ? "Ingen foto endnu" : "No photo yet"}</div>
                </div>
              )}
            </div>

            <div className={styles.photoBtns}>
              <button type="button" className={styles.chipBtn} onClick={openPicker}>
                {locale === "dk" ? "Tag et nyt" : "Take new"}
              </button>
              <button type="button" className={styles.chipBtn} onClick={openPicker}>
                {locale === "dk" ? "Vælg fra bibliotek" : "Choose"}
              </button>

              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                onChange={onPickFile}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              {locale === "dk" ? "Hvad fandt du?" : "What did you find?"}
            </div>
            <div className={styles.cardSub}>
              {locale === "dk"
                ? "Du kan logge uden at kende arten."
                : "You can log without knowing the species."}
            </div>

            <div className={styles.field}>
              <input
                className={styles.input}
                placeholder={locale === "dk" ? "Søg art (valgfrit)" : "Search species (optional)"}
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA (den ENESTE Gem-knap) */}
      <div className={styles.sticky} aria-hidden="false">
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={saveLog}
          disabled={saving}
        >
          {saving
            ? locale === "dk"
              ? "Gemmer…"
              : "Saving…"
            : locale === "dk"
              ? "Gem fund"
              : "Save find"}
        </button>
      </div>
    </>
  );
}