// src/app/[locale]/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const errorDesc =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  const returnTo =
    safeLocalPath(url.searchParams.get("returnTo")) ||
    safeLocalPath(url.searchParams.get("next")) ||
    safeLocalPath(url.searchParams.get("redirectTo"));

  const locale = inferLocaleFromPath(returnTo ?? `/${inferLocaleFromPath(url.pathname)}`);

  if (errorDesc) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=callback_failed`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=missing_code`, url.origin));
  }

  // ✅ VIGTIGT: cookies skal sættes på DET response vi returnerer
  const redirectTarget = returnTo ?? `/${locale}/today`;
  const res = NextResponse.redirect(new URL(redirectTarget, url.origin));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/login?e=exchange_failed`, url.origin));
  }

  return res;
}
