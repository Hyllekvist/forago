import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Body = {
  handle?: string | null;
  display_name?: string | null;
  bio?: string | null;
  locale?: string | null;
};

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normHandle(raw: string) {
  // basic: lowercase, a-z0-9_
  const h = raw.trim().toLowerCase();
  const cleaned = h.replace(/[^a-z0-9_]/g, "");
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth, error: authErr } = await supabase.auth.getUser();

    if (authErr || !auth?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;

    const handle = normHandle(asText(body.handle));
    const display_name = asText(body.display_name);
    const bio = asText(body.bio);
    const locale = asText(body.locale) || "dk";

    if (!handle || handle.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Handle skal være mindst 3 tegn (a-z, 0-9, _)." },
        { status: 400 }
      );
    }
    if (handle.length > 24) {
      return NextResponse.json({ ok: false, error: "Handle må max være 24 tegn." }, { status: 400 });
    }

    const user_id = auth.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id,
          handle,
          display_name: display_name || null,
          bio: bio || null,
          locale,
        },
        { onConflict: "user_id" }
      )
      .select("user_id, handle, display_name, bio, locale, created_at, updated_at")
      .single();

    if (error) {
      // typisk: duplicate key på handle (unique)
      const msg =
        error.code === "23505"
          ? "Handle er allerede taget."
          : error.message;

      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
