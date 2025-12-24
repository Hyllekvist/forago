// src/app/(auth)/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dk/login?e=missing_code", url.origin));
  }

  const supabase = supabaseServer(); // <- IKKE await

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/dk/login?e=callback_failed", url.origin));
  }

  return NextResponse.redirect(new URL("/dk/feed", url.origin));
}