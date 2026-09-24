import { ImageResponse } from "next/og";

// The share card for /collective (Facebook, LinkedIn, iMessage, X…), served at /collective/og.
const size = { width: 1200, height: 630 };
// The Collective's signature gradient.
const DAWN = "linear-gradient(100deg, #F5D8CF 0%, #F0B58B 22%, #D4AF63 48%, #94A3B8 74%, #1F2B59 100%)";

export async function GET(req: Request) {
  const [serif, logo] = await Promise.all([loadSerif(), loadLogo(new URL("/collective-logo.png", req.url).toString())]);
  const serifFamily = serif ? "EB Garamond" : "serif";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FAF8F3",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(245,216,207,0.95), rgba(250,248,243,0) 50%), radial-gradient(circle at 100% 100%, rgba(148,163,184,0.45), rgba(250,248,243,0) 55%)",
          color: "#1F2B3A",
        }}
      >
        <div style={{ height: 10, width: "100%", display: "flex", backgroundImage: DAWN }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, padding: "40px 90px 56px" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={420} height={140} alt="" style={{ marginLeft: -8 }} />
          ) : (
            <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#A8873F", fontFamily: "sans-serif" }}>The LifeCharter Collective</div>
          )}
          <div style={{ marginTop: 26, fontSize: 80, lineHeight: 1.04, fontWeight: 600, fontFamily: serifFamily, maxWidth: 980 }}>
            Stop building your life&rsquo;s work alone.
          </div>
          <div style={{ marginTop: 20, fontSize: 32, color: "#2E3A46", fontFamily: serifFamily }}>Where LifeCharter and LifeCharter Command Suite members gather.</div>
          <div style={{ marginTop: 34, display: "flex" }}>
            <div style={{ background: "#D4AF63", color: "#1F2B3A", fontSize: 26, fontWeight: 700, padding: "16px 30px", borderRadius: 14, fontFamily: "sans-serif" }}>
              Request your free invitation
            </div>
          </div>
        </div>
        <div style={{ height: 18, width: "100%", display: "flex", backgroundImage: DAWN }} />
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
      ...(serif ? { fonts: [{ name: "EB Garamond", data: serif, weight: 600 as const, style: "normal" as const }] } : {}),
    }
  );
}

// The Collective logo as a data URL. Falls back to a text label if it can't be fetched.
async function loadLogo(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

// EB Garamond 600 as a TTF (Google serves TTF to clients that don't
// ask for WOFF2). Falls back to the default font if anything fails.
async function loadSerif(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600").then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}
