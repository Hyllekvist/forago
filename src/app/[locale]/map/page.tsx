import { notFound } from "next/navigation";
import MapClient from "./MapClient";

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : "dk";
  return {
    title: locale === "dk" ? "Kort — Forago" : "Map — Forago",
    description:
      locale === "dk"
        ? "Find vilde råvarer i nærheden. Spots, biotoper og sæson."
        : "Find wild food near you. Spots, habitats and season.",
    alternates: { canonical: `/${locale}/map` },
  };
}

export default function MapPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return notFound();
  return <MapClient locale={params.locale} />;
}
