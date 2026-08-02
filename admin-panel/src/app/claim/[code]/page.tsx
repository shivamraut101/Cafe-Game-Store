"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { redeemRewardVoucherAction } from "../../actions/gameActions";

interface ClaimPageProps {
  params: Promise<{ code: string }>;
}

export default function StaffClaimVerificationPage({ params }: ClaimPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetchClaimDetails();
  }, [code]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/rewards/claim?code=${code}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Voucher not found");
      } else {
        setClaim(data.claim);
        if (data.claim.status === "claimed") {
          setRedeemSuccess(true);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load claim verification");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      setIsRedeeming(true);
      const res = await redeemRewardVoucherAction(code);

      if (!res.success) {
        alert(res.error || "Redemption failed");
      } else {
        setRedeemSuccess(true);
        setClaim((prev: any) => ({ ...prev, status: "claimed" }));
        if (typeof window !== "undefined" && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 200]);
        }
      }
    } catch (e) {
      alert("Network error redeeming voucher");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Top Header Badge */}
        <div className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] mb-4">
          STAFF VOUCHER REDEMPTION
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center">
            <span className="text-5xl animate-spin mb-3">☕</span>
            <p className="text-xs font-black text-black/50">Verifying voucher with database...</p>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center">
            <span className="text-6xl mb-3">⚠️</span>
            <h2 className="font-serif text-2xl font-black text-red-500 mb-2">Invalid Voucher</h2>
            <p className="text-xs font-semibold text-black/60 max-w-xs mb-6">{error}</p>
            <Link
              href="/my-rewards"
              className="py-3 px-6 bg-black text-white rounded-2xl font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29]"
            >
              BACK TO WALLET 🚀
            </Link>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Voucher Icon */}
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-3 border-black flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#000] mb-4">
              🎁
            </div>

            {/* Store & Customer */}
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4C29]">
              {claim.storeName}
            </p>
            <h2 className="font-serif text-2xl font-black text-black my-1">{claim.rewardName}</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">{claim.rewardDescription}</p>

            {/* Claim Code Card */}
            <div className="bg-[#FBF9F4] w-full p-4 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000] mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/40 block">
                Verification Claim Code
              </span>
              <h3 className="font-mono text-3xl font-black text-[#FF4C29] tracking-wider my-1">
                {claim.claimCode}
              </h3>
              <p className="text-[11px] font-bold text-black/60 mt-1">Customer: {claim.customerName}</p>
            </div>

            {/* Status / Action Button */}
            {redeemSuccess ? (
              <div className="w-full py-4 bg-emerald-400 text-black border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000] flex flex-col items-center">
                <span className="text-2xl mb-1">✅</span>
                <span>REWARD VERIFIED & REDEEMED!</span>
                <span className="text-[10px] font-bold opacity-75 mt-0.5">
                  Claimed at: {new Date(claim.claimedAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            ) : claim.status === "expired" ? (
              <div className="w-full py-4 bg-red-400 text-black border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000]">
                ⚠️ VOUCHER EXPIRED
              </div>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="w-full py-4 bg-[#FF4C29] text-white border-3 border-black rounded-2xl font-black text-base shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer"
              >
                {isRedeeming ? "REDEEMING..." : "STAFF: TAP TO VERIFY & REDEEM 🎯"}
              </button>
            )}

            <Link
              href="/my-rewards"
              className="text-xs font-bold text-black/50 underline mt-6 hover:text-black"
            >
              Back to Customer Wallet
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
