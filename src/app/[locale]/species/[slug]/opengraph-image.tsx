// src/app/[locale]/species/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string; locale: string } }) {
  const title =
    params.locale === "dk" ? "Forago — Art" : "Forago — Species";
  const slug = params.slug?.replace(/-/g, " ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 64,
          background: "linear-gradient(135deg, #0b0f14 0%, #0a1a12 60%, #0b0f14 100%)",
          color: "white",
          fontFamily: "system-ui",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ opacity: 0.8, fontSize: 28 }}>{title}</div>

        <div>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1, textTransform: "capitalize" }}>
            {slug}
          </div>
          <div style={{ marginTop: 18, fontSize: 26, opacity: 0.78 }}>
            Season • Identification • Look-alikes
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)" }}>
            forago.app
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.14)" }}>
            Privacy-first geo
          </div>
        </div>
      </div>
    ),
    size
  );
}