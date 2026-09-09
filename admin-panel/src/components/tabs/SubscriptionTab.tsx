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

      {/* Demo to Production Launch Callout Banner */}
      <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-50 border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-[2px_2px_0px_0px_#FF4C29]">
            🚀
          </div>
          <div>
            <h4 className="font-serif font-black text-base text-black">
              Ready to deploy this in your cafe or restaurant?
            </h4>
            <p className="text-xs text-black/70 font-medium">
              Start your 14-day zero-risk live pilot on production or get customized acrylic table standees.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleSelectPlan("Pro Store")}
            className="flex-1 md:flex-none bg-[#FF4C29] text-white hover:bg-[#ff360e] font-black text-xs px-5 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-y-[1px]"
          >
            Deploy for My Venue ↗
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {/* Starter Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col justify-between transition-all ${activePlan === "Starter" ? "border-black shadow-[8px_8px_0px_0px_#10B981]" : "border-black/10"}`}>
          <div>
            <h3 className="font-serif text-2xl font-bold text-black mb-1">Starter</h3>
            <p className="text-sm font-semibold text-black/50 mb-6">Perfect for small kiosks.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-black">₹0</span>
              <span className="text-sm font-bold text-black/50">/mo</span>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> 1 Active Game
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> Basic Scan Analytics
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> 100 Trial Plays
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Starter")}
            className="w-full py-3 rounded-xl border-2 border-black font-bold text-xs hover:bg-neutral-100 transition-colors"
          >
            {activePlan === "Starter" ? "Current Active Plan" : "Choose Starter"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-[#111111] text-white border-4 border-black rounded-3xl p-8 flex flex-col justify-between relative transform md:-translate-y-4 ${activePlan === "Pro Store" ? "shadow-[8px_8px_0px_0px_#FF4C29]" : ""}`}>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4C29] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black">
            {activePlan === "Pro Store" ? "Current Active Plan" : "Most Popular"}
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-white mb-1">Pro Store</h3>
            <p className="text-sm font-semibold text-white/60 mb-6">For growing cafes & retail.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-white">₹2,499</span>
              <span className="text-sm font-bold text-white/50">/mo</span>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29]">✓</span> Unlimited Active Games
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29]">✓</span> Advanced Analytics & Heatmap
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29]">✓</span> Custom Theme Colors & Logo
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <span className="text-[#FF4C29]">✓</span> 1,000 Monthly Plays Included
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Pro Store")}
            className="w-full py-3.5 bg-[#FF4C29] text-white hover:bg-[#ff360e] font-black text-xs rounded-xl border-2 border-white shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-y-[1px]"
          >
            {activePlan === "Pro Store" ? "Active Plan • Upgrade Features ↗" : "Upgrade to Pro (₹2,499/mo) ↗"}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col justify-between transition-all ${activePlan === "Enterprise" ? "border-black shadow-[8px_8px_0px_0px_#332FD0]" : "border-black/10"}`}>
          <div>
            {activePlan === "Enterprise" && (
              <div className="bg-[#332FD0] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black mb-2 self-start inline-block">
                Current Active Plan
              </div>
            )}
            <h3 className="font-serif text-2xl font-bold text-black mb-1">Enterprise</h3>
            <p className="text-sm font-semibold text-black/50 mb-6">Multi-location cafe chains.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-black">₹7,999</span>
              <span className="text-sm font-bold text-black/50">/mo</span>
            </div>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> 100% Watermark Removal
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> Custom Domain & White-Label
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> Multi-Location Dashboard
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
                <span className="text-emerald-500">✓</span> Dedicated WhatsApp Support
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectPlan("Enterprise")}
            className="w-full py-3 bg-[#111111] text-white hover:bg-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform active:translate-y-[1px]"
          >
            {activePlan === "Enterprise" ? "Current Active Plan" : "Deploy Enterprise (₹7,999/mo) ↗"}
          </button>
        </div>
      </div>
    </div>
  );
}
