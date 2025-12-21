import { JsonLd } from "./JsonLd";

export function BreadcrumbsJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url.startsWith("http") ? it.url : `${base}${it.url}`,
        })),
      }}
    />
  );
}
