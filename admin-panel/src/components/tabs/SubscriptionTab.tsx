"use client";

import React, { useState, useEffect } from "react";
import { TierLevel } from "../../types";
import { getStoreSubscriptionAction } from "../../app/actions/adminActions";

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

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-1">Subscription Plan (Live DB)</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Starter Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col transition-all ${activePlan === "Starter" ? "border-black shadow-[8px_8px_0px_0px_#10B981]" : "border-black/10"}`}>
          <h3 className="font-serif text-2xl font-bold text-black mb-1">Starter</h3>
          <p className="text-sm font-semibold text-black/50 mb-6">Perfect for small cafes.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-black">$0</span>
            <span className="text-sm font-bold text-black/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> 1 Active Game
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> Basic Analytics
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`bg-[#111111] text-white border-4 border-black rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 ${activePlan === "Pro Store" ? "shadow-[8px_8px_0px_0px_#FF4C29]" : ""}`}>
          {activePlan === "Pro Store" && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4C29] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black">
              Current Active Plan
            </div>
          )}
          <h3 className="font-serif text-2xl font-bold text-white mb-1">Pro Store</h3>
          <p className="text-sm font-semibold text-white/60 mb-6">For growing cafes & retail.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-white">$29</span>
            <span className="text-sm font-bold text-white/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Unlimited Active Games
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Advanced Analytics & Heatmap
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Custom Theme Colors
            </div>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className={`bg-white border-4 rounded-3xl p-8 flex flex-col transition-all ${activePlan === "Enterprise" ? "border-black shadow-[8px_8px_0px_0px_#332FD0]" : "border-black/10"}`}>
          {activePlan === "Enterprise" && (
            <div className="bg-[#332FD0] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black mb-2 self-start">
              Current Active Plan
            </div>
          )}
          <h3 className="font-serif text-2xl font-bold text-black mb-1">Enterprise</h3>
          <p className="text-sm font-semibold text-black/50 mb-6">Multi-location scale.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-black">$99</span>
            <span className="text-sm font-bold text-black/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> Watermark Removal
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> White-Label Domain
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
