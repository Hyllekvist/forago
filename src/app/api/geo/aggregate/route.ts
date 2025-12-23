import { NextResponse } from "next/server";

// Placeholder: you can run nightly aggregation in Supabase Edge Function instead.
// This route is here for admin triggering during MVP.
export async function POST() {
  return NextResponse.json({ ok: true, note: "aggregation not implemented yet" });
}
