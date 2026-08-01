"use client";

import React from "react";
import { TierLevel, UserRole } from "../types";
import CustomDropdown from "./CustomDropdown";

interface RoleHeaderProps {
  currentRole: UserRole;
  currentTier: TierLevel;
  onRoleChange: (role: UserRole) => void;
  onTierChange: (tier: TierLevel) => void;
  impersonatedStore?: string | null;
  onExitImpersonation?: () => void;
}

export default function RoleHeader({
  currentRole,
  currentTier,
  onRoleChange,
  onTierChange,
  impersonatedStore,
  onExitImpersonation,
}: RoleHeaderProps) {
  return (
    <div className="bg-[#111111] text-white border-b-2 border-black px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
      {/* Role Toggle Info */}
      <div className="flex items-center gap-3">
        <span className="text-[#FF4C29] font-mono tracking-widest text-[10px] uppercase bg-black/40 px-2 py-0.5 rounded border border-white/20">
          ROLE SWITCHER (DEMO CONTROL)
        </span>

        <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
          <button
            onClick={() => onRoleChange("super_admin")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === "super_admin"
                ? "bg-[#FF4C29] text-white shadow-[2px_2px_0px_0px_#000]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <span>👑</span> Super Admin (SaaS Owner)
          </button>
          <button
            onClick={() => onRoleChange("store_admin")}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === "store_admin"
                ? "bg-purple-600 text-white shadow-[2px_2px_0px_0px_#000]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <span>🏪</span> Store Admin (Merchant)
          </button>
        </div>
      </div>

      {/* Impersonation Warning Banner or Tier Switcher */}
      {impersonatedStore ? (
        <div className="flex items-center gap-3 bg-amber-400 text-black px-3 py-1 rounded-xl border-2 border-black font-black">
          <span>⚠️ Impersonating Store: {impersonatedStore}</span>
          <button
            onClick={onExitImpersonation}
            className="bg-black text-white px-2.5 py-0.5 rounded text-[10px] font-bold hover:bg-neutral-800"
          >
            Exit Impersonation ✕
          </button>
        </div>
      ) : currentRole === "store_admin" ? (
        <div className="flex items-center gap-2">
          <span className="text-white/60">Simulate Merchant Tier:</span>
          <div className="w-56 text-black z-50">
            <CustomDropdown 
              options={[
                { label: "Starter Plan ($0 - Features Locked)", value: "Starter" },
                { label: "Pro Store Plan ($29 - White-Label Unlocked)", value: "Pro Store" },
                { label: "Enterprise Plan ($99 - No Watermark)", value: "Enterprise" }
              ]}
              value={currentTier}
              onChange={(val) => onTierChange(val as TierLevel)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
          <span>⚡ Platform Status: 100% Operational (142 Active Merchants)</span>
        </div>
      )}
    </div>
  );
}
