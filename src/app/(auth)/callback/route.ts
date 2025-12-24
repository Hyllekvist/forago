import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();

  const { data } = await supabase.auth.getUser();

  const base = new URL(req.url);

  if (data.user) {
    return NextResponse.redirect(new URL("/dk/feed", base));
  }

  return NextResponse.redirect(new URL("/login", base));
}