"use client";

import React from "react";
import { TierLevel } from "./SubscriptionPlanCard";

interface FeatureGateProps {
  featureName: string;
  requiredTier: TierLevel;
  currentTier: TierLevel;
  children: React.ReactNode;
  description?: string;
  onUpgradeClick?: () => void;
}

export default function FeatureGate({
  featureName,
  requiredTier,
  currentTier,
  children,
  description = "This feature is locked on your current plan.",
  onUpgradeClick,
}: FeatureGateProps) {
  const tierWeights: Record<TierLevel, number> = {
    Starter: 1,
    "Pro Store": 2,
    Enterprise: 3,
  };

  const isUnlocked = tierWeights[currentTier] >= tierWeights[requiredTier];

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
      {/* Blurred preview of children in background */}
      <div className="opacity-20 blur-[2px] pointer-events-none select-none">
        {children}
      </div>

      {/* Locked Overlay Paywall */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
        <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-black flex items-center justify-center text-2xl mb-3 shadow-[2px_2px_0px_0px_#F59E0B]">
          🔒
        </div>

        <span className="text-[10px] font-black tracking-widest uppercase bg-amber-200 text-amber-900 border border-amber-400 px-3 py-1 rounded-full mb-2">
          {requiredTier} FEATURE REQUIRED
        </span>

        <h3 className="font-serif text-2xl font-black text-black mb-1">
          {featureName} is Locked
        </h3>

        <p className="text-xs text-black/70 max-w-sm mb-4 leading-relaxed">
          {description} Upgrade to the <span className="font-bold">{requiredTier}</span> to unlock custom branding, white-labeling, and wallet features.
        </p>

        <button
          onClick={onUpgradeClick}
          className="bg-[#111111] text-white px-6 py-3 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-xs flex items-center gap-2"
        >
          ⚡ Upgrade to {requiredTier} Plan
        </button>
      </div>
    </div>
  );
}
