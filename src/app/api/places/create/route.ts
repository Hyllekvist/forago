import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

function supabaseRoute() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rand4() {
  return Math.random().toString(36).slice(2, 6);
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseRoute();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      lat: number;
      lng: number;
      name: string;
      country?: string;
      region?: string;
      habitat?: string;
      description?: string;
      species_slug?: string | null;
      confidence?: number;
      slug?: string;
    };

    const name = String(body?.name ?? "").trim() || "Nyt spot";
    const slug = (body.slug && String(body.slug).trim()) || `${slugify(name)}-${rand4()}`;

    const insertRow = {
      slug,
      name,
      lat: Number(body.lat),
      lng: Number(body.lng),
      country: String(body.country ?? "dk"),
      region: String(body.region ?? ""),
      habitat: String(body.habitat ?? "unknown"),
      description: String(body.description ?? ""),
      user_id: user.id,
      // hvis du faktisk har species_slug/confidence kolonner i places, tilføj dem her.
    };

    if (!Number.isFinite(insertRow.lat) || !Number.isFinite(insertRow.lng)) {
      return NextResponse.json({ ok: false, error: "Invalid lat/lng" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("places")
      .insert(insertRow)
      .select("slug,name,lat,lng")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, place: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
