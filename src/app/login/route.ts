import { NextResponse } from "next/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

export function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/login`, url.origin));
}
