import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeLocalPath(p: string | null) {
  if (!p) return null;
  // kun interne paths
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//")) return null;
  return p;
}

function inferLocaleFromPath(pathname: string) {
  const seg = (pathname.split("/")[1] || "").toLowerCase();
  return seg === "dk" || seg === "en" || seg === "se" || seg === "de" ? seg : "dk";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Supabase sender nogle gange ?error=...
  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  // hvor skal vi hen bagefter?
  // prioritet: returnTo -> next -> redirectTo
  const returnTo =
    safeLocalPath(url.searchParams.get("returnTo")) ||
    safeLocalPath(url.searchParams.get("next")) ||
    safeLocalPath(url.searchParams.get("redirectTo"));

  const locale = inferLocaleFromPath(returnTo ?? "/dk");

  if (errorDesc) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=callback_failed`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=missing_code`, url.origin));
  }

  const supabase = await supabaseServer();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=exchange_failed`, url.origin));
  }

  // ✅ hvis du kom fra en beskyttet side, så tilbage dertil
  if (returnTo) {
    return NextResponse.redirect(new URL(returnTo, url.origin));
  }

  // ✅ default efter login: Today
  return NextResponse.redirect(new URL(`/${locale}/today`, url.origin));
}