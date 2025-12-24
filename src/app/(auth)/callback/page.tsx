import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();

  // håndter både ?code= og evt. andre params uden at crashe
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Supabase SSR client + cookies = session bliver sat via auth cookies
  // Hvis du bruger PKCE flow, er code nok.
  if (code) {
    // @supabase/ssr + supabase-js v2: exchangeCodeForSession findes på auth
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=callback", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/dk/feed", url.origin));
}