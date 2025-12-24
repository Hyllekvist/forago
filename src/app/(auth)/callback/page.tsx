import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Hvis ingen code, så send til login
  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const supabase = await supabaseServer();

  // ✅ Sætter auth cookies på responsen via supabaseServer() cookie handlers
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login", url.origin));

  return NextResponse.redirect(new URL("/dk/feed", url.origin));
}