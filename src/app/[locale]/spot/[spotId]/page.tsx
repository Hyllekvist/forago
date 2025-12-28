import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

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
  return new Date(t).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "2-digit" });
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

  // ✅ Spot “master” kommer fra VIEW spots_map
  const { data: spot, error: spotErr } = await supabase
    .from("spots_map")
    .select("id, lat, lng, title, species_slug, created_at")
    .eq("id", spotId)
    .maybeSingle();

  if (spotErr || !spot) return notFound();

  // ✅ Counts kommer fra din spot_counts(text) function
  const { data: countsData } = await supabase.rpc("spot_counts", { p_spot_id: spotId }).maybeSingle();

  const counts = countsData as
    | {
        total?: number;
        qtr?: number;
        last30?: number;
        first_seen?: string | null;
        last_seen?: string | null;
      }
    | null;

  // ✅ Seneste finds (public_aggregate) for den spot_id (text)
  const { data: finds } = await supabase
    .from("finds")
    .select(
      "id, observed_at, created_at, visibility, species:species_id(slug, primary_group, scientific_name)"
    )
    .eq("spot_id", spotId)
    .eq("visibility", "public_aggregate")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "18px 14px 120px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <Link href={`/${loc}/map`} style={{ opacity: 0.85, textDecoration: "none" }}>
          ← Tilbage til kort
        </Link>
      </div>

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
          <span>📍 {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}</span>
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
      </header>

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

        {(!finds || finds.length === 0) ? (
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Ingen offentlige fund endnu for dette spot.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {finds.map((f: any) => {
              const sp = f?.species;
              const slug = sp?.slug ?? null;
              const title = slug ? `#${slug}` : "Ukendt art";
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
                    <div style={{ fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Observeret: {fmtDate(f.observed_at)} · Logget: {fmtDate(f.created_at)}
                    </div>
                    {sp?.scientific_name ? (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{sp.scientific_name}</div>
                    ) : null}
                  </div>

                  {/* Hvis du vil: direkte link til find-siden */}
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