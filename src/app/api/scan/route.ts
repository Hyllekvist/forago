import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!image) return NextResponse.json({ ok: false, error: "NO_IMAGE" }, { status: 400 });

    // TODO: replace with real model inference / external service
    return NextResponse.json({
      ok: true,
      candidates: [
        {
          slug: "kantarel",
          name: "Kantarel",
          latin: "Cantharellus cibarius",
          confidence: "high",
          why: ["Gule, nedløbende ribber (ikke lameller)", "Tragtformet hat", "Frugtagtig duft"],
        },
        {
          slug: "tragtkantarel",
          name: "Tragtkantarel",
          latin: "Craterellus tubaeformis",
          confidence: "medium",
          why: ["Hul stok", "Mørkere hat", "Ribber mere grålige"],
        },
        {
          slug: "falsk-kantarel",
          name: "Falsk kantarel",
          latin: "Hygrophoropsis aurantiaca",
          confidence: "low",
          why: ["Tætte lameller", "Mere orange farve", "Vokser ofte på dødt træ/strøelse"],
        },
      ],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}