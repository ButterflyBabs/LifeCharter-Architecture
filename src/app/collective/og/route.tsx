import { ImageResponse } from "next/og";

// The share card for /collective (Facebook, LinkedIn, iMessage, X…), served at /collective/og.
const size = { width: 1200, height: 630 };

export async function GET() {
  const serif = await loadSerif();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          backgroundColor: "#0F1A38",
          backgroundImage: "radial-gradient(circle at 0% 0%, rgba(212,175,99,0.38), rgba(15,26,56,0) 55%)",
          color: "#F8F5F0",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#E6C988", fontFamily: "sans-serif" }}>The LifeCharter Collective</div>
        <div style={{ marginTop: 24, fontSize: 88, lineHeight: 1.02, fontWeight: 600, fontFamily: serif ? "Cormorant" : "serif", maxWidth: 950 }}>
          Stop building your life&rsquo;s work alone.
        </div>
        <div style={{ marginTop: 30, fontSize: 28, color: "rgba(237,230,214,0.85)", fontFamily: "sans-serif" }}>
          A free community for purpose-led coaches, consultants &amp; founders
        </div>
        <div style={{ marginTop: 40, display: "flex" }}>
          <div style={{ background: "#D4AF63", color: "#0F1A38", fontSize: 26, fontWeight: 700, padding: "16px 30px", borderRadius: 14, fontFamily: "sans-serif" }}>
            Request your free invitation
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
      ...(serif ? { fonts: [{ name: "Cormorant", data: serif, weight: 600 as const, style: "normal" as const }] } : {}),
    }
  );
}

// Cormorant Garamond 600 as a TTF (Google serves TTF to clients that don't
// ask for WOFF2). Falls back to the default font if anything fails.
async function loadSerif(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600").then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}
