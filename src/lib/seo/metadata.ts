import type { Metadata } from "next";

export function baseMetadata(args: {
  title: string;
  description: string;
  url: string;
  locale: string;
  hreflangs: { hrefLang: string; href: string }[];
}): Metadata {
  const { title, description, url, locale, hreflangs } = args;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(hreflangs.map((x) => [x.hrefLang, x.href])),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Forago",
      locale,
      type: "website",
      images: [{ url: "/og/og-default.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og/og-default.png"],
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  };
}
