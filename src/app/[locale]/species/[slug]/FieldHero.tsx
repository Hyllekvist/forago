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
            sizes="100vw"
            className={styles.img}
          />
        ) : (
          <div className={styles.fallback} />
        )}

        {/* subtle polish */}
        <div className={styles.vignette} aria-hidden />
        <div className={styles.grain} aria-hidden />
      </div>
    </section>
  );
}