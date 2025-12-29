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

function safeLocale(v: string | null) {
  const s = (v || "").toLowerCase();
  return s === "dk" || s === "en" || s === "se" || s === "de" ? s : "dk";
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const locale = safeLocale(url.pathname.split("/")[1] || "dk");

  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  const returnTo =
    safeLocalPath(url.searchParams.get("returnTo")) ||
    safeLocalPath(url.searchParams.get("next")) ||
    safeLocalPath(url.searchParams.get("redirectTo"));

  // Supabase kan komme med enten:
  // - code (PKCE)
  // - token_hash + type (magiclink)
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  if (errorDesc) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?e=callback_failed`, url.origin)
    );
  }

  try {
    const supabase = await supabaseServer();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (error) throw error;
    } else {
      return NextResponse.redirect(
        new URL(`/${locale}/login?e=missing_code`, url.origin)
      );
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
        const onboarding = `/${locale}/onboarding${
          returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
        }`;
        return NextResponse.redirect(new URL(onboarding, url.origin));
      }
    }

    if (returnTo) return NextResponse.redirect(new URL(returnTo, url.origin));
    return NextResponse.redirect(new URL(`/${locale}/today`, url.origin));
  } catch (e: any) {
    // Midlertidig debug så vi kan se hvad Supabase brokker sig over
    const msg =
      e?.message ||
      e?.error_description ||
      e?.details ||
      (typeof e === "string" ? e : null) ||
      "exchange_failed";

    return NextResponse.redirect(
      new URL(
        `/${locale}/login?e=exchange_failed&m=${encodeURIComponent(String(msg))}`,
        url.origin
      )
    );
  }
}