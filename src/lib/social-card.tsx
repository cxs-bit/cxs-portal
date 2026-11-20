import { ImageResponse } from "next/og";

export const socialSize = { width: 1200, height: 630 };

export function socialCard(title: string, section: string) {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "74px 82px", color: "#f8f3fb",
      background: "radial-gradient(ellipse at 100% 120%, #482a66, #110c17 62%)",
      borderTop: "14px solid #bc94ed",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, letterSpacing: 5 }}>
        <div style={{ width: 18, height: 18, background: "#bc94ed", transform: "rotate(45deg)" }} />
        CXS / {section}
      </div>
      <div style={{ display: "flex", fontSize: title.length > 45 ? 66 : 94, lineHeight: 1.03, letterSpacing: -3, fontWeight: 700 }}>
        {title}
      </div>
    </div>,
    socialSize,
  );
}
