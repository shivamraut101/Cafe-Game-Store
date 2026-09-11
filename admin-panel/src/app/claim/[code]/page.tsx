"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { redeemRewardVoucherAction } from "../../actions/gameActions";
import CustomerNameModal from "../../../components/CustomerNameModal";

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
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [unlockCountdown, setUnlockCountdown] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

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

  // Render QR Code once claim is loaded
  useEffect(() => {
    if (!claim || !qrRef.current) return;

    let mounted = true;
    import("qr-code-styling").then((QRCodeStylingModule) => {
      if (!mounted || !qrRef.current) return;
      const QRCodeStyling = QRCodeStylingModule.default;
      const url = typeof window !== "undefined" ? window.location.href : `https://forstore.app/claim/${code}`;
      
      const qr = new QRCodeStyling({
        width: 190,
        height: 190,
        type: "svg",
        data: url,
        dotsOptions: { color: "#1A1A1A", type: "rounded" },
        backgroundOptions: { color: "#FFFFFF" },
        cornersSquareOptions: { type: "extra-rounded", color: "#FF4C29" },
        cornersDotOptions: { type: "dot", color: "#FF4C29" },
      });

      qrRef.current.innerHTML = "";
      qr.append(qrRef.current);
    });

    return () => {
      mounted = false;
    };
  }, [claim, code]);

  // Live countdown timer for both locked next-visit vouchers and active validity window
  useEffect(() => {
    if (!claim?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const validFromMs = claim.validFrom ? new Date(claim.validFrom).getTime() : 0;
      const currentlyLocked = validFromMs > now;
      setIsLocked(currentlyLocked);

      if (currentlyLocked) {
        const unlockDiff = validFromMs - now;
        const hours = Math.floor(unlockDiff / (1000 * 60 * 60));
        const mins = Math.floor((unlockDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((unlockDiff % (1000 * 60)) / 1000);
        setUnlockCountdown(`${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
      }

      const expiryDiff = new Date(claim.expiresAt).getTime() - now;
      if (expiryDiff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
      } else {
        const days = Math.floor(expiryDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((expiryDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((expiryDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((expiryDiff % (1000 * 60)) / 1000);
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${mins}m`);
        } else {
          setTimeLeft(`${hours}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
        }
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [claim?.expiresAt, claim?.validFrom]);

  const handleCopy = () => {
    if (!claim?.claimCode) return;
    navigator.clipboard.writeText(claim.claimCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    } catch {
      alert("Network error redeeming voucher");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Top Header Badge */}
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-4 uppercase tracking-wider ${
            isLocked
              ? "bg-amber-300 text-amber-950"
              : "bg-black text-white"
          }`}
        >
          {isLocked
            ? "🔒 NEXT-VISIT BOUNCEBACK PASS"
            : claim?.storeName
            ? `${claim.storeName} • REWARD PASS`
            : "CAFE REWARD VOUCHER PASS"}
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
            {/* Store & Customer Header */}
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4C29]">
              {claim.storeName}
            </p>
            <h2 className="font-serif text-2xl font-black text-black my-0.5">{claim.rewardName}</h2>
            <p className="text-xs font-semibold text-black/60 mb-3">{claim.rewardDescription}</p>

            {/* Retention Strategy Callout Box */}
            {claim.timingMode === "next_visit_retention" && (
              <div className="w-full bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 mb-4 text-left shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔒</span>
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    {isLocked ? "Valid On Next Visit" : "Unlocked • Ready to Use"}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-amber-900/90 leading-tight">
                  {isLocked
                    ? `This bounceback reward cannot be redeemed on today's bill. It activates on ${new Date(
                        claim.validFrom
                      ).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} for your return visit!`
                    : `This next-visit voucher is now live and ready to be redeemed at the counter!`}
                </p>
                {claim.minOrderValue > 0 && (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-900">Minimum Order:</span>
                    <span className="font-mono font-black text-black bg-amber-200 px-2 py-0.5 rounded-md">
                      ₹{claim.minOrderValue}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* QR Code Presentation Frame */}
            <div className="bg-[#FBF9F4] p-4 rounded-3xl border-3 border-black shadow-[5px_5px_0px_0px_#000] flex flex-col items-center mb-4 w-full relative">
              {claim.status === "claimed" || redeemSuccess ? (
                <div className="w-[190px] h-[190px] bg-emerald-50 rounded-2xl border-2 border-emerald-400 flex flex-col items-center justify-center p-4 text-center shadow-inner">
                  <span className="text-5xl mb-2">✅</span>
                  <span className="font-black text-xs text-emerald-900 uppercase tracking-wider">OFFER REDEEMED</span>
                  <span className="text-[10px] font-bold text-emerald-700 mt-1">
                    {new Date(claim.claimedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ) : (
                <>
                  <div
                    ref={qrRef}
                    className="w-[190px] h-[190px] bg-white rounded-2xl border-2 border-black/10 flex items-center justify-center p-2 shadow-inner"
                  >
                    <span className="text-2xl animate-pulse">☕</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-2">
                    {isLocked ? "SCAN QR CODE ON NEXT VISIT" : "SCAN AT COUNTER TO REDEEM"}
                  </p>
                </>
              )}
            </div>

            {/* Claim Code Card with One-Tap Copy */}
            <div className="bg-[#FBF9F4] w-full p-3.5 rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] mb-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] font-black uppercase tracking-wider text-black/40 block">
                  Claim Code
                </span>
                <span className="font-mono text-2xl font-black text-[#FF4C29] tracking-wider">
                  {claim.claimCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-black text-white text-xs font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] active:translate-y-[1px] transition-all cursor-pointer"
              >
                {copied ? "COPIED! ✅" : "COPY 📋"}
              </button>
            </div>

            {/* Save to WhatsApp Button: Prevents Ephemeral Tab Trap */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `🎁 Here is my ${claim.storeName || "Cafe"} reward voucher!\n\nReward: ${claim.rewardName}\nCode: ${claim.claimCode}${
                  claim.minOrderValue ? `\nMin Order: ₹${claim.minOrderValue}` : ""
                }${
                  claim.timingMode === "next_visit_retention"
                    ? `\nValid from: ${new Date(claim.validFrom).toLocaleDateString()}`
                    : ""
                }\n\nOpen Voucher Pass:\n${typeof window !== "undefined" ? window.location.href : `https://forstore.app/claim/${claim.claimCode}`}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white border-2 border-black rounded-2xl font-black text-xs shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2 mb-4 hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <span className="text-base">📲</span>
              <span>SAVE VOUCHER TO WHATSAPP</span>
            </a>

            {/* Status / Time Window Badge */}
            {claim.status === "claimed" || redeemSuccess ? (
              <div className="w-full py-3 px-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 flex items-center justify-between mb-4 shadow-[2px_2px_0px_0px_#059669]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <div className="text-left">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 block">Voucher Status</span>
                    <span className="text-xs font-black">CLAIMED AT COUNTER</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block">Redeemed At</span>
                  <span className="font-mono text-xs font-black text-emerald-950">
                    {new Date(claim.claimedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ) : isExpired || claim.status === "expired" ? (
              <div className="w-full py-2.5 px-3 rounded-2xl border-2 border-red-500 bg-red-100 text-red-700 text-xs font-black flex items-center justify-between mb-4 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Voucher Status:</span>
                </div>
                <span className="font-mono font-bold">Validity Window Expired</span>
              </div>
            ) : isLocked ? (
              <div className="w-full py-2.5 px-3 rounded-2xl border-2 border-amber-500 bg-amber-100 text-amber-950 text-xs font-black flex items-center justify-between mb-4 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Unlocks In:</span>
                </div>
                <span className="font-mono font-black">{unlockCountdown || "Tomorrow"}</span>
              </div>
            ) : (
              <div className="w-full py-2.5 px-3 rounded-2xl border-2 border-black text-xs font-black flex items-center justify-between mb-4 shadow-[2px_2px_0px_0px_#000] bg-emerald-100 text-emerald-950 border-emerald-400">
                <div className="flex items-center gap-1.5">
                  <span>⏳</span>
                  <span>{claim.timingMode === "next_visit_retention" ? "Valid For:" : "2-Hour Expiry Window:"}</span>
                </div>
                <span className="font-mono font-black">{timeLeft || "Checking..."}</span>
              </div>
            )}

            {/* Customer & Store Info Details */}
            <div className="w-full bg-white p-3 rounded-xl border border-black/10 text-[11px] font-bold text-black/60 flex flex-col gap-1.5 mb-4 text-left">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  Customer: <strong className="text-black">{claim.customerName}</strong>
                  {claim.status === "pending" && !redeemSuccess && (
                    <button
                      onClick={() => setShowNameModal(true)}
                      className="text-[10px] text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer"
                      title="Customize customer name"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </span>
                <span>Issued: <strong className="text-black">{new Date(claim.earnedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></span>
              </div>
              {(claim.status === "claimed" || redeemSuccess) && (
                <div className="flex justify-between pt-1.5 border-t border-black/5 text-emerald-800">
                  <span>Store: <strong className="text-emerald-950">{claim.storeName}</strong></span>
                  {claim.claimedByStaffName && (
                    <span>Staff: <strong className="text-emerald-950">{claim.claimedByStaffName}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* Status / Staff Action Button */}
            {redeemSuccess || claim.status === "claimed" ? (
              <div className="w-full py-4 bg-emerald-400 text-black border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000] flex flex-col items-center">
                <span className="text-2xl mb-1">✅</span>
                <span>REWARD VERIFIED & REDEEMED!</span>
                <span className="text-[10px] font-bold opacity-80 mt-0.5">
                  Claimed at: {new Date(claim.claimedAt || Date.now()).toLocaleTimeString()}
                  {claim.claimedByStaffName ? ` by ${claim.claimedByStaffName}` : ""}
                </span>
              </div>
            ) : isExpired || claim.status === "expired" ? (
              <div className="w-full py-4 bg-red-400 text-black border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000]">
                ⚠️ VOUCHER EXPIRED
              </div>
            ) : isLocked ? (
              <div className="w-full py-3.5 bg-amber-200 text-amber-950 border-3 border-black rounded-2xl font-black text-xs shadow-[4px_4px_0px_0px_#000] flex flex-col items-center">
                <span className="text-base mb-0.5">🔒 LOCKED: NEXT-VISIT ONLY</span>
                <span className="text-[10px] font-bold opacity-80">
                  Unlocks {new Date(claim.validFrom).toLocaleDateString()} {new Date(claim.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ) : (
              <div className="w-full">
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="w-full py-3.5 bg-[#FF4C29] text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer"
                >
                  {isRedeeming ? "REDEEMING..." : "STAFF: TAP TO VERIFY & REDEEM 🎯"}
                </button>
              </div>
            )}

            <div className="flex gap-4 mt-5">
              <Link
                href="/my-rewards"
                className="text-xs font-bold text-black/50 underline hover:text-black"
              >
                Customer Wallet
              </Link>
              <span className="text-black/20">•</span>
              <Link
                href={claim?.storeSlug ? `/${claim.storeSlug}/claim` : "/claim"}
                className="text-xs font-bold text-black/50 underline hover:text-black"
              >
                Staff Portal
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Customer Name Customization Modal */}
      <CustomerNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={claim?.customerName || ""}
        guestId={claim?.userId || ""}
        onNameSaved={(newName) => {
          setClaim((prev: any) => (prev ? { ...prev, customerName: newName } : null));
        }}
      />
    </div>
  );
}
