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
          checks: [
            { id: "ridges", label: "Gule, nedløbende ribber (ikke lameller)" },
            { id: "funnel", label: "Tragtformet hat" },
            { id: "smell", label: "Frugtagtig duft" },
          ],
        },
        {
          slug: "tragtkantarel",
          name: "Tragtkantarel",
          latin: "Craterellus tubaeformis",
          confidence: "medium",
          checks: [
            { id: "hollow", label: "Hul stok" },
            { id: "darker", label: "Mørkere hat" },
            { id: "grey", label: "Ribber mere grålige" },
          ],
        },
        {
          slug: "falsk-kantarel",
          name: "Falsk kantarel",
          latin: "Hygrophoropsis aurantiaca",
          confidence: "low",
          checks: [
            { id: "gills", label: "Tætte lameller" },
            { id: "orange", label: "Mere orange farve" },
            { id: "wood", label: "Vokser ofte på dødt træ/strøelse" },
          ],
        },
      ],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}