"use client";

import React, { useState } from "react";
import Link from "next/link";
import { redeemRewardVoucherAction } from "../actions/gameActions";

export default function StaffVoucherLookupPortal() {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setClaimData(null);

    let formatted = inputCode.trim().toUpperCase();
    if (!formatted.startsWith("BRW-")) formatted = `BRW-${formatted}`;

    try {
      const res = await fetch(`/api/rewards/claim?code=${formatted}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Voucher code not found in system.");
      } else {
        setClaimData(data.claim);
      }
    } catch (err: any) {
      setError("Network error looking up code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!claimData) return;

    setLoading(true);
    setError(null);
    try {
      const res = await redeemRewardVoucherAction(claimData.claimCode);
      if (!res.success) {
        setError(res.error || "Redemption failed.");
      } else {
        setSuccessMsg(`Voucher ${claimData.claimCode} successfully redeemed!`);
        setClaimData({ ...claimData, status: "claimed", claimedAt: res.claimedAt });
        if (typeof window !== "undefined" && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 200]);
        }
      }
    } catch (err: any) {
      setError("Failed to process redemption.");
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m remaining (2h Limit)`;
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
        
        {/* Header Badge */}
        <div className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] mb-4">
          STAFF COUNTER REDEMPTION PORTAL
        </div>

        <h1 className="font-serif text-2xl font-black text-black mb-1">Verify Customer Voucher</h1>
        <p className="text-xs font-semibold text-black/60 mb-6">
          Enter customer&apos;s claim code to verify 2-hour validity and mark as redeemed.
        </p>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="w-full flex flex-col gap-3 mb-6">
          <div className="relative w-full">
            <span className="absolute left-4 top-3.5 font-mono font-black text-black/40 text-sm">BRW-</span>
            <input
              type="text"
              value={inputCode.replace(/^BRW-/i, "")}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="7X92"
              maxLength={8}
              className="w-full pl-16 pr-4 py-3 rounded-2xl border-3 border-black font-mono text-xl font-black uppercase bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29] shadow-[3px_3px_0px_0px_#000]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inputCode.trim()}
            className="w-full py-3.5 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "SEARCHING DATABASE..." : "LOOKUP CODE 🔍"}
          </button>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="w-full bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-xs font-bold mb-4 shadow-[2px_2px_0px_0px_#000]">
            ⚠️ {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="w-full bg-emerald-100 border-2 border-emerald-500 text-emerald-800 p-3 rounded-2xl text-xs font-bold mb-4 shadow-[2px_2px_0px_0px_#000]">
            ✅ {successMsg}
          </div>
        )}

        {/* Verification Result Card */}
        {claimData && (
          <div className="w-full bg-[#FBF9F4] border-3 border-black rounded-2xl p-4 text-left shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
              <span className="font-mono text-lg font-black text-[#FF4C29]">{claimData.claimCode}</span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  claimData.status === "claimed"
                    ? "bg-black text-white border-black"
                    : claimData.status === "expired"
                    ? "bg-red-500 text-white border-black"
                    : "bg-emerald-400 text-black border-black"
                }`}
              >
                {claimData.status}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-black text-black">{claimData.rewardName}</h3>
              <p className="text-xs font-semibold text-black/60">{claimData.rewardDescription}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border-2 border-black text-xs font-bold space-y-1">
              <p className="text-black/70">Customer: <span className="text-black font-black">{claimData.customerName}</span></p>
              <p className="text-black/70">Store: <span className="text-black font-black">{claimData.storeName}</span></p>
              <p className="text-black/70">
                2-Hour Window: <span className="text-[#FF4C29] font-black">{getRemainingTime(claimData.expiresAt)}</span>
              </p>
            </div>

            {/* Action Button */}
            {claimData.status === "pending" && (
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-400 text-black border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer mt-1"
              >
                VERIFY & MARK REDEEMED ✅
              </button>
            )}
          </div>
        )}

        <Link
          href="/arcade"
          className="text-xs font-bold text-black/40 underline mt-6 hover:text-black"
        >
          Back to Arcade Website
        </Link>
      </main>
    </div>
  );
}
