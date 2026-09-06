"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { redeemRewardVoucherAction } from "../actions/gameActions";
import { downloadCSV } from "../../lib/csvExport";

interface RedeemedRecord {
  claimCode: string;
  rewardName: string;
  customerName: string;
  redeemedAt: string;
}

export default function StaffVoucherLookupPortal() {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Shift Redemption History
  const [recentRedemptions, setRecentRedemptions] = useState<RedeemedRecord[]>([]);

  // Load recent redemptions from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("forstore_recent_redemptions");
      if (saved) {
        setRecentRedemptions(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const addRecentRedemption = (record: RedeemedRecord) => {
    const updated = [record, ...recentRedemptions.slice(0, 9)];
    setRecentRedemptions(updated);
    try {
      sessionStorage.setItem("forstore_recent_redemptions", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleExportShiftCSV = () => {
    if (recentRedemptions.length === 0) return;
    const headers = ["Claim Code", "Reward Name", "Customer Name", "Redeemed Time"];
    const rows = recentRedemptions.map((r) => [
      r.claimCode,
      r.rewardName,
      r.customerName,
      r.redeemedAt,
    ]);
    downloadCSV(`Shift_Redemptions_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const executeLookup = async (codeToLookup: string) => {
    let formatted = codeToLookup.trim().toUpperCase();
    if (!formatted) return;
    if (!formatted.startsWith("BRW-")) formatted = `BRW-${formatted}`;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setClaimData(null);

    try {
      const res = await fetch(`/api/rewards/claim?code=${formatted}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Voucher code not found in system.");
      } else {
        setClaimData(data.claim);
      }
    } catch {
      setError("Network error looking up voucher code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(inputCode);
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
        
        addRecentRedemption({
          claimCode: claimData.claimCode,
          rewardName: claimData.rewardName,
          customerName: claimData.customerName,
          redeemedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        if (typeof window !== "undefined" && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 200]);
        }
      }
    } catch {
      setError("Failed to process redemption.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Camera Scanner ──────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check for BarcodeDetector API
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(scanInterval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(scanInterval);
              stopCamera();

              // Extract code from URL if full URL is scanned
              let extractedCode = rawValue;
              if (rawValue.includes("/claim/")) {
                const parts = rawValue.split("/claim/");
                extractedCode = parts[parts.length - 1];
              }
              setInputCode(extractedCode.replace(/^BRW-/i, ""));
              executeLookup(extractedCode);
            }
          } catch {
            // Frame detection error, continue loop
          }
        }, 300);
      }
    } catch (err: any) {
      setCameraError("Camera permission denied or camera unavailable on this device.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return "Expired (2h limit reached)";
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
        
        {/* Header Badge */}
        <div className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] mb-4">
          STAFF COUNTER REDEMPTION PORTAL
        </div>

        <h1 className="font-serif text-2xl font-black text-black mb-1">Verify Customer Voucher</h1>
        <p className="text-xs font-semibold text-black/60 mb-5">
          Scan QR or enter claim code to verify 2-hour window and mark redeemed.
        </p>

        {/* Action Buttons: Camera & Input Form */}
        <div className="w-full flex gap-2 mb-4">
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 py-3 bg-amber-400 text-black border-2 border-black rounded-2xl font-black text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>📷</span>
            <span>SCAN QR CODE</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="w-full flex flex-col gap-3 mb-5">
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
            {loading ? "SEARCHING DATABASE..." : "LOOKUP VOUCHER 🔍"}
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
          <div className="w-full bg-[#FBF9F4] border-3 border-black rounded-2xl p-4 text-left shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 mb-5">
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
                type="button"
                onClick={handleRedeem}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-400 text-black border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer mt-1"
              >
                VERIFY & MARK REDEEMED ✅
              </button>
            )}
          </div>
        )}

        {/* Shift Recent Redemptions Table */}
        {recentRedemptions.length > 0 && (
          <div className="w-full border-t-2 border-black/10 pt-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-black/40">
                Recent Shift Redemptions ({recentRedemptions.length})
              </h4>
              <button
                type="button"
                onClick={handleExportShiftCSV}
                className="text-[10px] font-bold text-black bg-[#FBF9F4] border border-black px-2 py-0.5 rounded-lg hover:bg-black/5 shadow-[1px_1px_0px_0px_#000] cursor-pointer"
              >
                📥 Export CSV
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {recentRedemptions.map((r, i) => (
                <div
                  key={i}
                  className="bg-[#FBF9F4] p-2 rounded-xl border border-black/10 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-black text-[#FF4C29] mr-2">{r.claimCode}</span>
                    <span className="font-bold text-black/80">{r.rewardName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-black/50">{r.redeemedAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/arcade"
          className="text-xs font-bold text-black/40 underline mt-5 hover:text-black"
        >
          Back to Arcade Website
        </Link>
      </main>

      {/* Camera Scanner Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border-4 border-black rounded-3xl p-5 flex flex-col items-center shadow-[8px_8px_0px_0px_#FF4C29]">
            <h3 className="font-serif text-lg font-black text-black mb-1">Scan Voucher QR</h3>
            <p className="text-xs text-black/60 mb-3">Align customer&apos;s voucher QR in the frame</p>

            {cameraError ? (
              <div className="w-full bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold mb-4">
                ⚠️ {cameraError}
              </div>
            ) : (
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-3 border-black mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Target overlay reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-white/80 rounded-xl pointer-events-none animate-pulse" />
              </div>
            )}

            <button
              type="button"
              onClick={stopCamera}
              className="w-full py-3 bg-black text-white border-2 border-black rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_#000] cursor-pointer"
            >
              CLOSE SCANNER ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
