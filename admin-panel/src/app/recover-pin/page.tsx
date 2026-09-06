"use client";

import React, { useState } from "react";
import Link from "next/link";
import { recoverStorePinAction } from "../actions/authActions";

export default function RecoverPinPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoveryData, setRecoveryData] = useState<{
    storeName: string;
    pin: string;
    recoveryUrl: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setRecoveryData(null);

      const res = await recoverStorePinAction(email);
      if (res.success && res.pin) {
        setRecoveryData({
          storeName: res.storeName || "Your Store",
          pin: res.pin,
          recoveryUrl: res.recoveryUrl || `/?pin=${res.pin}`,
        });
      } else {
        setErrorMsg(res.error || "No store found registered with this email address.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to recover PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!recoveryData) return;
    const fullUrl = `${window.location.origin}${recoveryData.recoveryUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
        {/* Header Icon */}
        <div className="w-14 h-14 bg-amber-400 border-3 border-black rounded-2xl flex items-center justify-center text-2xl shadow-[3px_3px_0px_0px_#000] mb-3">
          🔑
        </div>

        <h1 className="font-serif text-2xl font-black text-black mb-1">
          Store PIN Recovery
        </h1>
        <p className="text-xs font-semibold text-black/60 mb-5">
          Forgot your store&apos;s secret access PIN? Enter your registered store owner email address to verify your account.
        </p>

        {!recoveryData ? (
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
              {loading ? "VERIFYING STORE WITH MONGO DB..." : "RECOVER ACCESS PIN 🚀"}
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-4 text-left">
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎉</span>
                <span className="font-serif font-black text-emerald-950 text-sm">
                  Store Verified: {recoveryData.storeName}
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-semibold mb-3">
                Your browser has been granted a 30-day verified session! Here is your secret PIN:
              </p>

              <div className="bg-white border-2 border-black rounded-xl p-3 flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-black/50 block font-bold">Your Store PIN</span>
                  <span className="font-mono text-xl font-black tracking-widest text-[#FF4C29]">{recoveryData.pin}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 cursor-pointer shadow-[1px_1px_0px_0px_#FF4C29]"
                >
                  {copied ? "COPIED! ✓" : "COPY SECRET LINK 📋"}
                </button>
              </div>

              <a
                href={recoveryData.recoveryUrl}
                className="w-full py-3 bg-[#FF4C29] text-white border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] transition-all block text-center cursor-pointer"
              >
                OPEN STORE ADMIN PORTAL NOW 🔓
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                setRecoveryData(null);
                setEmail("");
              }}
              className="text-xs font-bold text-black/60 hover:text-black text-center cursor-pointer"
            >
              ← Search another email
            </button>
          </div>
        )}

        <div className="w-full border-t-2 border-black/10 mt-6 pt-4 flex justify-between items-center text-[11px] font-bold text-black/50">
          <Link href="/arcade?store=adda-99" className="hover:text-black">
            ← Back to Customer Arcade
          </Link>
          <span>ForStore HQ Multi-Tenant Security</span>
        </div>
      </main>
    </div>
  );
}
