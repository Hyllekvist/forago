// src/app/api/logs/create/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function extFromFile(file: File) {
  const name = (file.name || "").toLowerCase();
  const m = name.match(/\.([a-z0-9]+)$/);
  if (m?.[1]) return m[1];

  const type = (file.type || "").toLowerCase();
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("heic")) return "heic";
  return "jpg";
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const locale = String(form.get("locale") ?? "dk");
  const speciesQueryRaw = String(form.get("speciesQuery") ?? "");
  const speciesQuery = speciesQueryRaw.trim() || null;

  const visibilityRaw = String(form.get("visibility") ?? "public");
  const visibility = visibilityRaw === "private" ? "private" : "public";

  const noteRaw = String(form.get("note") ?? "");
  const note = noteRaw.trim() || null;

  const file = form.get("photo");
  const photoFile = file instanceof File ? file : null;

  // 1) create DB row first
  const { data: created, error: insErr } = await supabase
    .from("logs")
    .insert({
      user_id: auth.user.id,
      locale,
      species_query: speciesQuery,
      note,
      visibility,
    })
    .select("id")
    .single();

  if (insErr || !created?.id) {
    return NextResponse.json(
      { error: insErr?.message || "Failed to create log" },
      { status: 500 }
    );
  }

  const logId = created.id as string;

  // 2) upload photo (optional)
  if (photoFile) {
    const ext = extFromFile(photoFile);
    const path = `${auth.user.id}/${logId}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("log-photos")
      .upload(path, photoFile, {
        upsert: true,
        contentType: photoFile.type || undefined,
      });

    if (upErr) {
      await supabase.from("logs").delete().eq("id", logId);
      return NextResponse.json(
        { error: upErr.message || "Photo upload failed" },
        { status: 500 }
      );
    }

    const { error: updErr } = await supabase
      .from("logs")
      .update({ photo_path: path })
      .eq("id", logId);

    if (updErr) {
      return NextResponse.json(
        { error: updErr.message || "Failed to link photo" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, id: logId });
}