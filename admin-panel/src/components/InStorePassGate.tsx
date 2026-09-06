"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { verifyStoreKey, saveClientInStoreSession, getNextRotationMs } from "../lib/storeAccessPass";

interface InStorePassGateProps {
  storeSlug: string;
  storeName?: string;
  tableNumber?: string;
  onUnlocked: () => void;
}

export default function InStorePassGate({
  storeSlug,
  storeName = "Cafe & Arcade",
  tableNumber = "",
  onUnlocked,
}: InStorePassGateProps) {
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState("");
  const [showScanHelp, setShowScanHelp] = useState(false);

  // Live countdown timer until next 3-hour rotation
  useEffect(() => {
    const updateCountdown = () => {
      const ms = getNextRotationMs();
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      setTimeLeftStr(`${hours}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualUnlock = () => {
    setErrorMsg("");
    if (!manualCode.trim()) {
      setErrorMsg("Please enter the code from your table or counter receipt.");
      return;
    }

    const formatted = manualCode.trim().toUpperCase().startsWith("CAFE-")
      ? manualCode.trim().toUpperCase()
      : `CAFE-${manualCode.trim().toUpperCase()}`;

    const { valid } = verifyStoreKey(storeSlug, formatted);
    if (valid) {
      saveClientInStoreSession(storeSlug, formatted);
      onUnlocked();
    } else {
      setErrorMsg("That code has expired or is invalid. Please scan the live QR code on your table stand!");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] text-center flex flex-col items-center gap-4">
        
        {/* Top Cafe Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#FF4C29] text-white text-[11px] font-black uppercase rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          <span>☕</span>
          <span>EXCLUSIVE IN-STORE ARCADE</span>
        </div>

        {/* Cafe Mascot / Icon Visual */}
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl border-3 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-4xl animate-bounce">
          🏷️
        </div>

        {/* Title & Store Heading */}
        <div>
          <h2 className="font-serif text-2xl font-black text-black">
            Fresh Table Pass Required!
          </h2>
          <p className="text-xs font-bold text-[#FF4C29] mt-1">
            {storeName} {tableNumber ? `• ${tableNumber}` : ""}
          </p>
          <p className="text-xs text-black/65 font-medium mt-2 leading-relaxed">
            To keep table perks hot and exclusive, our arcade passes and instant discounts <strong>refresh every 3 hours</strong> inside the cafe.
          </p>
        </div>

        {/* Enticing Cafe Rewards Teaser Box */}
        <div className="w-full bg-[#FFFDF9] border-2 border-black/20 rounded-2xl p-4 text-left flex flex-col gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-black/50 block">
            WHAT’S WAITING FOR YOU AT THE CAFE:
          </span>
          <div className="flex items-center gap-2.5 text-xs font-bold text-black">
            <span className="text-base">🎁</span>
            <span>Win 10% – 20% Off Vouchers on your food & drinks</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-black">
            <span className="text-base">🕹️</span>
            <span>9 Unlimited Mini-Games (Air Hockey, Tower Stack & more)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-bold text-black">
            <span className="text-base">⏳</span>
            <span>Perks rotate in: <strong className="font-mono text-[#FF4C29]">{timeLeftStr || "3h 00m"}</strong></span>
          </div>
        </div>

        {/* Primary Call to Action: Scan Table QR */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => setShowScanHelp(!showScanHelp)}
            className="w-full py-4 bg-[#10B981] hover:bg-emerald-400 text-black font-black text-sm uppercase rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>I'M AT THE CAFE: SCAN TABLE QR 📷</span>
          </button>

          {showScanHelp && (
            <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-2xl text-left text-xs font-medium text-black/80 animate-fade-in flex flex-col gap-1">
              <p className="font-bold text-black flex items-center gap-1.5">
                <span>📍</span> Seated at {storeName}?
              </p>
              <p className="text-[11px] leading-relaxed">
                Simply open your phone's camera and point it at the <strong>QR code stand on your table</strong> or at the order counter. It will instantly unlock all games and table discounts!
              </p>
            </div>
          )}
        </div>

        {/* Optional Manual Code Entry Fallback */}
        <div className="w-full pt-1">
          {!showCodeInput ? (
            <button
              onClick={() => setShowCodeInput(true)}
              className="text-xs text-black/60 hover:text-black font-bold underline cursor-pointer"
            >
              Have a table code from staff or receipt? Enter here 🔑
            </button>
          ) : (
            <div className="bg-[#F8F6F0] p-3 rounded-2xl border-2 border-black flex flex-col gap-2 animate-fade-in">
              <label className="text-[10px] font-black uppercase text-black/70 text-left">
                Enter In-Store / Table Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManualUnlock();
                  }}
                  placeholder="e.g. CAFE-XXXXXX or code"
                  className="flex-1 px-3 py-2 bg-white text-black font-mono font-bold text-xs border-2 border-black rounded-xl uppercase"
                />
                <button
                  onClick={handleManualUnlock}
                  className="px-4 py-2 bg-black text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] cursor-pointer"
                >
                  Unlock
                </button>
              </div>
              {errorMsg && (
                <p className="text-[10px] font-bold text-red-600 text-left">⚠️ {errorMsg}</p>
              )}
            </div>
          )}
        </div>

        {/* Secondary Navigation */}
        <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-black/10 text-xs font-bold text-black/60">
          <Link href="/my-rewards" className="hover:text-black underline">
            My Rewards Wallet 🎁
          </Link>
          <span>•</span>
          <span className="text-black/40">Drop by {storeName} for live perks</span>
        </div>

      </div>
    </div>
  );
}
