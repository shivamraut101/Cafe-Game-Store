"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getClientAppEnvironment } from "../lib/appEnv";
import { triggerStoryboardModal } from "./DemoStoryboardModal";
import { triggerBuyoutModal } from "./DemoBuyoutModal";
import { recordProspectIntentAction } from "../app/actions/prospectActions";

interface QuestProgress {
  step1_played: boolean;
  step2_redeemed: boolean;
  step3_reviewed: boolean;
}

const STORAGE_KEY = "forstore_cafe_quest_v1";

export default function DemoQuestWidget() {
  const pathname = usePathname();
  const [isDemo, setIsDemo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState<QuestProgress>({
    step1_played: false,
    step2_redeemed: false,
    step3_reviewed: false,
  });

  // Check demo environment & load stored progress
  useEffect(() => {
    const env = getClientAppEnvironment();
    if (env !== "demo" && env !== "dev") {
      setIsDemo(false);
      return;
    }
    setIsDemo(true);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch {}

    // Auto-expand for first-time visitors after 3.5 seconds
    const seenQuest = localStorage.getItem("forstore_quest_seen");
    if (!seenQuest) {
      const timer = setTimeout(() => {
        setIsExpanded(true);
        localStorage.setItem("forstore_quest_seen", "true");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-detect step completions based on current page URL
  useEffect(() => {
    if (!isDemo || !pathname) return;

    setProgress((prev) => {
      let updated = { ...prev };
      let changed = false;

      // Detect Customer Step (Arcade or Games)
      if (pathname.startsWith("/arcade") || pathname.startsWith("/play")) {
        if (!updated.step1_played) {
          updated.step1_played = true;
          changed = true;
          logStep("quest_step1_customer_completed", "Table Arcade Visited");
        }
      }

      // Detect Staff Barista Step (Counter claim)
      if (pathname.startsWith("/claim")) {
        if (!updated.step2_redeemed) {
          updated.step2_redeemed = true;
          changed = true;
          logStep("quest_step2_staff_completed", "Staff Claim Counter Visited");
        }
      }

      // Detect Cafe Owner Step (Admin dashboard)
      if (pathname.startsWith("/admin")) {
        if (!updated.step3_reviewed) {
          updated.step3_reviewed = true;
          changed = true;
          logStep("quest_step3_owner_completed", "Admin Revenue Portal Visited");
        }
      }

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}

        if (updated.step1_played && updated.step2_redeemed && updated.step3_reviewed) {
          logStep("quest_fully_completed", "Prospect mastered 3-step cafe simulation");
        }
      }

      return changed ? updated : prev;
    });
  }, [pathname, isDemo]);

  const logStep = (action: string, metadata: string) => {
    const visId = localStorage.getItem("forstore_visitor_id") || "anonymous_prospect";
    recordProspectIntentAction({
      visitorId: visId,
      action,
      metadata,
    }).catch(() => {});
  };

  const toggleStep = (stepKey: keyof QuestProgress) => {
    setProgress((prev) => {
      const updated = { ...prev, [stepKey]: !prev[stepKey] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      if (updated[stepKey]) {
        logStep(`quest_${stepKey}_manual_check`, "Manual step toggle");
      }

      if (updated.step1_played && updated.step2_redeemed && updated.step3_reviewed) {
        logStep("quest_fully_completed", "Prospect finished all 3 steps");
      }

      return updated;
    });
  };

  if (!isDemo) return null;

  const completedCount =
    (progress.step1_played ? 1 : 0) +
    (progress.step2_redeemed ? 1 : 0) +
    (progress.step3_reviewed ? 1 : 0);

  const isAllCompleted = completedCount === 3;

  return (
    <aside
      aria-label="Cafe Simulation Quest Assistant"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      {!isExpanded ? (
        /* Collapsed Floating Pill */
        <div className="flex items-center gap-2">
          {/* Quick Storyboard Launcher Button */}
          <button
            onClick={() => triggerStoryboardModal(0)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-white text-black border-2 border-black rounded-full font-bold text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer"
            title="Open 60-Second Storyboard"
          >
            <span>📖</span>
            <span>Storyboard</span>
          </button>

          {/* Main Quest Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className={`group flex items-center gap-2.5 px-4 py-2.5 text-white border-3 border-black rounded-full font-bold text-xs shadow-[4px_4px_0px_0px_#000] hover:translate-y-[-1px] transition-all cursor-pointer ${
              isAllCompleted
                ? "bg-emerald-600 shadow-[4px_4px_0px_0px_#10B981]"
                : "bg-black shadow-[4px_4px_0px_0px_#FF4C29]"
            }`}
            title="Open 3-Step Cafe Simulation Quest"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isAllCompleted ? "bg-amber-300 animate-ping" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-black tracking-wide">
              {isAllCompleted ? "🎉 Pilot Kit Unlocked!" : "🎯 Cafe Simulator"}
            </span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold">
              {completedCount}/3
            </span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform text-white/70">
              ▲
            </span>
          </button>
        </div>
      ) : (
        /* Expanded Quest Card */
        <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl p-5 max-w-sm sm:max-w-md w-[92vw] sm:w-[380px] shadow-[8px_8px_0px_0px_#000] text-left animate-in zoom-in-95 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <h3 className="font-serif font-black text-sm text-black leading-tight">
                  3-Step Cafe Simulation
                </h3>
                <p className="text-[10px] text-black/60 font-semibold">
                  Test the complete loop before launching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerStoryboardModal(0)}
                className="px-2 py-1 bg-white text-black border border-black rounded-lg font-bold text-[10px] hover:bg-black/5 transition-colors cursor-pointer flex items-center gap-1"
                title="View 60s Storyboard"
              >
                <span>📖</span>
                <span>Story</span>
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 rounded-full bg-white text-black border border-black font-black text-xs flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="my-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-black/70 mb-1">
              <span>Simulation Progress</span>
              <span className="font-mono text-black font-black">{completedCount} of 3 Complete</span>
            </div>
            <div className="w-full h-2.5 bg-black/10 rounded-full border border-black overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAllCompleted ? "bg-emerald-500" : "bg-[#FF4C29]"
                }`}
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* 3 Step Cards */}
          <div className="space-y-2.5 my-3">
            {/* Step 1: Customer View */}
            <div
              className={`p-3 rounded-2xl border-2 border-black transition-all flex items-start gap-2.5 ${
                progress.step1_played
                  ? "bg-emerald-50/90 border-emerald-500 shadow-[2px_2px_0px_0px_#10B981]"
                  : "bg-white shadow-[2px_2px_0px_0px_#000]"
              }`}
            >
              <button
                onClick={() => toggleStep("step1_played")}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 border-black flex items-center justify-center text-xs font-black shrink-0 cursor-pointer ${
                  progress.step1_played ? "bg-emerald-500 text-white" : "bg-white hover:bg-black/5"
                }`}
                title="Toggle completed"
              >
                {progress.step1_played ? "✓" : ""}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-black">1. Play as Table Customer</span>
                  <a
                    href="/arcade"
                    className="text-[10px] font-black text-[#FF4C29] hover:underline shrink-0"
                  >
                    Open Arcade →
                  </a>
                </div>
                <p className="text-[11px] text-black/60 font-semibold mt-0.5 leading-snug">
                  Experience the 20s mobile web game with 0 app download.
                </p>
              </div>
            </div>

            {/* Step 2: Barista Counter View */}
            <div
              className={`p-3 rounded-2xl border-2 border-black transition-all flex items-start gap-2.5 ${
                progress.step2_redeemed
                  ? "bg-emerald-50/90 border-emerald-500 shadow-[2px_2px_0px_0px_#10B981]"
                  : "bg-white shadow-[2px_2px_0px_0px_#000]"
              }`}
            >
              <button
                onClick={() => toggleStep("step2_redeemed")}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 border-black flex items-center justify-center text-xs font-black shrink-0 cursor-pointer ${
                  progress.step2_redeemed ? "bg-emerald-500 text-white" : "bg-white hover:bg-black/5"
                }`}
                title="Toggle completed"
              >
                {progress.step2_redeemed ? "✓" : ""}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-black">2. Test 2-Sec Staff Claim</span>
                  <a
                    href="/claim"
                    className="text-[10px] font-black text-[#2563EB] hover:underline shrink-0"
                  >
                    Test PIN 1234 →
                  </a>
                </div>
                <p className="text-[11px] text-black/60 font-semibold mt-0.5 leading-snug">
                  See how staff burns vouchers on counter phone with PIN 1234.
                </p>
              </div>
            </div>

            {/* Step 3: Owner ROI View */}
            <div
              className={`p-3 rounded-2xl border-2 border-black transition-all flex items-start gap-2.5 ${
                progress.step3_reviewed
                  ? "bg-emerald-50/90 border-emerald-500 shadow-[2px_2px_0px_0px_#10B981]"
                  : "bg-white shadow-[2px_2px_0px_0px_#000]"
              }`}
            >
              <button
                onClick={() => toggleStep("step3_reviewed")}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 border-black flex items-center justify-center text-xs font-black shrink-0 cursor-pointer ${
                  progress.step3_reviewed ? "bg-emerald-500 text-white" : "bg-white hover:bg-black/5"
                }`}
                title="Toggle completed"
              >
                {progress.step3_reviewed ? "✓" : ""}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-black">3. Review Owner Profit</span>
                  <a
                    href="/admin"
                    className="text-[10px] font-black text-emerald-600 hover:underline shrink-0"
                  >
                    View Admin →
                  </a>
                </div>
                <p className="text-[11px] text-black/60 font-semibold mt-0.5 leading-snug">
                  Inspect ₹48,700 live sales lift, customer phones & dynamic credit fuel wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Completion Card */}
          {isAllCompleted ? (
            <div className="bg-emerald-100 border-2 border-emerald-600 rounded-2xl p-3.5 shadow-[2px_2px_0px_0px_#000] text-center space-y-2">
              <span className="text-2xl block">🎉</span>
              <h4 className="font-serif font-black text-xs text-emerald-950">
                You Mastered The Cafe Simulation!
              </h4>
              <p className="text-[11px] font-semibold text-emerald-900 leading-tight">
                Unlock your <strong>Free Venue Pilot Kit</strong> (10 Free Acrylic Table QR Stands + 14-Day Live Trial).
              </p>
              <div className="pt-1 flex gap-2 justify-center">
                <button
                  onClick={() => triggerBuyoutModal({ plan: "Pro Store", source: "quest_complete" })}
                  className="py-2 px-3 bg-black text-white text-[11px] font-black rounded-xl border border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[-1px] transition-transform cursor-pointer"
                >
                  🚀 Claim Free Pilot Kit →
                </button>
                <a
                  href="https://wa.me/919749694882?text=Hi%20Shivam!%20I%20completed%20the%203-step%20cafe%20simulation%20on%20demo.curaflowstudio.com%20and%20want%20to%20claim%20the%20free%20pilot%20kit%20for%20my%20cafe."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-white text-black text-[11px] font-bold rounded-xl border border-black hover:bg-black/5 transition-colors flex items-center gap-1"
                >
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-black/60">
              <button
                onClick={() => triggerStoryboardModal(0)}
                className="hover:text-black underline cursor-pointer"
              >
                Need help? Watch 60s Storyboard
              </button>
              <button
                onClick={() => triggerBuyoutModal({ plan: "Pro Store", source: "quest_footer" })}
                className="text-[#FF4C29] font-black hover:underline cursor-pointer"
              >
                Skip & Launch Trial →
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
