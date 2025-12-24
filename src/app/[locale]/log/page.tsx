"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Log.module.css";

type PickMode = "camera" | "library";

export default function LogPage() {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pickMode, setPickMode] = useState<PickMode>("library");

  const nowLabel = useMemo(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `I dag · ${hh}:${mm}`;
  }, []);

  function openPicker(mode: PickMode) {
    setPickMode(mode);
    // tiny delay so attribute change applies before click
    requestAnimationFrame(() => inputRef.current?.click());
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    // cleanup old preview url
    if (photoUrl) URL.revokeObjectURL(photoUrl);

    const url = URL.createObjectURL(f);
    setPhotoFile(f);
    setPhotoUrl(url);
  }

  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <button
          type="button"
          className={styles.back}
          onClick={() => router.back()}
          aria-label="Tilbage"
        >
          ←
        </button>

        <div className={styles.titleWrap}>
          <h1 className={styles.h1}>Log fund</h1>
          <p className={styles.meta}>{nowLabel}</p>
        </div>
      </header>

      {/* hidden file input */}
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        // iOS: capture works best as attribute, so we toggle it
        capture={pickMode === "camera" ? "environment" : undefined}
        onChange={onPickFile}
      />

      {/* PHOTO CARD */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.h2}>Foto</h2>
            <p className={styles.sub}>
              Valgfrit — men hjælper andre med at lære.
            </p>
          </div>

          {photoUrl ? (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={removePhoto}
            >
              Fjern
            </button>
          ) : (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => openPicker("library")}
            >
              Tilføj
            </button>
          )}
        </div>

        <div className={styles.photoBox}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={photoFile?.name ? `Foto: ${photoFile.name}` : "Valgt foto"}
              className={styles.photo}
            />
          ) : (
            <div className={styles.photoEmpty}>
              <span className={styles.photoEmptyIcon} aria-hidden="true">
                ↯
              </span>
              <span>Ingen foto endnu</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.pillBtn}
            onClick={() => openPicker("camera")}
          >
            Tag et nyt
          </button>
          <button
            type="button"
            className={styles.pillBtn}
            onClick={() => openPicker("library")}
          >
            Vælg fra bibliotek
          </button>
        </div>
      </section>

      {/* NEXT CARD (placeholder) */}
      <section className={styles.card}>
        <h2 className={styles.h2}>Hvad fandt du?</h2>
        <p className={styles.sub}>Du kan logge uden at kende arten.</p>

        <input
          className={styles.input}
          placeholder="Søg art (valgfrit)"
          inputMode="search"
        />
      </section>

      {/* Sticky save (placeholder) */}
      <div className={styles.sticky}>
        <button type="button" className={styles.primaryBtn}>
          Gem fund
        </button>
      </div>
    </main>
  );
}