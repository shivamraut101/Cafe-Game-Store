"use client";

import React, { useState } from "react";

export type TierLevel = "Starter" | "Pro Store" | "Enterprise";

export interface Plan {
  id: TierLevel;
  name: string;
  price: string;
  originalPrice?: string;
  promoBadge?: string;
  billingPeriod: string;
  badge?: string;
  monthlyCredits: number;
  maxGames: string;
  whiteLabel: boolean;
  customDomain: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "Starter",
    name: "Starter Merchant",
    price: "₹0",
    billingPeriod: "Free Forever",
    monthlyCredits: 1500,
    maxGames: "1 Game",
    whiteLabel: false,
    customDomain: false,
    features: [
      "1,500 Welcome Bonus Credits",
      "1 Active Game Campaign",
      "Standard Printable QR Codes",
      "Basic Scan Statistics",
      "Fair-Play Cap (10 plays/user/day)",
    ],
  },
  {
    id: "Pro Store",
    name: "Pro Store Tier",
    price: "₹0",
    originalPrice: "₹2,499",
    promoBadge: "100% WAIVED",
    billingPeriod: "per month",
    badge: "MOST POPULAR",
    monthlyCredits: 12500,
    maxGames: "5 Games",
    whiteLabel: true,
    customDomain: true,
    features: [
      "12,500 Monthly Bonus Game Credits",
      "Up to 5 Active Games",
      "White-Label Color & Logo Customization",
      "Custom Subdomain (play.yourstore.com)",
      "High-Res Table Tent PDF Generator",
      "Priority Email & Chat Support",
    ],
  },
  {
    id: "Enterprise",
    name: "Enterprise White-Label",
    price: "₹0",
    originalPrice: "₹7,999",
    promoBadge: "100% WAIVED",
    billingPeriod: "per month",
    badge: "UNLIMITED BRANDING",
    monthlyCredits: 45000,
    maxGames: "Unlimited",
    whiteLabel: true,
    customDomain: true,
    features: [
      "45,000 Monthly Bonus Game Credits",
      "Unlimited Game Campaigns",
      "100% Removed 'Powered by ForStore' Badge",
      "Multi-Location Account Switcher",
      "Custom Domain + SSL Setup",
      "Dedicated Account Manager",
    ],
  },
];

interface SubscriptionPlanCardProps {
  currentTier?: TierLevel;
  onUpgrade?: (tier: TierLevel) => void;
}

export default function SubscriptionPlanCard({
  currentTier = "Pro Store",
  onUpgrade,
}: SubscriptionPlanCardProps) {
  const [activeTier, setActiveTier] = useState<TierLevel>(currentTier);

  const handleSelectTier = (tier: TierLevel) => {
    setActiveTier(tier);
    if (onUpgrade) onUpgrade(tier);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Active Subscription Status Card */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-black/50 tracking-wider uppercase block">CURRENT MEMBERSHIP PLAN</span>
          <h2 className="font-serif text-2xl font-black text-black mt-1 flex items-center gap-2">
            {activeTier} <span className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full">ACTIVE</span>
          </h2>
          <p className="text-xs text-black/60 mt-1">Next auto-renewal on August 30, 2026. Includes bonus monthly credits.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-transparent border border-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/5">
            Manage Billing Method
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = activeTier === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 border-2 border-black flex flex-col justify-between relative transition-all ${
                plan.badge
                  ? "shadow-[6px_6px_0px_0px_#FF4C29]"
                  : "shadow-[4px_4px_0px_0px_#000000]"
              } ${isCurrent ? "ring-2 ring-black" : ""}`}
            >
              <div className="absolute -top-3 right-4 flex items-center gap-1.5">
                {plan.promoBadge && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-black uppercase tracking-wider">
                    {plan.promoBadge}
                  </span>
                )}
                {plan.badge && (
                  <span className="bg-[#FF4C29] text-white text-[10px] font-black px-3 py-1 rounded-full border border-black tracking-wider uppercase">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-black">{plan.name}</h3>
                <div className="my-4 flex items-baseline gap-2">
                  {plan.originalPrice && (
                    <span className="font-serif text-2xl font-bold line-through text-black/40">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="font-serif text-4xl font-black text-emerald-600">{plan.price}</span>
                  <span className="text-xs font-semibold text-black/60">{plan.billingPeriod}</span>
                </div>

                {plan.originalPrice && (
                  <p className="text-[11px] font-bold text-amber-600 mb-3">
                    ⚡ Promotional waiver: Monthly fee ₹0! Pure Pay-Per-Play.
                  </p>
                )}

                <div className="bg-[#F6F3EB] rounded-xl p-3 border border-black/10 my-4 text-xs font-bold flex flex-col gap-1">
                  <div className="text-emerald-700">✓ {plan.monthlyCredits} Bonus Credits / mo</div>
                  <div className="text-black/80">⚡ {plan.maxGames}</div>
                </div>

                <ul className="flex flex-col gap-2.5 my-6 text-xs text-black/80">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectTier(plan.id)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-bold border-2 border-black text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-emerald-100 border-emerald-500 text-emerald-900 cursor-default"
                    : plan.badge
                    ? "bg-[#111111] text-white shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px]"
                    : "bg-white hover:bg-black/5"
                }`}
              >
                {isCurrent ? "Current Plan Active" : `Claim ${plan.id} at ₹0/mo ➔`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
