import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = String(payload?.locale ?? "dk");
  const type = String(payload?.type ?? "question");
  const title = String(payload?.title ?? "").trim();
  const body = String(payload?.body ?? "").trim();

  if (!title || !body) {
    return NextResponse.json({ error: "Missing title/body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      locale,
      type,
      title,
      body,
      user_id: auth.user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}