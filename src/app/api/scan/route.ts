import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HydrateReq = { slugs: string[] };

function titleizeSlug(slug: string) {
  return slug
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";

    // ✅ JSON hydrate flow
    if (ct.includes("application/json")) {
      const body = (await req.json()) as HydrateReq;
      const slugs = Array.isArray(body?.slugs) ? body.slugs.slice(0, 6) : [];
      if (!slugs.length) return NextResponse.json({ ok: false, error: "NO_SLUGS" }, { status: 400 });

      // TODO: slå op i Supabase (species + checks) når du er klar.
      // Lige nu returnerer vi “placeholder metadata”, men rigtige slugs.
      const candidates = slugs.map((slug, i) => ({
        slug,
        name: titleizeSlug(slug),
        latin: undefined as string | undefined,
        confidence: i === 0 ? "high" : i === 1 ? "medium" : "low",
        checks: [
          { id: "cap", label: "Tjek hat-form og farve" },
          { id: "underside", label: "Tjek underside (ribber/lameller/porer)" },
          { id: "stem", label: "Tjek stok (farve, ring, volva)" },
        ],
      }));

      return NextResponse.json({ ok: true, candidates });
    }

    // fallback: formdata flow (tidligere demo)
    const form = await req.formData();
    const image = form.get("image");
    if (!image) return NextResponse.json({ ok: false, error: "NO_IMAGE" }, { status: 400 });

    return NextResponse.json({
      ok: true,
      candidates: [
        {
          slug: "kantarel",
          name: "Kantarel",
          latin: "Cantharellus cibarius",
          confidence: "high",
          checks: [
            { id: "ridges", label: "Gule, nedløbende ribber (ikke lameller)" },
            { id: "funnel", label: "Tragtformet hat" },
            { id: "smell", label: "Frugtagtig duft" },
          ],
        },
      ],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
