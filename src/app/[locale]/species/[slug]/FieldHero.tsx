// src/app/[locale]/species/[slug]/FieldHero.tsx
"use client";

import Image from "next/image";
import styles from "./FieldHero.module.css";

type Props = {
  imageUrl: string | null;
  alt?: string;
};

export default function FieldHero({ imageUrl, alt = "" }: Props) {
  return (
    <section className={styles.hero} aria-label={alt || "Foto"}>
      <div className={styles.media}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority
            sizes="(min-width: 980px) 1320px, 100vw"
            className={styles.img}
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true" />
        )}

        {/* polish */}
        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
      </div>
    </section>
  );
}