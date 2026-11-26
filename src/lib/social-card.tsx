import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const socialSize = { width: 1200, height: 630 };

export async function socialCard(title: string, section: string, art?: "television" | "rally-scoring") {
  const image = art && await readFile(join(process.cwd(), "src/lib/social-images", art + ".jpg"));
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "55px 60px 64px", color: "#eff1f5",
      background: "#17191d", borderTop: "12px solid #60b1ea",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 700 }}>
        <span style={{ color: "#60b1ea" }}>{"//"}</span> CXS.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexGrow: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", width: image ? 430 : "100%", gap: 18 }}>
          <div style={{ fontSize: 32, color: "#60b1ea" }}>{section}</div>
          <div style={{ fontSize: title.length > 45 ? 64 : 88, lineHeight: 1.04, letterSpacing: -3, fontWeight: 700 }}>
            {title}
          </div>
        </div>
        {/* ImageResponse consumes an embedded image directly. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && <img width={626} height={368} alt="" src={`data:image/jpeg;base64,${image.toString("base64")}`}
          style={{ objectFit: "cover", borderRadius: 16 }} />}
      </div>
    </div>,
    socialSize,
  );
}
