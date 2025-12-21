// Supabase Edge Function placeholder
// Aggregate finds -> geo_cells counts, without exposing exact locations.
export const main = async () => {
  return new Response(JSON.stringify({ ok: true, note: "not implemented" }), {
    headers: { "content-type": "application/json" },
  });
};
