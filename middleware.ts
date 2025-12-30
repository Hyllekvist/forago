import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/; 

function isPublicPath(pathname: string, locale: string) {
  // public pages
  return (
    pathname === `/${locale}` ||
    pathname.startsWith(`/${locale}/login`) ||
    pathname.startsWith(`/${locale}/reset`) ||
    pathname.startsWith(`/${locale}/callback`) ||
    pathname.startsWith(`/${locale}/public`)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore next internals + files + api
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Root -> default locale
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url);
  }

  // Ensure locale prefix
  const seg = pathname.split("/")[1];
  if (!isLocale(seg)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = seg;

  // Public routes allowed
  if (isPublicPath(pathname, locale)) {
    return NextResponse.next();
  }

  // Auth guard
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("returnTo", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
