"use client";

import React, { useState } from "react";
import { TierLevel } from "./SubscriptionPlanCard";
import { logAction } from "../lib/auditLogger";
import { MerchantAccount } from "./SuperAdminDashboard";
import CustomDropdown from "./CustomDropdown";
import { createStoreAction } from "../app/actions/adminActions";

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
  const [ownerName, setOwnerName] = useState("");
  const [category, setCategory] = useState("General Business & Lounge");
  const [plan, setPlan] = useState<TierLevel>("Pro Store");
  const [initialCredits, setInitialCredits] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setStoreName(name);
    setStoreSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerEmail.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await createStoreAction({
        storeName: storeName.trim(),
        slug: storeSlug.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || storeName.trim(),
        plan,
        initialCredits,
        actorRole,
      });

      if (!res.success || !res.store) {
        setErrorMsg(res.error || "Failed to provision store in database.");
        return;
      }

      onStoreCreated(res.store as any);
      onClose();
      // Reset form
      setStoreName("");
      setStoreSlug("");
      setOwnerEmail("");
      setOwnerName("");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error provisioning store.");
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="font-serif text-2xl font-black text-black">Provision New Business Account</h2>
        </div>
        <p className="text-xs text-black/60 mb-6">
          Set up a new merchant account or add a new branch location to the SaaS wait-time engagement engine.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Store Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Detailing, Luxe Salon, Downtown Grill"
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
                placeholder="downtown-grill"
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
                placeholder="owner@yourbusiness.com"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1">
                Business Type
              </label>
              <CustomDropdown
                options={[
                  { label: "🏪 General Business & Lounge", value: "General Business & Lounge" },
                  { label: "☕ Cafe & Restaurant", value: "Cafe & Restaurant" },
                  { label: "💇 Salon & Spa", value: "Salon & Spa" },
                  { label: "🚗 Car Care & Detailing", value: "Car Care & Detailing" },
                  { label: "🩺 Clinic & Health", value: "Clinic & Health" },
                  { label: "🎮 Gaming & Entertainment", value: "Gaming & Entertainment" },
                  { label: "🛍️ Retail Store", value: "Retail Store" },
                ]}
                value={category}
                onChange={setCategory}
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "Starter", label: "Starter", price: "₹0/mo" },
              { id: "Pro Store", label: "Pro Store", price: "₹2,499/mo" },
              { id: "Enterprise", label: "Enterprise", price: "₹7,999/mo" },
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

          {errorMsg && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-xs bg-white hover:bg-black/5 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Provisioning..." : "⚡ Provision Store Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
