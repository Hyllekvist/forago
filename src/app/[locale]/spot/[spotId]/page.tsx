import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SpotLogCTA from "./SpotLogCTA";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPPORTED_LOCALES = ["dk", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function isLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString("da-DK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

type Counts = {
  total?: number;
  qtr?: number;
  last30?: number;
  first_seen?: string | null;
  last_seen?: string | null;
};

type FindRow = {
  id: string;
  observed_at?: string | null;
  created_at?: string | null;
  species?: { slug?: string | null; scientific_name?: string | null } | null;
};

type TopSpeciesRow = {
  slug: string;
  scientific_name?: string | null;
  count: number;
};

function computeTopSpeciesFromFinds(finds: FindRow[], limit = 8): TopSpeciesRow[] {
  const map = new Map<string, { count: number; scientific_name?: string | null }>();

  for (const f of finds) {
    const slug = (f?.species?.slug ?? "").trim();
    if (!slug) continue;
    const prev = map.get(slug);
    if (!prev) {
      map.set(slug, { count: 1, scientific_name: f?.species?.scientific_name ?? null });
    } else {
      prev.count += 1;
      if (!prev.scientific_name && f?.species?.scientific_name) {
        prev.scientific_name = f.species.scientific_name;
      }
    }
  }

  return Array.from(map.entries())
    .map(([slug, v]) => ({ slug, scientific_name: v.scientific_name ?? null, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default async function SpotPage({
  params,
}: {
  params: { locale: string; spotId: string };
}) {
  const loc = params?.locale;
  const spotId = params?.spotId;

  if (!loc || !isLocale(loc)) return notFound();
  if (!spotId) return notFound();

  const supabase = await supabaseServer();

  // 🔹 Spot master (VIEW)
  const { data: spot, error: spotErr } = await supabase
    .from("spots_map")
    .select("id, lat, lng, title, species_slug, created_at")
    .eq("id", spotId)
    .maybeSingle();

  if (spotErr || !spot) return notFound();

  // 🔹 Counts (RPC)
  const { data: countsData } = await supabase
    .rpc("spot_counts", { p_spot_id: spotId })
    .maybeSingle();

  const counts = (countsData as Counts | null) ?? null;

  // 🔹 Seneste public finds
  const { data: findsRaw } = await supabase
    .from("finds")
    .select("id, observed_at, created_at, species:species_id(slug, scientific_name)")
    .eq("spot_id", spotId)
    .eq("visibility", "public_aggregate")
    .order("created_at", { ascending: false })
    .limit(30);

  const finds: FindRow[] =
    (findsRaw as any[])?.map((r) => ({
      id: String(r.id),
      observed_at: r.observed_at ?? null,
      created_at: r.created_at ?? null,
      species: r.species
        ? { slug: r.species.slug ?? null, scientific_name: r.species.scientific_name ?? null }
        : null,
    })) ?? [];

  // 🔹 Top arter (MVP: beregnet fra de seneste 30 public finds)
  const topSpecies = computeTopSpeciesFromFinds(finds, 8);

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "18px 14px 120px" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href={`/${loc}/map`} style={{ opacity: 0.85, textDecoration: "none" }}>
          ← Tilbage til kort
        </Link>
      </div>

      {/* HEADER */}
      <header
        style={{
          border: "1px solid var(--glassLine)",
          background: "var(--glassBg)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "var(--shadow-1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 850, opacity: 0.75 }}>
          SPOT {spot.species_slug ? `· #${spot.species_slug}` : ""}
        </div>

        <h1 style={{ margin: "6px 0 8px", fontSize: 20, lineHeight: 1.15 }}>
          {spot.title ?? "Ukendt spot"}
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, opacity: 0.9 }}>
          <span>
            📍 {Number(spot.lat).toFixed(5)}, {Number(spot.lng).toFixed(5)}
          </span>
          <span>·</span>
          <span>Oprettet {fmtDate(spot.created_at)}</span>
          {counts?.last_seen ? (
            <>
              <span>·</span>
              <span>Senest set {fmtDate(counts.last_seen)}</span>
            </>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontSize: 13 }}>
          <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid var(--glassLine)" }}>
            {Number(counts?.total ?? 0)} fund total
          </span>
          <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid var(--glassLine)" }}>
            {Number(counts?.qtr ?? 0)} fund (90d)
          </span>
          <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid var(--glassLine)" }}>
            {Number(counts?.last30 ?? 0)} fund (30d)
          </span>
        </div>

        {/* LOG CTA — primary */}
        <div style={{ marginTop: 12 }}>
          <SpotLogCTA spotId={spotId} speciesSlug={spot.species_slug ?? null} />
        </div>
      </header>

      {/* TOP ARTER */}
      <section
        style={{
          border: "1px solid var(--glassLine)",
          background: "var(--glassBg)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "var(--shadow-1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Top arter her</div>

        {topSpecies.length === 0 ? (
          <div style={{ opacity: 0.8, fontSize: 13 }}>Ingen offentlige arter endnu for dette spot.</div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {topSpecies.map((row) => (
              <span
                key={row.slug}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--glassLine)",
                  fontSize: 13,
                  fontWeight: 850,
                  opacity: 0.95,
                }}
                title={row.scientific_name ?? ""}
              >
                #{row.slug} · {row.count}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* FINDS */}
      <section
        style={{
          border: "1px solid var(--glassLine)",
          background: "var(--glassBg)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "var(--shadow-1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Seneste fund</div>

        {!finds || finds.length === 0 ? (
          <div style={{ opacity: 0.8, fontSize: 13 }}>Ingen offentlige fund endnu for dette spot.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {finds.map((f) => {
              const slug = f?.species?.slug ?? null;
              const sci = f?.species?.scientific_name ?? null;

              return (
                <div
                  key={f.id}
                  style={{
                    border: "1px solid var(--glassLine)",
                    borderRadius: 14,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 850 }}>{slug ? `#${slug}` : "Ukendt art"}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Observeret: {fmtDate(f.observed_at)} · Logget: {fmtDate(f.created_at)}
                    </div>
                    {sci ? <div style={{ fontSize: 12, opacity: 0.7 }}>{sci}</div> : null}
                  </div>

                  <Link
                    href={`/${loc}/find/${encodeURIComponent(String(f.id))}`}
                    style={{
                      alignSelf: "center",
                      textDecoration: "none",
                      fontWeight: 850,
                      fontSize: 13,
                      opacity: 0.9,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Se find →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
