"use client";

import React, { useState, useEffect } from "react";
import { triggerBuyoutModal } from "./DemoBuyoutModal";
import { recordProspectIntentAction } from "../app/actions/prospectActions";

export function triggerStoryboardModal(initialScene: number = 0) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("forstore:open-storyboard", {
        detail: { initialScene },
      })
    );
  }
}

export default function DemoStoryboardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ initialScene?: number }>;
      const scene = customEvent.detail?.initialScene || 0;
      setActiveScene(scene);
      setIsOpen(true);

      const visId = localStorage.getItem("forstore_visitor_id") || "anonymous_prospect";
      recordProspectIntentAction({
        visitorId: visId,
        action: "storyboard_modal_opened",
        metadata: `Scene: ${scene + 1}`,
      }).catch(() => {});
    };

    window.addEventListener("forstore:open-storyboard", handleOpen);
    return () => window.removeEventListener("forstore:open-storyboard", handleOpen);
  }, []);

  if (!isOpen) return null;

  const scenes = [
    {
      id: "customer",
      stepNumber: "01",
      actor: "Table 4 Customer",
      avatar: "🥐",
      tagline: "Turn Awkward Wait Time Into Addictive Gameplay",
      realityHeadline: "Waiting 12 minutes for food is boring.",
      realityBody:
        "Customers stare blankly at Instagram or leave negative reviews when orders take time. Paper loyalty stamp cards get lost in their wallets.",
      forstoreHeadline: "Instant Web Play • 0 App Download",
      forstoreBody:
        "Customer scans the acrylic QR stand on Table 4 with their phone camera. No App Store download required. They play a 20-second game (Neon Air Hockey, Spin the Wheel, Tap War) and win a '15% Off Next Croissant' perk.",
      highlightStat: "+40% Table Retention",
      statDetail: "Transforms dead table time into active delight and captures customer phone numbers for repeat broadcasts.",
      actionLabel: "Test Step 1: Open Customer Arcade 🎮",
      actionHref: "/arcade",
      badgeColor: "bg-amber-400 text-black",
      accentBg: "bg-amber-100",
      accentBorder: "border-amber-400",
    },
    {
      id: "barista",
      stepNumber: "02",
      actor: "Counter Barista / Staff",
      avatar: "☕",
      tagline: "2-Second Voucher Redemption • Zero POS Headaches",
      realityHeadline: "Complex loyalty software slows down queues.",
      realityBody:
        "Cashiers hate slow software, barcode scanners that fail, and multi-step voucher inputs that cause customer lines to back up out the door.",
      forstoreHeadline: "Instant PIN Verification (Counter PIN: 1234)",
      forstoreBody:
        "Customer shows their 4-digit voucher or QR code on their phone screen. The barista opens /claim on any counter tablet, smartphone, or billing browser, enters PIN 1234, and taps Redeem. Done in 2 seconds flat.",
      highlightStat: "2-Sec Counter Speed",
      statDetail: "Zero POS integration needed. Staff cannot give unauthorized discounts. Works on any browser or phone.",
      actionLabel: "Test Step 2: Open Counter Claim (/claim) ☕",
      actionHref: "/claim",
      badgeColor: "bg-blue-600 text-white",
      accentBg: "bg-blue-100",
      accentBorder: "border-blue-400",
    },
    {
      id: "owner",
      stepNumber: "03",
      actor: "Cafe Owner (Closing Time)",
      avatar: "📈",
      tagline: "Unstoppable Repeat Visits & Pure Profit Economics",
      realityHeadline: "Traditional marketing is an expensive black hole.",
      realityBody:
        "Printing paper flyers, billboard ads, and Instagram boosts cost thousands with zero trackable footfall or measurable repeat visits.",
      forstoreHeadline: "Dynamic Fuel Credits • Reap ₹14,200 in Upsells",
      forstoreBody:
        "At 11 PM closing, open /admin. See: 84 games played today, 32 dessert upsells generated, ₹14,200 added ticket revenue. You only paid ~₹120 in dynamic wallet credits. Plus, 42 customer phone numbers collected for weekend WhatsApp campaigns.",
      highlightStat: "Fuel Credit Economics",
      statDetail: "Only pay micro fuel credits when customers actually play. High-margin upsells (desserts and sides) drive instant cafe profit.",
      actionLabel: "Test Step 3: Open Owner Dashboard (/admin) 🚀",
      actionHref: "/admin",
      badgeColor: "bg-emerald-600 text-white",
      accentBg: "bg-emerald-100",
      accentBorder: "border-emerald-400",
    },
  ];

  const current = scenes[activeScene];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 text-left">
      <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl max-w-2xl w-full shadow-[8px_8px_0px_0px_#000] relative overflow-hidden my-4">
        {/* Header Banner */}
        <div className="bg-black text-white p-4 sm:p-5 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#FF4C29] text-white text-[9px] font-black uppercase rounded tracking-wider">
                  60-Second Storyboard
                </span>
                <span className="text-white/60 text-xs font-semibold">How ForStore Multiplies Cafe Profit</span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-black text-white mt-0.5">
                The 3-Step Cafe Customer Loop
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white text-black border-2 border-black font-black text-sm flex items-center justify-center hover:bg-[#FF4C29] hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#FF4C29]"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scene Navigation Tabs */}
        <div className="grid grid-cols-3 bg-[#E5E0D8] border-b-3 border-black divide-x-2 divide-black">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => {
                setActiveScene(idx);
                const visId = localStorage.getItem("forstore_visitor_id") || "anonymous_prospect";
                recordProspectIntentAction({
                  visitorId: visId,
                  action: "storyboard_tab_switched",
                  metadata: `Switched to Scene ${idx + 1}: ${scene.actor}`,
                }).catch(() => {});
              }}
              className={`py-3 px-2 sm:px-4 text-center transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeScene === idx
                  ? "bg-white text-black font-black shadow-[inset_0_-3px_0_0_#FF4C29]"
                  : "text-black/60 font-bold hover:bg-white/50 hover:text-black"
              }`}
            >
              <span className="text-base sm:text-lg">{scene.avatar}</span>
              <span className="text-[11px] sm:text-xs truncate">
                <span className="hidden sm:inline font-mono opacity-60 mr-1">{scene.stepNumber}.</span>
                {scene.actor}
              </span>
            </button>
          ))}
        </div>

        {/* Active Scene Content */}
        <div className="p-5 sm:p-7 space-y-5">
          {/* Subtitle / Role Tag */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${current.badgeColor} border-2 border-black shadow-[2px_2px_0px_0px_#000]`}>
              Step {current.stepNumber} · {current.actor}
            </span>
            <span className="text-xs font-bold text-black/60 italic">{current.tagline}</span>
          </div>

          {/* Comparison Cards: The Old Way vs The ForStore Loop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* The Old Reality */}
            <div className="bg-red-50 border-3 border-red-300 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#FCA5A5] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">❌</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-700">The Old Problem</span>
                </div>
                <h4 className="font-serif font-black text-sm text-red-950 leading-snug">{current.realityHeadline}</h4>
                <p className="text-xs text-red-900/80 font-semibold mt-1.5 leading-relaxed">{current.realityBody}</p>
              </div>
            </div>

            {/* The ForStore Solution */}
            <div className="bg-emerald-50 border-3 border-emerald-400 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#34D399] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">⚡</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    The ForStore Engine
                  </span>
                </div>
                <h4 className="font-serif font-black text-sm text-emerald-950 leading-snug">
                  {current.forstoreHeadline}
                </h4>
                <p className="text-xs text-emerald-900/90 font-semibold mt-1.5 leading-relaxed">
                  {current.forstoreBody}
                </p>
              </div>
            </div>
          </div>

          {/* Stat Callout Banner */}
          <div className={`p-3.5 rounded-2xl border-2 border-black flex items-center justify-between gap-3 ${current.accentBg} ${current.accentBorder}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{current.avatar}</span>
              <div>
                <span className="font-black text-xs text-black block">{current.highlightStat}</span>
                <span className="text-[11px] font-semibold text-black/70 leading-tight block">
                  {current.statDetail}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-black/10">
            {/* Live Sandbox Teleport Button */}
            <a
              href={current.actionHref}
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto py-3 px-5 bg-black text-white rounded-xl border-2 border-black font-black text-xs shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[-1px] transition-transform text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{current.actionLabel}</span>
            </a>

            {/* Stepper Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {activeScene > 0 && (
                <button
                  onClick={() => setActiveScene(activeScene - 1)}
                  className="py-2.5 px-3 bg-white text-black border-2 border-black rounded-xl font-bold text-xs hover:bg-black/5 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}

              {activeScene < scenes.length - 1 ? (
                <button
                  onClick={() => setActiveScene(activeScene + 1)}
                  className="py-2.5 px-4 bg-[#FF4C29] text-white border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next: {scenes[activeScene + 1].actor}</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    triggerBuyoutModal({ plan: "Pro Store", source: "storyboard_finish" });
                  }}
                  className="py-2.5 px-4 bg-emerald-500 text-black border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚀 Launch 14-Day Free Pilot</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Conversion Bar */}
        <div className="bg-[#EFECE6] p-3 px-5 border-t-3 border-black flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-black">✦ Free Pilot Package:</span>
            <span className="font-semibold text-black/70">10 Free Acrylic Standees + 14-Day Live Trial</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/919749694882?text=Hi%20Shivam!%20I%20went%20through%20the%20ForStore%20Storyboard%20and%20want%20to%20claim%20the%20free%20standees%20%2B%2014-day%20trial%20for%20my%20cafe."
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-black hover:text-[#FF4C29] flex items-center gap-1"
            >
              <span>💬</span> WhatsApp: +91 97496 94882
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
