/* src/app/[locale]/species/[slug]/FieldHero.module.css */

.hero {
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
}

.media {
  position: relative;
  width: 100%;
  height: clamp(280px, 52vh, 560px); /* ✅ større på desktop */
  background: var(--card);
}

/* Mobile */
@media (max-width: 640px) {
  .media {
    height: clamp(220px, 38vh, 320px);
  }
}

.img {
  object-fit: cover;
  object-position: center 45%;
  transform: translateZ(0);
}

/* Skeleton fallback */
.fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--card) 85%, transparent),
    color-mix(in srgb, var(--ink) 6%, transparent),
    color-mix(in srgb, var(--card) 85%, transparent)
  );
  background-size: 200% 100%;
  animation: heroShimmer 1.2s ease-in-out infinite;
}

@keyframes heroShimmer {
  0% { background-position: 0% 0; }
  100% { background-position: -200% 0; }
}

.vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.38));
}

.grain {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}