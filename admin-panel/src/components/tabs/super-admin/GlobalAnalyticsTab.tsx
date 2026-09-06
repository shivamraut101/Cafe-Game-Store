"use client";

import React, { useState, useEffect } from "react";
import CustomDropdown from "../../CustomDropdown";
import { getGlobalAnalyticsAction } from "../../../app/actions/adminActions";

export default function GlobalAnalyticsTab() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [metrics, setMetrics] = useState({
    totalStores: 0,
    totalSessions: 0,
    totalVouchersWon: 0,
    totalRedeemed: 0,
    scanToGameRate: 0,
    claimRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalAnalytics();
  }, []);

  const fetchGlobalAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getGlobalAnalyticsAction();
      if (res.success && res.globalMetrics) {
        setMetrics(res.globalMetrics);
      }
    } catch (e) {
      console.error("Failed to load global analytics from DB", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-1">Global Analytics (Live DB)</h2>
          <p className="text-sm font-semibold text-black/60">System-wide performance, total scans, and player engagement from MongoDB Atlas.</p>
        </div>
        <div className="w-48 z-20">
          <CustomDropdown 
            options={["Last 30 Days", "This Quarter", "Year to Date"]}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
      </div>

      {/* Top Metrics & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Engagement Funnel */}
        <div className="lg:col-span-2 bg-[#FBF9F4] border-4 border-black rounded-3xl p-8 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-center relative overflow-hidden">
          <h3 className="font-serif text-xl font-bold text-black mb-6">Global Engagement Funnel</h3>
          <div className="flex flex-col gap-4 relative z-10">
            
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="w-full bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_#FF4C29]">
                <div>
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Total Table Scans</div>
                  <div className="text-3xl font-black">{metrics.totalSessions.toLocaleString()}</div>
                </div>
                <div className="text-4xl opacity-20">📱</div>
              </div>
            </div>
            
            <div className="w-1 h-6 bg-black/20 ml-12"></div>
            
            {/* Step 2 */}
            <div className="flex items-center gap-4 pl-8">
              <div className="w-full bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_#332FD0]">
                <div>
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Vouchers Won</div>
                  <div className="text-3xl font-black">{metrics.totalVouchersWon.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-black uppercase text-[#FF4C29] bg-[#FF4C29]/10 px-2 py-0.5 rounded border border-[#FF4C29]/30">
                    {metrics.claimRate}% Claim Rate
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1 h-6 bg-black/20 ml-20"></div>
            
            {/* Step 3 */}
            <div className="flex items-center gap-4 pl-16">
              <div className="w-full bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_#10B981]">
                <div>
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Rewards Redeemed</div>
                  <div className="text-3xl font-black">{metrics.totalRedeemed.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified at Counter
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* System Summary Card */}
        <div className="bg-black text-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C29]">Platform Summary</span>
            <h3 className="font-serif text-2xl font-bold mt-2">Active Merchants</h3>
            <p className="text-5xl font-black text-white mt-4">{metrics.totalStores}</p>
            <p className="text-xs font-bold text-white/60 mt-2">Stores currently active on platform</p>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 mt-6 space-y-2 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-white/60">Active Databases:</span>
              <span className="font-mono text-emerald-400">MongoDB Atlas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Voucher Expiry:</span>
              <span className="font-mono text-white">Strict 2 Hours</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
