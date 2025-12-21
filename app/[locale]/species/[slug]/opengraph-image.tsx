import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG({ params }: { params: { slug: string } }) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
          color: "white",
          fontSize: 64,
          fontWeight: 800,
          padding: 60,
        }}
      >
        {params.slug.replace(/-/g, " ")}
      </div>
    ),
    size,
  );
}
