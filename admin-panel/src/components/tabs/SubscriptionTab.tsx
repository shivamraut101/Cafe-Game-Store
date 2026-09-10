"use client";

import React, { useState, useEffect } from "react";
import { TierLevel } from "../../types";
import { getStoreSubscriptionAction } from "../../app/actions/adminActions";
import { triggerBuyoutModal } from "../DemoBuyoutModal";

interface SubscriptionTabProps {
  storeName?: string;
  currentTier?: TierLevel;
  onTierChange?: (tier: TierLevel) => void;
}

export default function SubscriptionTab({ storeName: currentStoreName, currentTier, onTierChange }: SubscriptionTabProps) {
  const [activePlan, setActivePlan] = useState<string>("Pro Store");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [currentStoreName]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await getStoreSubscriptionAction(currentStoreName);
      if (res.success && res.subscription) {
        setActivePlan(res.subscription.plan || "Pro Store");
      }
    } catch (e) {
      console.error("Failed to load subscription from DB", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planName: string) => {
    triggerBuyoutModal({
      plan: planName,
      source: `subscription_tab_${planName.toLowerCase().replace(/\s+/g, "_")}`,
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-1">Subscription & Plans (Live DB)</h2>
          <p className="text-sm font-semibold text-black/60">
            Active plan for {currentStoreName || "your store"} in MongoDB Atlas.
          </p>
        </div>
        {loading ? (
          <div className="h-9 w-36 bg-emerald-200/60 animate-pulse rounded-xl" />
        ) : (
          <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl border-2 border-emerald-300 font-bold text-xs flex items-center gap-2">
            <span>✨</span> Active Plan: {activePlan}
          </div>
        )}
      </div>

      {/* Promotional Waiver Banner */}
      <div className="bg-gradient-to-r from-amber-200 via-orange-100 to-emerald-100 border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-2xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="bg-[#FF4C29] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-black tracking-wider">
                  🔥 LIMITED LAUNCH PROMOTION · 42/50 VENUES CLAIMED
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Fixed Monthly Fees 100% Waived!
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-black text-black">
                Zero Monthly Subscription Fee • All Plans on Pure Pay-Per-Play
              </h3>
              <p className="text-xs sm:text-sm text-black/80 font-semibold mt-1 max-w-2xl leading-relaxed">
                During this promotional launch, both <strong>Pro Store (normally ₹2,499/mo)</strong> and <strong>Enterprise (normally ₹7,999/mo)</strong> monthly subscription fees are reduced to <strong className="text-emerald-700 underline decoration-2">₹0 /month</strong>! You never pay fixed software fees—you only pay dynamic credits (from ~₹0.11/credit) when an actual customer at your tables plays a game.
              </p>
              <div className="mt-2 text-xs font-black text-red-600 flex items-center gap-1.5">
                <span>⏳</span>
                <span>Hurry! Lock in the ₹0/mo lifetime exemption before standard monthly subscription billing goes live for upcoming venues.</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Pro Store")}
            className="w-full lg:w-auto bg-black text-white hover:bg-[#FF4C29] font-black text-xs px-6 py-3.5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#FF4C29] transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            Claim ₹0/mo Plan (Lock In Today) 🚀
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {/* Starter Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col justify-between transition-all ${activePlan === "Starter" ? "border-black shadow-[8px_8px_0px_0px_#10B981]" : "border-black/10"}`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-2xl font-bold text-black">Starter</h3>
              <span className="text-[10px] font-black bg-black/5 text-black/60 px-2.5 py-0.5 rounded-full border border-black/10">FREE FOREVER</span>
            </div>
            <p className="text-sm font-semibold text-black/50 mb-4">Perfect for small kiosks.</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-black text-black">₹0</span>
              <span className="text-sm font-bold text-black/50">/mo</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-700 mb-6">
              100% Pure Pay-Per-Play (Dynamic Fuel Credits)
            </p>
            
            <div className="flex flex-col gap-3.5 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> 1 Active Game
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> Basic Scan Analytics
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> 1,500 Welcome Bonus Credits Included
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> Anti-Abuse Shield (Cap 10/day)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Starter")}
            className="w-full py-3 rounded-xl border-2 border-black font-bold text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {activePlan === "Starter" ? "Current Active Plan" : "Choose Starter (₹0/mo)"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-[#111111] text-white border-4 border-black rounded-3xl p-8 flex flex-col justify-between relative transform md:-translate-y-4 ${activePlan === "Pro Store" ? "shadow-[8px_8px_0px_0px_#FF4C29]" : "shadow-[6px_6px_0px_0px_#000]"}`}>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4C29] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
            🔥 FOUNDER OFFER: ₹0/MO
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-2xl font-bold text-white">Pro Store</h3>
              <span className="text-[10px] font-black bg-emerald-400 text-black px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                100% WAIVED
              </span>
            </div>
            <p className="text-sm font-semibold text-white/60 mb-4">For growing cafes & busy venues.</p>
            
            {/* Strikethrough Promotional Pricing */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold line-through text-white/40">₹2,499</span>
              <span className="text-4xl font-black text-emerald-400">₹0</span>
              <span className="text-sm font-bold text-white/70">/mo</span>
            </div>
            <p className="text-[11px] font-bold text-amber-300 mb-6">
              ⚡ Limited Cohort: Monthly fee waived! Pure Pay-Per-Play (Dynamic Credits).
            </p>
            
            <div className="flex flex-col gap-3.5 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29] font-bold">✓</span> Up to 8 Active Games
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29] font-bold">✓</span> Custom Cafe Branding & Logo
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29] font-bold">✓</span> Printable QR Table Stand Studio
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29] font-bold">✓</span> Staff Counter PIN Access (/claim)
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29] font-bold">✓</span> 12,500 Bonus Game Fuel Credits Included
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Pro Store")}
            className="w-full py-3.5 bg-[#FF4C29] text-white hover:bg-[#ff360e] font-black text-xs rounded-xl border-2 border-white shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-y-[1px] cursor-pointer"
          >
            Claim Pro at ₹0/mo (Lock In Now) ↗
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col justify-between transition-all ${activePlan === "Enterprise" ? "border-black shadow-[8px_8px_0px_0px_#332FD0]" : "border-black/10"}`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-2xl font-bold text-black">Enterprise</h3>
              <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">
                100% WAIVED
              </span>
            </div>
            <p className="text-sm font-semibold text-black/50 mb-4">Multi-location cafe chains & QSRs.</p>

            {/* Strikethrough Promotional Pricing */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold line-through text-black/40">₹7,999</span>
              <span className="text-4xl font-black text-emerald-600">₹0</span>
              <span className="text-sm font-bold text-black/50">/mo</span>
            </div>
            <p className="text-[11px] font-bold text-purple-700 mb-6">
              ⚡ Limited Cohort: Monthly fee waived! Pure Pay-Per-Play (Dynamic Credits).
            </p>
            
            <div className="flex flex-col gap-3.5 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> Unlimited Active Campaigns
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> 100% Clean White-Label (No Watermark)
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> Multi-Location Master Dashboard
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> Custom Domain & Dedicated SSL
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500 font-bold">✓</span> 45,000 Bonus Game Fuel Credits Included
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Enterprise")}
            className="w-full py-3 bg-[#111111] text-white hover:bg-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-y-[1px] cursor-pointer"
          >
            Claim Enterprise at ₹0/mo (Lock In Now) ↗
          </button>
        </div>
      </div>
    </div>
  );
}
