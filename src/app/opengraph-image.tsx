import { ImageResponse } from "next/og";

export const alt = "brandonbybran — sitio personal y minijuegos web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a12 0%, #1a1030 45%, #0d1a2e 100%)",
          color: "#f4f4f5",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 4,
            width: 320,
            borderRadius: 2,
            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          }}
        >
          brandonbybran
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            opacity: 0.88,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          }}
        >
          Sitio personal · Minijuegos web
        </div>
      </div>
    ),
    { ...size },
  );
}
