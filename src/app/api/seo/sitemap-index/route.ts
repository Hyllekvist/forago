import { NextResponse } from "next/server";

export async function GET() {
  // For later: dynamic sitemap index per locale.
  return NextResponse.json({ ok: true });
}
