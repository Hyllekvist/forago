import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapClient, { type PlaceVM } from "./MapClient";
import styles from "./MapPage.module.css";

export const revalidate = 3600;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const title = locale === "dk" ? "Kort — Forago" : "Map — Forago";
  const description =
    locale === "dk"
      ? "Find vilde råvarer på kortet. Spots med sæson og arter."
      : "Find wild food spots on a map. Places with season and species.";
  return { title, description, alternates: { canonical: `/${locale}/map` } };
}

export default async function MapPage({ params }: { params: { locale: string } }) {
  const locParam = params.locale;
  if (!isLocale(locParam)) return notFound();
  const locale = locParam;

  const supabase = supabaseServer();

  // 1) Places
  const { data: places, error: pErr } = await supabase
    .from("places")
    .select("id, slug, name, habitat, lat, lng, description")
    .eq("country", "dk")
    .eq("region", "")
    .order("name", { ascending: true });

  if (pErr) throw pErr;

  const placeIds = (places ?? []).map((p) => p.id as string);

  // 2) Links: place -> species
  const { data: links, error: lErr } = await supabase
    .from("place_species")
    .select("place_id, species_id, confidence, note")
    .in("place_id", placeIds);

  if (lErr) throw lErr;

  const speciesIds = Array.from(
    new Set((links ?? []).map((x) => x.species_id as string))
  );

  // 3) Species + translations (for labels)
  const { data: sp, error: sErr } = await supabase
    .from("species")
    .select("id, slug")
    .in("id", speciesIds);

  if (sErr) throw sErr;

  const { data: tr, error: tErr } = await supabase
    .from("species_translations")
    .select("species_id, locale, common_name")
    .eq("locale", locale)
    .in("species_id", speciesIds);

  if (tErr) throw tErr;

  const slugById = new Map((sp ?? []).map((x: any) => [x.id as string, x.slug as string]));
  const nameById = new Map((tr ?? []).map((x: any) => [x.species_id as string, x.common_name as string]));

  // Build view-model: each place with top species
  const linksByPlace = new Map<string, any[]>();
  for (const l of links ?? []) {
    const pid = l.place_id as string;
    const arr = linksByPlace.get(pid) ?? [];
    arr.push(l);
    linksByPlace.set(pid, arr);
  }

  const vm: PlaceVM[] =
    (places ?? []).map((p: any) => {
      const arr = (linksByPlace.get(p.id as string) ?? [])
        .slice()
        .sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0))
        .slice(0, 5)
        .map((l: any) => {
          const sid = l.species_id as string;
          const slug = slugById.get(sid) || "";
          return {
            slug,
            name: nameById.get(sid) || slug || "unknown",
            confidence: Number(l.confidence ?? 0),
          };
        })
        .filter((x) => x.slug);

      return {
        id: p.id as string,
        slug: p.slug as string,
        name: рынка(p.name as string, locale),
        habitat: (p.habitat as string) || "",
        lat: Number(p.lat),
        lng: Number(p.lng),
        description: (p.description as string) || "",
        topSpecies: arr,
      };
    });

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{locale === "dk" ? "Kort" : "Map"}</h1>
        <p className={styles.sub}>
          {locale === "dk"
            ? "Tryk på et spot for detaljer og arter."
            : "Tap a spot for details and species."}
        </p>
      </header>

      <MapClient locale={locale} places={vm} />
    </main>
  );
}

// tiny helper so we don’t end up with undefined labels (optional)
function рынка(name: string, _locale: Locale) {
  return name || "Spot";
}