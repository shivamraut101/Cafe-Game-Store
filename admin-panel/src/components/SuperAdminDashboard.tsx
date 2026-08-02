"use client";

import React, { useState, useEffect } from "react";
import { TierLevel } from "./SubscriptionPlanCard";
import { logAction } from "../lib/auditLogger";
import CreateStoreModal from "./CreateStoreModal";
import CustomDropdown from "./CustomDropdown";
import { getSuperAdminMerchantsAction } from "../app/actions/adminActions";

export interface MerchantAccount {
  id: string;
  storeName: string;
  ownerEmail: string;
  plan: TierLevel;
  status: "Active" | "Trialing" | "Suspended";
  walletBalance: number;
  totalScans: number;
  joinedDate: string;
  whiteLabelOverride: boolean;
  watermarkRemoved: boolean;
  churnRisk: "Low" | "Medium" | "High";
  aiCreditsUsed: number;
}

interface SuperAdminDashboardProps {
  onImpersonateStore?: (storeName: string, tier: TierLevel) => void;
  onCreateStore?: () => void;
}

export default function SuperAdminDashboard({
  onImpersonateStore,
  onCreateStore,
}: SuperAdminDashboardProps) {
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMerchantForCredits, setSelectedMerchantForCredits] = useState<MerchantAccount | null>(null);
  const [creditAddAmount, setCreditAddAmount] = useState(500);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await getSuperAdminMerchantsAction();
      if (res.success && res.merchants) {
        setMerchants(res.merchants as any);
      }
    } catch (e) {
      console.error("Failed to load merchants from DB", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(
    m =>
      m.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStoreCreated = (newStore: MerchantAccount) => {
    setMerchants([newStore, ...merchants]);
  };

  const handlePlanChange = (id: string, newPlan: TierLevel) => {
    const targetStore = merchants.find(m => m.id === id);
    setMerchants(prev =>
      prev.map(m => (m.id === id ? { ...m, plan: newPlan } : m))
    );

    if (targetStore) {
      logAction({
        actorName: "Koushik (Super Admin)",
        actorEmail: "koushik@forstore.app",
        actorRole: "Super Admin",
        ipAddress: "157.48.22.19",
        action: "SUPER_ADMIN_PLAN_CHANGE",
        actionCategory: "BILLING",
        targetType: "Store Account",
        targetName: targetStore.storeName,
        details: `Super Admin changed plan tier from ${targetStore.plan} to ${newPlan}.`,
      });
    }
  };

  const handleToggleOverride = (id: string, field: "whiteLabelOverride" | "watermarkRemoved") => {
    const targetStore = merchants.find(m => m.id === id);
    setMerchants(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: !m[field] } : m))
    );

    if (targetStore) {
      logAction({
        actorName: "Koushik (Super Admin)",
        actorEmail: "koushik@forstore.app",
        actorRole: "Super Admin",
        ipAddress: "157.48.22.19",
        action: "SUPER_ADMIN_FEATURE_OVERRIDE",
        actionCategory: "SECURITY",
        targetType: "Store Account",
        targetName: targetStore.storeName,
        details: `Toggled ${field} flag to ${!targetStore[field]}.`,
      });
    }
  };

  const handleAddCreditsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchantForCredits) return;
    const store = selectedMerchantForCredits;

    setMerchants(prev =>
      prev.map(m =>
        m.id === store.id ? { ...m, walletBalance: m.walletBalance + creditAddAmount } : m
      )
    );

    logAction({
      actorName: "Koushik (Super Admin)",
      actorEmail: "koushik@forstore.app",
      actorRole: "Super Admin",
      ipAddress: "157.48.22.19",
      action: "SUPER_ADMIN_CREDIT_GRANT",
      actionCategory: "BILLING",
      targetType: "Wallet",
      targetName: store.storeName,
      details: `Granted +${creditAddAmount} bonus scan credits to store wallet (New Balance: ${store.walletBalance + creditAddAmount}).`,
    });

    setSelectedMerchantForCredits(null);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Super Admin Top Header Banner */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <h1 className="font-serif text-2xl font-black">Super Admin Platform Control Center</h1>
          </div>
          <p className="text-white/70 text-sm mt-1">
            Global SaaS metrics, merchant subscription controls, and credit overrides across all stores.
          </p>
        </div>

        <button
          onClick={() => setIsCreateStoreOpen(true)}
          className="bg-[#FF4C29] text-white font-bold px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FFFFFF] hover:translate-y-[1px] transition-all text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          🏪 + Provision New Store
        </button>
      </div>

      {/* Fraud Detection & Action Alerts */}
      <div className="bg-red-50 border-4 border-red-600 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#DC2626]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl animate-pulse">🚨</span>
          <h2 className="font-serif text-xl font-black text-red-900 uppercase tracking-wide">AI Fraud Alerts (Action Required)</h2>
        </div>
        <div className="bg-white rounded-xl border-2 border-red-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="font-bold text-red-900">Abnormal Scan Velocity Detected</h4>
            <p className="text-sm font-semibold text-red-700/80 mt-1">
              Store <strong>Pixel Arcade Cafe</strong> has received 45 scans from the same IP address in the last 10 minutes. This indicates potential employee abuse or customer fraud.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm border-2 border-red-900 shadow-[2px_2px_0px_0px_#7F1D1D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#7F1D1D] transition-all whitespace-nowrap">
              Suspend Store
            </button>
            <button className="bg-white text-red-900 px-4 py-2 rounded-lg font-bold text-sm border-2 border-red-200 hover:bg-red-50 transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Global SaaS Platform Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
          <p className="text-xs font-bold text-black/50 tracking-wider">PLATFORM MRR</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">$18,420</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">↑ 24% monthly revenue growth</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6]">
          <p className="text-xs font-bold text-black/50 tracking-wider">TOTAL MERCHANTS</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">{merchants.length} Stores</h3>
          <span className="text-black/60 text-xs font-bold block mt-2">12 new stores this week</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-black/50 tracking-wider">PLATFORM HEALTH</p>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-300">AI SCORE</span>
          </div>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">94/100</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">Excellent engagement & low churn</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B]">
          <p className="text-xs font-bold text-black/50 tracking-wider">WALLET CREDITS SOLD</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">$34,500</h3>
          <span className="text-black/60 text-xs font-bold block mt-2">Pay-as-you-go credit revenue</span>
        </div>
      </div>

      {/* Merchant Management Directory Table */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#000000]">
        <div className="bg-black/5 p-5 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-black">Subscribed Merchant Stores Directory</h2>
            <p className="text-xs text-black/60">Manage plans, credit balances, and feature overrides for store owners.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search store name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-2.5 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Merchant Store</th>
                <th className="p-4">Subscription Tier</th>
                <th className="p-4">Churn Risk</th>
                <th className="p-4">Status</th>
                <th className="p-4">AI Credits Used</th>
                <th className="p-4">Feature Overrides</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-sm">
              {filteredMerchants.map(merchant => (
                <tr key={merchant.id} className="hover:bg-black/[0.02]">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-black">{merchant.storeName}</div>
                    <div className="text-xs text-black/60 font-mono">{merchant.ownerEmail}</div>
                  </td>

                  {/* Plan Dropdown Selector */}
                  <td className="p-4 w-40">
                    <CustomDropdown
                      options={[
                        { label: "Starter ($0)", value: "Starter" },
                        { label: "Pro Store ($29)", value: "Pro Store" },
                        { label: "Enterprise ($99)", value: "Enterprise" }
                      ]}
                      value={merchant.plan}
                      onChange={(val) => handlePlanChange(merchant.id, val as TierLevel)}
                    />
                  </td>

                  {/* Churn Risk Badge */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-widest uppercase border-2 ${
                        merchant.churnRisk === "Low"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : merchant.churnRisk === "Medium"
                          ? "bg-amber-50 border-amber-500 text-amber-800"
                          : "bg-red-50 border-red-500 text-red-800 animate-pulse"
                      }`}
                    >
                      {merchant.churnRisk}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        merchant.status === "Active"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : merchant.status === "Trialing"
                          ? "bg-purple-50 border-purple-300 text-purple-800"
                          : "bg-red-50 border-red-300 text-red-800"
                      }`}
                    >
                      {merchant.status}
                    </span>
                  </td>

                  {/* AI Credits Usage */}
                  <td className="p-4 font-bold">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-black">{merchant.aiCreditsUsed.toLocaleString()} credits</span>
                        <button
                          onClick={() => setSelectedMerchantForCredits(merchant)}
                          className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-black px-2 py-0.5 rounded hover:bg-emerald-200"
                        >
                          + Add
                        </button>
                      </div>
                      <span className="text-[10px] text-black/50 font-bold uppercase tracking-widest mt-0.5">Burn Rate</span>
                    </div>
                  </td>

                  {/* Feature Flag Overrides */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-[11px] font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={merchant.whiteLabelOverride}
                          onChange={() => handleToggleOverride(merchant.id, "whiteLabelOverride")}
                          className="w-3.5 h-3.5 accent-black"
                        />
                        <span>White-Label</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={merchant.watermarkRemoved}
                          onChange={() => handleToggleOverride(merchant.id, "watermarkRemoved")}
                          className="w-3.5 h-3.5 accent-black"
                        />
                        <span>No Watermark</span>
                      </label>
                    </div>
                  </td>

                  {/* Impersonate Action */}
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => {
                        logAction({
                          actorName: "Koushik (Super Admin)",
                          actorEmail: "koushik@forstore.app",
                          actorRole: "Super Admin",
                          ipAddress: "157.48.22.19",
                          action: "SUPER_ADMIN_IMPERSONATE",
                          actionCategory: "SECURITY",
                          targetType: "Store Account",
                          targetName: merchant.storeName,
                          details: `Initiated impersonation session for merchant ${merchant.ownerEmail}`,
                        });
                        if (onImpersonateStore) onImpersonateStore(merchant.storeName, merchant.plan);
                      }}
                      className="bg-[#111111] text-white hover:bg-black/85 font-semibold text-xs py-1.5 px-3 rounded-lg border border-black shadow-[2px_2px_0px_0px_#FF4C29]"
                    >
                      Impersonate Portal ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Store Modal */}
      <CreateStoreModal
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onStoreCreated={handleStoreCreated}
        actorRole="Super Admin"
      />

      {/* Manual Credit Add Modal */}
      {selectedMerchantForCredits && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F6F3EB] rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 max-w-md w-full relative">
            <button
              onClick={() => setSelectedMerchantForCredits(null)}
              className="absolute top-4 right-4 font-bold text-lg hover:text-black/70"
            >
              ✕
            </button>
            <h3 className="font-serif text-2xl font-bold text-black mb-2">Super Admin Credit Grant</h3>
            <p className="text-xs text-black/60 mb-4">
              Manually add scan credits to <span className="font-bold text-black">{selectedMerchantForCredits.storeName}</span>.
            </p>

            <form onSubmit={handleAddCreditsSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                  Credit Bonus Amount
                </label>
                <input
                  type="number"
                  value={creditAddAmount}
                  onChange={e => setCreditAddAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border-2 border-black bg-white font-bold text-lg focus:outline-none"
                  min="50"
                  step="50"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMerchantForCredits(null)}
                  className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-sm bg-white hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FF4C29] text-white rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000000] hover:translate-y-[1px]"
                >
                  Grant Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
