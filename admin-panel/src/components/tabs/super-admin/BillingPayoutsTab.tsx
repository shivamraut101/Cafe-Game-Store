"use client";

import React, { useState } from "react";
import CustomDropdown from "../../CustomDropdown";

export default function BillingPayoutsTab() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">Billing & Payouts</h2>
          <p className="text-sm font-semibold text-black/60">Monitor Stripe revenue, usage-based billing, and SaaS metrics.</p>
        </div>
        <div className="w-48 z-20">
          <CustomDropdown 
            options={["Last 30 Days", "This Quarter", "Year to Date"]}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111111] text-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
          <p className="text-xs font-bold text-white/50 tracking-wider">MRR (SUBSCRIPTIONS)</p>
          <h3 className="font-serif text-3xl font-black mt-2">$18,420</h3>
          <span className="text-emerald-400 text-xs font-bold block mt-2">↑ 24% vs last period</span>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
          <p className="text-xs font-bold text-black/50 tracking-wider">USAGE REVENUE (AI)</p>
          <h3 className="font-serif text-3xl font-black mt-2 text-black">$6,200</h3>
          <span className="text-emerald-600 text-xs font-bold block mt-2">↑ 45% vs last period</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#332FD0]">
          <p className="text-xs font-bold text-black/50 tracking-wider">NET PROFIT (EST)</p>
          <h3 className="font-serif text-3xl font-black mt-2 text-black">$22,100</h3>
          <span className="text-black/60 text-xs font-bold block mt-2">After server & API costs</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
          <p className="text-xs font-bold text-black/50 tracking-wider">NEXT STRIPE PAYOUT</p>
          <h3 className="font-serif text-3xl font-black mt-2 text-black">$8,450.00</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">Expected deposit on Oct 28</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Split Chart & Action Required */}
        <div className="flex flex-col gap-8">
          
          {/* Action Required (Dunning) */}
          <div className="bg-red-50 border-4 border-red-600 rounded-3xl p-6 shadow-[6px_6px_0px_0px_#DC2626]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="font-serif text-lg font-black text-red-900 uppercase tracking-wide">Action Required</h2>
            </div>
            <div className="bg-white rounded-xl border-2 border-red-200 p-4 shadow-[2px_2px_0px_0px_#DC2626]">
              <h4 className="font-bold text-red-900 text-sm">Neon Nights Bar</h4>
              <p className="text-xs font-semibold text-red-700/80 mt-1 mb-3">
                Payment of $29.00 declined (Insufficient Funds). Their store will be suspended in 3 days.
              </p>
              <div className="flex gap-2">
                <button className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-red-900 shadow-[2px_2px_0px_0px_#7F1D1D] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#7F1D1D] transition-all">
                  Send Reminder
                </button>
                <button className="bg-white text-red-900 px-3 py-1.5 rounded-lg font-bold text-xs border-2 border-red-200 hover:bg-red-50 transition-colors">
                  Suspend Now
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Split */}
          <div className="bg-[#FBF9F4] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="font-serif text-xl font-bold text-black mb-6">Revenue Split</h3>
            
            <div className="flex h-12 w-full border-2 border-black rounded-full overflow-hidden mb-6">
              <div className="bg-[#10B981] h-full flex items-center justify-center text-white font-black text-xs border-r-2 border-black" style={{ width: '75%' }}>
                75%
              </div>
              <div className="bg-[#FF4C29] h-full flex items-center justify-center text-white font-black text-xs" style={{ width: '25%' }}>
                25%
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-black">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-black"></div>
                  <span className="font-bold text-sm">Subscriptions (MRR)</span>
                </div>
                <span className="font-black text-black">$18,420</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border-2 border-black">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#FF4C29] border-2 border-black"></div>
                  <span className="font-bold text-sm">AI Usage (Credits)</span>
                </div>
                <span className="font-black text-black">$6,200</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2 bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_#000000] flex flex-col">
          <div className="p-6 border-b-2 border-black bg-[#FBF9F4] flex justify-between items-center">
            <h3 className="font-serif text-xl font-bold text-black">Recent Stripe Transactions</h3>
            <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all">
              Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse h-full">
              <thead>
                <tr className="border-b-2 border-black bg-white text-xs font-bold uppercase tracking-wider text-black">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Store</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 text-sm font-semibold">
                {[
                  { date: "Oct 24, 2026", store: "Downtown Tacos", desc: "Enterprise Plan Renewal", status: "Succeeded", amount: "$99.00" },
                  { date: "Oct 24, 2026", store: "Brew & Bites Cafe", desc: "Pro Store Plan Renewal", status: "Succeeded", amount: "$29.00" },
                  { date: "Oct 23, 2026", store: "Pixel Arcade Cafe", desc: "AI Credit Top-Up (2,000)", status: "Succeeded", amount: "$32.00" },
                  { date: "Oct 23, 2026", store: "The Vintage Tea Room", desc: "Starter Plan", status: "Succeeded", amount: "$0.00" },
                  { date: "Oct 22, 2026", store: "Neon Nights Bar", desc: "Pro Store Plan Renewal", status: "Failed", amount: "$29.00", isError: true },
                  { date: "Oct 22, 2026", store: "Golden Gate Coffee", desc: "Enterprise Plan Renewal", status: "Succeeded", amount: "$99.00" },
                ].map((tx, i) => (
                  <tr key={i} className="hover:bg-black/[0.02]">
                    <td className="p-4 pl-6 text-black/60">{tx.date}</td>
                    <td className="p-4 text-black">{tx.store}</td>
                    <td className="p-4 text-black/80">{tx.desc}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${tx.isError ? 'bg-red-50 text-red-800 border-red-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`p-4 pr-6 text-right font-mono ${tx.isError ? 'text-black/40 line-through' : 'text-emerald-700'}`}>
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
