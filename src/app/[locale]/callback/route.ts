// src/app/[locale]/callback/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function safeLocalPath(p: string | null) {
  if (!p) return null;
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//")) return null;
  return p;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const returnTo =
    safeLocalPath(url.searchParams.get("returnTo")) ||
    safeLocalPath(url.searchParams.get("next")) ||
    safeLocalPath(url.searchParams.get("redirectTo")) ||
    null;

  const pathname = returnTo ?? "/dk/today";
  const locale = (pathname.split("/")[1] || "dk").toLowerCase();

  const supabase = await supabaseServer();

  // Supabase kan komme i 2 varianter:
  // A) PKCE: ?code=...
  // B) Magiclink: ?token_hash=...&type=magiclink (eller signup/recovery/invite)
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as
    | "magiclink"
    | "signup"
    | "recovery"
    | "invite"
    | null;

  const errorDesc = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (errorDesc) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=callback_failed`, url.origin));
  }

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (error) throw error;
    } else {
      return NextResponse.redirect(new URL(`/${locale}/login?e=missing_code`, url.origin));
    }
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/login?e=exchange_failed`, url.origin));
  }

  // ✅ evt. onboarding-check (hvis du vil)
  try {
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
  } catch {
    // ignorer – login er stadig ok
  }

  return NextResponse.redirect(new URL(returnTo ?? `/${locale}/today`, url.origin));
}