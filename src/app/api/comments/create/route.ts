import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServer();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const post_id = String(payload?.post_id || "").trim();
  const body = String(payload?.body || "").trim();

  if (!post_id) {
    return NextResponse.json({ ok: false, error: "Missing post_id" }, { status: 400 });
  }
  if (body.length < 2) {
    return NextResponse.json({ ok: false, error: "Reply too short" }, { status: 400 });
  }
  if (body.length > 4000) {
    return NextResponse.json({ ok: false, error: "Reply too long" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id,
      user_id: auth.user.id,
      body,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
