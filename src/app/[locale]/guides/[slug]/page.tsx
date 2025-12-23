import { notFound } from "next/navigation";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export default async function GuideSlugPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) return notFound();

  return (
    <main style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 10px" }}>Guide: {params.slug}</h1>
      <p style={{ opacity: 0.85 }}>
        Placeholder. Næste step er at gøre guides til rigtige sider (enten i DB eller som MDX).
      </p>
    </main>
  );
}