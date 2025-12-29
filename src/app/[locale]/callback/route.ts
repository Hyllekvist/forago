import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeLocalPath(p: string | null) {
  if (!p) return null;
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

  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");

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

  // ✅ check profile exists (sankeprofil)
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user ?? null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.handle) {
      const onboarding = `/${locale}/onboarding${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
      return NextResponse.redirect(new URL(onboarding, url.origin));
    }
  }

  if (returnTo) return NextResponse.redirect(new URL(returnTo, url.origin));
  return NextResponse.redirect(new URL(`/${locale}/today`, url.origin));
}
