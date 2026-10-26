"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Shield, AlertCircle, CheckCircle, LogOut, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Real two-factor auth (TOTP via Supabase MFA) + a functional "sign out other
// devices" action. Replaces the old mock 2FA / Active Sessions blocks.
export default function SecurityPanel() {
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null); // verified TOTP factor, if any
  const [enrolling, setEnrolling] = useState<{ factorId: string; qr: string; secret: string; uri: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [signingOut, setSigningOut] = useState(false);
  const [signOutMsg, setSignOutMsg] = useState<string | null>(null);

  const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const refresh = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f: { id: string; status: string }) => f.status === "verified");
      setFactorId(verified?.id ?? null);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEnroll = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) {
        setMsg({ ok: false, text: error?.message ?? "Couldn't start 2FA setup." });
      } else {
        setEnrolling({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri });
      }
    } catch (e) {
      setMsg({ ok: false, text: errText(e) });
    }
    setBusy(false);
  };

  const verifyEnroll = async () => {
    if (!enrolling) return;
    setMsg(null);
    setBusy(true);
    try {
      const ch = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
      if (ch.error) {
        setMsg({ ok: false, text: ch.error.message });
      } else {
        const v = await supabase.auth.mfa.verify({
          factorId: enrolling.factorId,
          challengeId: ch.data.id,
          code: code.trim(),
        });
        if (v.error) {
          setMsg({ ok: false, text: "That code didn't match — check your app and try again." });
        } else {
          setEnrolling(null);
          setCode("");
          setMsg({ ok: true, text: "Two-factor authentication is on." });
          refresh();
        }
      }
    } catch (e) {
      setMsg({ ok: false, text: errText(e) });
    }
    setBusy(false);
  };

  const cancelEnroll = async () => {
    if (enrolling) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrolling.factorId });
      } catch {
        /* ignore */
      }
    }
    setEnrolling(null);
    setCode("");
  };

  const disable2fa = async () => {
    if (!factorId) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) setMsg({ ok: false, text: error.message });
      else {
        setFactorId(null);
        setMsg({ ok: true, text: "Two-factor authentication turned off." });
      }
    } catch (e) {
      setMsg({ ok: false, text: errText(e) });
    }
    setBusy(false);
  };

  const signOutOthers = async () => {
    setSigningOut(true);
    setSignOutMsg(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      setSignOutMsg(error ? error.message : "Signed out of all other devices.");
    } catch (e) {
      setSignOutMsg(errText(e));
    }
    setSigningOut(false);
  };

  return (
    <>
      {/* Two-Factor Authentication */}
      <div className="border-t border-[#1a2b4a]/10 pt-6">
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Two-Factor Authentication
        </h4>

        {factorId ? (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">2FA is on</p>
                <p className="text-sm text-[#b8a898] mt-1">
                  You&apos;ll enter a code from your authenticator app when you sign in.
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={disable2fa} disabled={busy}>
                  {busy ? "Working…" : "Turn off 2FA"}
                </Button>
              </div>
            </div>
          </div>
        ) : enrolling ? (
          <div className="p-4 rounded-lg border border-[#1a2b4a]/10 space-y-3">
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              Add this account to your authenticator app (Google Authenticator, 1Password, Authy), then enter the
              6-digit code it shows to confirm. Use whichever of the three ways below suits your app.
            </p>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b8a898]">1. Scan the code</p>
              {/* The code is shown as a picture of its own fixed size, so nothing can overlap the key below it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrolling.qr.startsWith("data:") ? enrolling.qr : `data:image/svg+xml;utf-8,${encodeURIComponent(enrolling.qr)}`}
                alt="QR code to scan with your authenticator app"
                width={192}
                height={192}
                className="mx-auto block h-48 w-48 rounded-lg bg-white p-2"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b8a898]">2. Or copy the setup key</p>
              <p className="mb-2 text-xs text-[#b8a898]">In your app, choose to add a code by hand or paste a setup key, and paste this in.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={enrolling.secret}
                  aria-label="Setup key"
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-[#1a2b4a]/20 bg-white px-3 py-2 font-mono text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(enrolling.secret);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      /* the key is selected when the box is clicked, so it can be copied by hand */
                    }
                  }}
                >
                  {copied ? <><Check className="mr-1 h-4 w-4" /> Copied</> : <><Copy className="mr-1 h-4 w-4" /> Copy</>}
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#b8a898]">3. Or open it in your app</p>
              <p className="text-xs text-[#b8a898]">
                On the same phone or computer as your authenticator app,{" "}
                <a href={enrolling.uri} className="font-medium text-[#2E7C83] underline">tap here to open it in your app</a>.
              </p>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={cancelEnroll} disabled={busy}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={verifyEnroll} disabled={busy || code.trim().length < 6}>
                {busy ? "Verifying…" : "Confirm"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">2FA not enabled</p>
                <p className="text-sm text-[#b8a898] mt-1">Add an extra layer of security to your account.</p>
                <Button className="mt-3" size="sm" onClick={startEnroll} disabled={busy}>
                  {busy ? "Starting…" : "Enable 2FA"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {msg && (
          <p className={`text-sm mt-3 ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
        )}
      </div>

      {/* Sessions */}
      <div className="border-t border-[#1a2b4a]/10 pt-6">
        <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">Sessions</h4>
        <div className="flex items-center justify-between p-3 rounded-lg border border-[#1a2b4a]/10">
          <div>
            <p className="text-[#1a2b4a] dark:text-[#F8F5F0]">Signed in on other devices?</p>
            <p className="text-sm text-[#b8a898]">
              Sign out everywhere except here — useful on a lost or shared device.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={signOutOthers} disabled={signingOut}>
            <LogOut className="w-4 h-4 mr-1.5" />
            {signingOut ? "Working…" : "Sign out other devices"}
          </Button>
        </div>
        {signOutMsg && <p className="text-sm mt-3 text-[#2E7C83]">{signOutMsg}</p>}
      </div>
    </>
  );
}
