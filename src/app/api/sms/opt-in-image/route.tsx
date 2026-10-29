import { ImageResponse } from "next/og";
import { consentText } from "@/lib/sms";

// The opt-in screenshot sent to the carriers with a texting number's toll-free verification. It shows the booking form with the
// account's REAL business name in the consent line (the carriers reject a generic "Your Business Name": reason 30506).
//   GET ?n=<name clients know the business by>&l=<legal business name>
const clean = (v: string | null, n: number) => (v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

export async function GET(req: Request) {
  const u = new URL(req.url);
  const name = clean(u.searchParams.get("n"), 80) || "Your business";
  const legal = clean(u.searchParams.get("l"), 80);
  const field = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1F2B3A", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", border: "2px solid #E6DFD0", borderRadius: 14, padding: "14px 18px", fontSize: 26, color: "#1F2B3A" }}>{value}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF", padding: "46px 56px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 44, fontWeight: 700, color: "#1F2B3A" }}>{name}</div>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 24, color: "#5D6B7A", marginTop: 6, marginBottom: 26 }}>Book a call · online booking page</div>
        <div style={{ display: "flex", flexDirection: "column", border: "2px solid #E6DFD0", borderRadius: 16, padding: "16px 20px", marginBottom: 26 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1F2B3A" }}>Tuesday, October 20</div>
          <div style={{ fontSize: 22, color: "#1F2B3A" }}>10:00 AM – 10:30 AM (America/Denver)</div>
        </div>
        {field("Name *", "Jordan Example")}
        {field("Email *", "jordan@example.com")}
        {field("Phone", "(303) 555-0123")}
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 6 }}>
          <div style={{ width: 34, height: 34, border: "3px solid #1F2B3A", borderRadius: 6, marginRight: 16, flexShrink: 0 }} />
          <div style={{ display: "flex", flex: 1, fontSize: 24, lineHeight: 1.35, color: "#1F2B3A" }}>{consentText(name)}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#2B7A80", color: "#fff", fontSize: 30, fontWeight: 700, borderRadius: 18, padding: "20px 0", marginTop: 30 }}>Confirm booking</div>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 20, color: "#5D6B7A", marginTop: 16, textAlign: "center" }}>The box is never ticked for the visitor. Texts are sent only when they tick it. Booking works the same without it.</div>
        {legal && legal.toLowerCase() !== name.toLowerCase() ? <div style={{ display: "flex", justifyContent: "center", fontSize: 20, color: "#5D6B7A", marginTop: 10 }}>{name} is operated by {legal}</div> : null}
      </div>
    ),
    { width: 900, height: 1180 },
  );
}
