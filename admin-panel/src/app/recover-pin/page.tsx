"use client";

import React, { useState } from "react";
import Link from "next/link";
import { recoverStorePinAction } from "../actions/authActions";

export default function RecoverPinPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailDispatchedData, setEmailDispatchedData] = useState<{
    storeName: string;
    maskedEmail: string;
    simulated?: boolean;
    devPreviewUrl?: string;
    devPreviewPin?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setEmailDispatchedData(null);

      const res = await recoverStorePinAction(email);
      if (res.success && res.maskedEmail) {
        setEmailDispatchedData({
          storeName: res.storeName || "Your Store",
          maskedEmail: res.maskedEmail,
          simulated: res.simulated,
          devPreviewUrl: res.devPreviewUrl,
          devPreviewPin: res.devPreviewPin,
        });
      } else {
        setErrorMsg(res.error || "No store found registered with this email address.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch recovery email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
        {/* Header Icon */}
        <div className="w-14 h-14 bg-amber-400 border-3 border-black rounded-2xl flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000] mb-3">
          📧
        </div>

        <h1 className="font-serif text-2xl font-black text-black mb-1">
          Store PIN Recovery
        </h1>
        <p className="text-xs font-semibold text-black/60 mb-5">
          Forgot your store&apos;s secret access PIN? Enter your registered store owner email address. We&apos;ll email your PIN and 1-click unlock link directly to your inbox.
        </p>

        {!emailDispatchedData ? (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-black/70 mb-1">
                Registered Store Owner Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@brewbites.com"
                className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "DISPATCHING SECURE EMAIL..." : "SEND RECOVERY EMAIL ✉️"}
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-4 text-left">
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📬</span>
                <div>
                  <h2 className="font-serif font-black text-emerald-950 text-base leading-tight">
                    Recovery Email Dispatched!
                  </h2>
                  <p className="text-[11px] text-emerald-800 font-bold uppercase">
                    Store: {emailDispatchedData.storeName}
                  </p>
                </div>
              </div>

              <p className="text-xs text-emerald-900 font-semibold mb-3 leading-relaxed">
                We have sent an email with your secret store PIN and a 1-click access button to:
                <br />
                <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-emerald-300 inline-block mt-1">
                  {emailDispatchedData.maskedEmail}
                </span>
              </p>

              <div className="bg-white/80 border border-emerald-300 rounded-xl p-3 text-[11px] text-emerald-800 font-medium mb-2">
                💡 <strong>Next steps:</strong> Open your email inbox, check the email from <em>ForStore Security</em>, and click <strong>&quot;OPEN STORE ADMIN DASHBOARD&quot;</strong>. Don&apos;t forget to check your spam/promotions folder if it doesn&apos;t arrive in 1 minute.
              </div>

              {/* Dev mode preview helper when testing locally without external email provider */}
              {emailDispatchedData.simulated && (
                <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs text-amber-950">
                  <div className="font-black text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>⚡</span> Dev Simulation Mode (No SMTP API Key Configured)
                  </div>
                  <p className="text-[11px] mb-2 font-semibold">
                    In production, this email is dispatched via Resend/SendGrid. For testing right now:
                  </p>
                  <div className="bg-white p-2 rounded border border-amber-300 font-mono text-xs font-black flex justify-between items-center mb-2">
                    <span>Your Store PIN:</span>
                    <span className="text-[#FF4C29] text-sm">{emailDispatchedData.devPreviewPin}</span>
                  </div>
                  {emailDispatchedData.devPreviewUrl && (
                    <a
                      href={emailDispatchedData.devPreviewUrl}
                      className="block w-full py-2 bg-black text-white rounded-lg text-center font-bold text-xs shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all"
                    >
                      TEST 1-CLICK UNLOCK LINK 🚀
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setEmailDispatchedData(null);
                setEmail("");
              }}
              className="text-xs font-bold text-black/60 hover:text-black text-center cursor-pointer"
            >
              ← Send to a different email
            </button>
          </div>
        )}

        <div className="w-full border-t-2 border-black/10 mt-6 pt-4 flex justify-between items-center text-[11px] font-bold text-black/50">
          <Link href="/arcade?store=adda-99" className="hover:text-black">
            ← Back to Customer Arcade
          </Link>
          <span>ForStore HQ Email Security</span>
        </div>
      </main>
    </div>
  );
}
