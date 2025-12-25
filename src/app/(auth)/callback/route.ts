import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Supabase sender nogle gange ?error=...
  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorDesc) {
    return NextResponse.redirect(new URL("/login?e=callback_failed", url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?e=missing_code", url.origin));
  }

  const supabase = await supabaseServer();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?e=exchange_failed", url.origin));
  }

  // vælg hvor du vil lande efter login
  return NextResponse.redirect(new URL("/dk/feed", url.origin));
}