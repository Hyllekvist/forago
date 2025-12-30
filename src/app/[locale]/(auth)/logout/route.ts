// src/app/[locale]/(auth)/logout/route.ts
import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = supabaseRoute();
  await supabase.auth.signOut();

  // Return JSON (din client kan redirecte bagefter)
  return NextResponse.json({ ok: true });
}
