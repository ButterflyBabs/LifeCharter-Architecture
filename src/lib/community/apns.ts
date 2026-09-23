// Server-only: send notifications to the iPhone app via Apple Push
// Notification service (token-based auth, HTTP/2). Configure with:
//   APNS_KEY_ID       — the key's 10-character ID (Certificates, Identifiers & Profiles → Keys)
//   APNS_PRIVATE_KEY  — contents of the AuthKey_XXXX.p8 file (newlines may be written as \n)
//   APNS_TEAM_ID      — Apple Developer Team ID (defaults to LifeCharter's)
//   APNS_BUNDLE_ID    — defaults to com.lifecharter.collective
import crypto from "node:crypto";
import http2 from "node:http2";

const HOSTS = { production: "https://api.push.apple.com", sandbox: "https://api.sandbox.push.apple.com" } as const;
export type ApnsEnv = keyof typeof HOSTS;

export function apnsConfigured(): boolean {
  return Boolean(process.env.APNS_KEY_ID && process.env.APNS_PRIVATE_KEY);
}

let token: { value: string; at: number } | null = null;
function providerToken(): string {
  // Apple accepts a token for up to an hour; refresh every 50 minutes.
  if (token && Date.now() - token.at < 50 * 60_000) return token.value;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "ES256", kid: process.env.APNS_KEY_ID })}.${b64({ iss: process.env.APNS_TEAM_ID || "FLC73LFHKN", iat })}`;
  const key = (process.env.APNS_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const sig = crypto.sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  token = { value: `${unsigned}.${sig}`, at: Date.now() };
  return token.value;
}

export interface ApnsMessage {
  title: string;
  body: string;
  href: string;
  threadId?: string;
}

export interface ApnsResult {
  token: string;
  ok: boolean;
  status: number;
  reason?: string;
}

// Send one message to many devices on one environment. Returns per-device results
// so the caller can drop dead tokens (410 / BadDeviceToken).
export async function sendApns(env: ApnsEnv, tokens: string[], msg: ApnsMessage): Promise<ApnsResult[]> {
  if (!tokens.length) return [];
  const session = http2.connect(HOSTS[env]);
  session.on("error", (e) => console.error("apns session:", e.message));
  const auth = `bearer ${providerToken()}`;
  const payload = JSON.stringify({
    aps: { alert: { title: msg.title, body: msg.body }, sound: "default", ...(msg.threadId ? { "thread-id": msg.threadId } : {}) },
    href: msg.href,
  });
  try {
    return await Promise.all(
      tokens.map(
        (t) =>
          new Promise<ApnsResult>((resolve) => {
            const req = session.request({
              ":method": "POST",
              ":path": `/3/device/${t}`,
              authorization: auth,
              "apns-topic": process.env.APNS_BUNDLE_ID || "com.lifecharter.collective",
              "apns-push-type": "alert",
              "apns-priority": "10",
              "content-type": "application/json",
            });
            let status = 0;
            let data = "";
            req.on("response", (h) => (status = Number(h[":status"])));
            req.setEncoding("utf8");
            req.on("data", (c: string) => (data += c));
            req.on("end", () => {
              let reason: string | undefined;
              try {
                reason = data ? (JSON.parse(data) as { reason?: string }).reason : undefined;
              } catch {
                /* empty body on success */
              }
              resolve({ token: t, ok: status === 200, status, reason });
            });
            req.on("error", (e) => resolve({ token: t, ok: false, status: 0, reason: e.message }));
            req.setTimeout(10_000, () => {
              req.close();
              resolve({ token: t, ok: false, status: 0, reason: "timeout" });
            });
            req.end(payload);
          })
      )
    );
  } finally {
    session.close();
  }
}
