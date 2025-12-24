import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // Læser auth-cookie efter magic link / OAuth
  const { data } = await supabase.auth.getUser();

  // Redirect uanset hvad – justér hvis du vil håndtere fejl anderledes
  if (data.user) {
    return NextResponse.redirect(new URL("/dk/feed", process.env.NEXT_PUBLIC_SITE_URL));
  }

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL));
}