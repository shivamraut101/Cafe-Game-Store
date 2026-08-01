"use client";

import React, { useState } from "react";
import { TierLevel } from "./SubscriptionPlanCard";
import { logAction } from "../lib/auditLogger";
import { MerchantAccount } from "./SuperAdminDashboard";
import CustomDropdown from "./CustomDropdown";

interface CreateStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated: (newStore: MerchantAccount) => void;
  actorRole?: "Super Admin" | "Store Admin";
}

export default function CreateStoreModal({
  isOpen,
  onClose,
  onStoreCreated,
  actorRole = "Super Admin",
}: CreateStoreModalProps) {
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [category, setCategory] = useState("Cafe / Coffee Shop");
  const [plan, setPlan] = useState<TierLevel>("Pro Store");
  const [initialCredits, setInitialCredits] = useState(500);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setStoreName(name);
    setStoreSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerEmail.trim()) return;

    const newStore: MerchantAccount = {
      id: `M-${Math.floor(100 + Math.random() * 900)}`,
      storeName: storeName.trim(),
      ownerEmail: ownerEmail.trim(),
      plan: plan,
      status: "Active",
      walletBalance: initialCredits,
      totalScans: 0,
      joinedDate: new Date().toISOString().substring(0, 10),
      whiteLabelOverride: plan !== "Starter",
      watermarkRemoved: plan === "Enterprise",
      churnRisk: "Low",
      aiCreditsUsed: 0,
    };

    logAction({
      actorName: actorRole === "Super Admin" ? "Koushik (Super Admin)" : "Store Owner",
      actorEmail: actorRole === "Super Admin" ? "koushik@forstore.app" : ownerEmail,
      actorRole: actorRole,
      ipAddress: "157.48.22.19",
      action: "SUPER_ADMIN_STORE_CREATE",
      actionCategory: "SYSTEM",
      targetType: "Store Account",
      targetName: newStore.storeName,
      details: `Provisioned new ${category} store "${newStore.storeName}" on ${plan} plan with ${initialCredits} bonus credits.`,
    });

    onStoreCreated(newStore);
    onClose();
    // Reset form
    setStoreName("");
    setStoreSlug("");
    setOwnerEmail("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#F6F3EB] rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-6 sm:p-8 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 font-bold text-xl hover:text-black/70 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🏪</span>
          <h2 className="font-serif text-2xl font-black text-black">Provision New Store Account</h2>
        </div>
        <p className="text-xs text-black/60 mb-6">
          Set up a new merchant account or add a new branch location to the ForStore SaaS engine.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Store Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Downtown Roast Cafe"
                value={storeName}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                URL Slug
              </label>
              <input
                type="text"
                required
                placeholder="downtown-roast"
                value={storeSlug}
                onChange={e => setStoreSlug(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-black bg-white text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Owner Email & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                Merchant Owner Email
              </label>
              <input
                type="email"
                required
                placeholder="owner@downtownroast.com"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                Store Category
              </label>
              <CustomDropdown
                options={[
                  { label: "☕ Cafe / Coffee Shop", value: "Cafe / Coffee Shop" },
                  { label: "🍔 Restaurant / Diner", value: "Restaurant / Diner" },
                  { label: "🥐 Bakery & Pastry", value: "Bakery & Pastry" },
                  { label: "🍺 Bar & Pub", value: "Bar & Pub" },
                  { label: "🎮 Arcade & Entertainment", value: "Arcade & Entertainment" }
                ]}
                value={category}
                onChange={setCategory}
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Starter", label: "Starter", price: "$0/mo" },
              { id: "Pro Store", label: "Pro Store", price: "$29/mo" },
              { id: "Enterprise", label: "Enterprise", price: "$99/mo" },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id as TierLevel)}
                className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                  plan === p.id
                    ? "border-black bg-[#111111] text-white shadow-[2px_2px_0px_0px_#FF4C29]"
                    : "border-black/20 bg-white text-black hover:border-black/40"
                }`}
              >
                <span className="text-xs font-bold">{p.label}</span>
                <span className="text-[10px] opacity-70 font-semibold">{p.price}</span>
              </button>
            ))}
          </div>

          {/* Initial Scan Bonus Credits */}
          <div>
            <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
              Initial Bonus Scan Credits
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={initialCredits}
              onChange={e => setInitialCredits(Number(e.target.value))}
              className="w-full p-3 rounded-xl border-2 border-black bg-white text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-xs bg-white hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all"
            >
              ⚡ Provision Store Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
