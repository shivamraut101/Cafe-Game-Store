"use client";

import { TierLevel } from "../../types";

interface SubscriptionTabProps {
  currentTier?: TierLevel;
  onTierChange?: (tier: TierLevel) => void;
}

export default function SubscriptionTab({ currentTier, onTierChange }: SubscriptionTabProps) {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">Subscription Plan</h2>
          <p className="text-sm font-semibold text-black/60">Manage your SaaS tier and unlock more features.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl border-2 border-emerald-300 font-bold text-xs flex items-center gap-2">
          <span>✨</span> Active Plan: Pro Store
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Starter Plan */}
        <div className="bg-white border-4 border-black/10 rounded-3xl p-8 flex flex-col transition-all hover:border-black/30">
          <h3 className="font-serif text-2xl font-bold text-black mb-1">Starter</h3>
          <p className="text-sm font-semibold text-black/50 mb-6">Perfect for small pop-ups.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-black">$29</span>
            <span className="text-sm font-bold text-black/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> 1 Active Game
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> Up to 1,000 Scans/mo
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-emerald-500">✓</span> Basic Analytics
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/30">
              <span>✗</span> Generative AI QR
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/30">
              <span>✗</span> Custom Brand Colors
            </div>
          </div>

          <button className="w-full py-3 bg-black/5 text-black rounded-xl font-bold text-sm border-2 border-transparent hover:bg-black/10 transition-colors">
            Downgrade
          </button>
        </div>

        {/* Pro Plan (Active) */}
        <div className="bg-[#111111] text-white border-4 border-black rounded-3xl p-8 flex flex-col shadow-[8px_8px_0px_0px_#FF4C29] relative transform md:-translate-y-4">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF4C29] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black">
            Current Plan
          </div>
          <h3 className="font-serif text-2xl font-bold text-white mb-1">Pro Store</h3>
          <p className="text-sm font-semibold text-white/60 mb-6">For growing cafes & retail.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-white">$79</span>
            <span className="text-sm font-bold text-white/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Up to 5 Active Games
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> 10,000 Scans/mo
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Advanced Analytics
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Generative AI QR Access
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-white">
              <span className="text-[#FF4C29]">✓</span> Custom Brand Colors
            </div>
          </div>

          <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm border-2 border-black hover:bg-gray-100 transition-colors">
            Manage Billing
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white border-4 border-black/10 rounded-3xl p-8 flex flex-col transition-all hover:border-black/30">
          <h3 className="font-serif text-2xl font-bold text-black mb-1">Franchise</h3>
          <p className="text-sm font-semibold text-black/50 mb-6">Multi-location scale.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-black text-black">$199</span>
            <span className="text-sm font-bold text-black/50">/mo</span>
          </div>
          
          <div className="flex flex-col gap-4 mb-8 flex-1">
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-[#332FD0]">✓</span> Unlimited Games
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-[#332FD0]">✓</span> Unlimited Scans
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-[#332FD0]">✓</span> Multiple Store Locations
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-[#332FD0]">✓</span> 10,000 Free AI Credits/mo
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-black/80">
              <span className="text-[#332FD0]">✓</span> White-glove Support
            </div>
          </div>

          <button className="w-full py-3 bg-[#332FD0] text-white rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] transition-all">
            Upgrade to Franchise
          </button>
        </div>
      </div>
    </div>
  );
}
