import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
 
type ApiOk = { ok: true; score: number; my_vote: number };
type ApiErr = { ok: false; error: string };

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json<ApiErr>({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json<ApiErr>({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const post_id = String(payload?.post_id ?? "");
  const valueRaw = Number(payload?.value ?? 0);
  const value = valueRaw === -1 ? -1 : 1;

  if (!post_id) {
    return NextResponse.json<ApiErr>({ ok: false, error: "Missing post_id" }, { status: 400 });
  }

  // post_votes: (post_id uuid, user_id uuid, value int, unique(post_id,user_id))
  const { error } = await supabase
    .from("post_votes")
    .upsert({ post_id, user_id: auth.user.id, value }, { onConflict: "post_id,user_id" });

  if (error) {
    return NextResponse.json<ApiErr>(
      { ok: false, error: error.message ?? "Vote failed" },
      { status: 500 }
    );
  }

  const { data: scoreRow } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", post_id);

  const score = (scoreRow ?? []).reduce((sum, r: any) => sum + (r.value ?? 0), 0);

  return NextResponse.json<ApiOk>({ ok: true, score, my_vote: value });
}

export async function DELETE(req: Request) {
  const supabase = await supabaseServer();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json<ApiErr>({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const post_id = url.searchParams.get("post_id") ?? "";

  if (!post_id) {
    return NextResponse.json<ApiErr>({ ok: false, error: "Missing post_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("post_votes")
    .delete()
    .eq("post_id", post_id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json<ApiErr>(
      { ok: false, error: error.message ?? "Unvote failed" },
      { status: 500 }
    );
  }

  const { data: scoreRow } = await supabase
    .from("post_votes")
    .select("value")
    .eq("post_id", post_id);

  const score = (scoreRow ?? []).reduce((sum, r: any) => sum + (r.value ?? 0), 0);

  return NextResponse.json<ApiOk>({ ok: true, score, my_vote: 0 });
}