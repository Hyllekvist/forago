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
          <>
            {/* Background layer (cover + blur) */}
            <Image
              src={imageUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 980px) 440px, 100vw"
              className={styles.bgImg}
            />

            {/* Foreground layer (contain = full subject) */}
            <Image
              src={imageUrl}
              alt={alt}
              fill
              priority
              sizes="(min-width: 980px) 440px, 100vw"
              className={styles.fgImg}
            />
          </>
        ) : (
          <div className={styles.fallback} aria-hidden="true" />
        )}

        <div className={styles.vignette} aria-hidden="true" />
        <div className={styles.grain} aria-hidden="true" />
      </div>
    </section>
  );
}
