"use client";

import React from "react";
import { TierLevel, UserRole } from "../types";
import CustomDropdown from "./CustomDropdown";
import { logoutAction, lockAdminAction } from "../app/actions/authActions";

interface RoleHeaderProps {
  currentRole: UserRole;
  currentTier: TierLevel;
  authRole?: UserRole;
  userEmail?: string;
  storeName?: string;
  onRoleChange: (role: UserRole) => void;
  onTierChange: (tier: TierLevel) => void;
  impersonatedStore?: string | null;
  onExitImpersonation?: () => void;
}

export default function RoleHeader({
  currentRole,
  currentTier,
  authRole = "store_admin",
  userEmail,
  storeName,
  onRoleChange,
  onTierChange,
  impersonatedStore,
  onExitImpersonation,
}: RoleHeaderProps) {
  const handleLogout = async () => {
    try {
      await lockAdminAction();
      sessionStorage.removeItem("cafe_admin_session");
      window.location.href = "/admin";
    } catch (e) {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="bg-[#111111] text-white border-b-2 border-black px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
      {/* Role Toggle Info or Store Admin Badge */}
      <div className="flex items-center gap-3">
        {authRole === "super_admin" ? (
          <>
            <span className="text-[#FF4C29] font-mono tracking-widest text-[10px] uppercase bg-black/40 px-2 py-0.5 rounded border border-white/20">
              SUPER ADMIN PERSPECTIVE
            </span>

            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
              <button
                type="button"
                onClick={() => onRoleChange("super_admin")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === "super_admin"
                    ? "bg-[#FF4C29] text-white shadow-[2px_2px_0px_0px_#000]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <span>👑</span> Super Admin (SaaS Owner)
              </button>
              <button
                type="button"
                onClick={() => onRoleChange("store_admin")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentRole === "store_admin"
                    ? "bg-purple-600 text-white shadow-[2px_2px_0px_0px_#000]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <span>🏪</span> Store Admin (Merchant)
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="bg-purple-900/60 text-purple-200 px-3 py-1 rounded-xl border border-purple-700 text-xs font-black flex items-center gap-1.5">
              <span>🏪</span> Logged in: {storeName || "Store Admin"}
            </span>
            {userEmail && (
              <span className="text-white/50 text-[11px] font-mono hidden sm:inline">
                ({userEmail})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Impersonation Warning Banner or Tier Switcher */}
      <div className="flex items-center gap-3">
        {impersonatedStore ? (
          <div className="flex items-center gap-3 bg-amber-400 text-black px-3 py-1 rounded-xl border-2 border-black font-black">
            <span>⚠️ Impersonating Store: {impersonatedStore}</span>
            <button
              type="button"
              onClick={onExitImpersonation}
              className="bg-black text-white px-2.5 py-0.5 rounded text-[10px] font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Exit Impersonation ✕
            </button>
          </div>
        ) : authRole === "super_admin" && currentRole === "store_admin" ? (
          <div className="flex items-center gap-2">
            <span className="text-white/60">Simulate Merchant Tier:</span>
            <div className="w-56 text-black z-50">
              <CustomDropdown
                options={[
                  { label: "Starter Plan ($0 - Features Locked)", value: "Starter" },
                  { label: "Pro Store Plan ($29 - White-Label Unlocked)", value: "Pro Store" },
                  { label: "Enterprise Plan ($99 - No Watermark)", value: "Enterprise" },
                ]}
                value={currentTier}
                onChange={(val) => onTierChange(val as TierLevel)}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
            <span>⚡ Portal Mode: Secured & Encrypted</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl border border-black font-black text-xs transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer"
        >
          LOG OUT 🔒
        </button>
      </div>
    </div>
  );
}
