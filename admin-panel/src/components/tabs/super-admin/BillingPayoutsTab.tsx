"use client";

import React, { useState, useEffect } from "react";
import CustomDropdown from "../../CustomDropdown";
import { getGlobalBillingAction } from "../../../app/actions/adminActions";

export default function BillingPayoutsTab() {
  const [filter, setFilter] = useState("All Tiers");
  const [metrics, setMetrics] = useState({
    totalMRR: 0,
    totalWalletBalance: 0,
    totalAiCreditsUsed: 0,
    planCounts: { starter: 0, pro: 0, enterprise: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await getGlobalBillingAction();
      if (res.success && res.billingMetrics) {
        setMetrics(res.billingMetrics);
      }
    } catch (e) {
      console.error("Failed to load billing metrics from DB", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-1">Billing & Merchant Payouts (Live DB)</h2>
          <p className="text-sm font-semibold text-black/60">Monitor SaaS revenue, merchant wallet balances, and subscription plans in MongoDB Atlas.</p>
        </div>
        <div className="w-48">
          <CustomDropdown 
            options={["All Tiers", "Enterprise Only", "Pro Store Only", "Starter Only"]}
            value={filter}
            onChange={setFilter}
          />
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] text-white p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">Estimated Monthly MRR</span>
          <span className="text-4xl font-black">₹{metrics.totalMRR.toLocaleString()}</span>
          <span className="text-xs font-bold text-emerald-400 mt-2">Live from DB Merchant Plans</span>
        </div>

        <div className="bg-white text-black p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Total Merchant Wallet Balances</span>
          <span className="text-4xl font-black text-emerald-600">⚡ {metrics.totalWalletBalance.toLocaleString()}</span>
          <span className="text-xs font-bold text-black/50 mt-2">Total prepaid fuel credits in DB</span>
        </div>

        <div className="bg-white text-black p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Plan Breakdown</span>
          <div className="flex justify-between items-center mt-2 text-xs font-bold">
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded border border-emerald-400">Enterprise: {metrics.planCounts.enterprise}</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-400">Pro: {metrics.planCounts.pro}</span>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-400">Starter: {metrics.planCounts.starter}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
