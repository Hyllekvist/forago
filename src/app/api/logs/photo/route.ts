import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const { data, error } = await supabase.storage
    .from("log-photos")
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not sign url" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}