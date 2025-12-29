import { NextResponse } from "next/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

// Fallback hvis Supabase lander på /callback uden locale.
// Sender videre til /{DEFAULT_LOCALE}/callback med samme querystring.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const next = new URL(`/${DEFAULT_LOCALE}/callback`, url.origin);
  next.search = url.search; // bevar ?code=...&returnTo=...

  return NextResponse.redirect(next);
}
