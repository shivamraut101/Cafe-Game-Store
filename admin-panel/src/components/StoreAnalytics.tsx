"use client";

import React, { useState } from "react";

interface StoreAnalyticsProps {
  storeName?: string;
}

const dailyScanData = [
  { day: "Jul 18", scans: 240, claims: 32 },
  { day: "Jul 19", scans: 310, claims: 45 },
  { day: "Jul 20", scans: 290, claims: 38 },
  { day: "Jul 21", scans: 410, claims: 58 },
  { day: "Jul 22", scans: 380, claims: 52 },
  { day: "Jul 23", scans: 520, claims: 74 },
  { day: "Jul 24", scans: 610, claims: 89 },
  { day: "Jul 25", scans: 580, claims: 81 },
  { day: "Jul 26", scans: 490, claims: 68 },
  { day: "Jul 27", scans: 430, claims: 61 },
  { day: "Jul 28", scans: 470, claims: 65 },
  { day: "Jul 29", scans: 540, claims: 76 },
  { day: "Jul 30", scans: 620, claims: 88 },
  { day: "Jul 31", scans: 680, claims: 94 },
];

const peakHoursData = [
  { label: "8 AM - 10 AM (Morning Rush)", percentage: 38, icon: "☕" },
  { label: "12 PM - 2 PM (Lunch Hours)", percentage: 32, icon: "🍔" },
  { label: "3 PM - 5 PM (Afternoon Tea)", percentage: 18, icon: "🍰" },
  { label: "6 PM - 9 PM (Evening Dinner)", percentage: 12, icon: "🍷" },
];

export default function StoreAnalytics({
  storeName = "Store Performance",
}: StoreAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"14d" | "30d" | "90d">("14d");

  const totalScans = dailyScanData.reduce((acc, curr) => acc + curr.scans, 0);
  const totalClaims = dailyScanData.reduce((acc, curr) => acc + curr.claims, 0);
  const maxScans = Math.max(...dailyScanData.map(d => d.scans));

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h2 className="font-serif text-2xl font-bold text-black">{storeName} Performance Center</h2>
          </div>
          <p className="text-[#4A4A4A] text-sm mt-1">
            Deep analytics on customer scans, peak traffic hours, game campaign conversion rates, and ROI.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FBF9F4] border-2 border-black p-1.5 rounded-xl self-start sm:self-auto text-xs font-bold">
          {(["14d", "30d", "90d"] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRange === range
                  ? "bg-[#111111] text-white shadow-[2px_2px_0px_0px_#8B5CF6]"
                  : "text-black/70 hover:text-black"
              }`}
            >
              Last {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6]">
          <p className="text-xs font-bold text-black/50 tracking-wider">TOTAL CUSTOMER SCANS</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">{totalScans.toLocaleString()}</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">↑ 18.4% vs previous period</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
          <p className="text-xs font-bold text-black/50 tracking-wider">REWARDS CLAIMED</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">{totalClaims.toLocaleString()}</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">Avg Win Rate: 13.8%</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
          <p className="text-xs font-bold text-black/50 tracking-wider">CUSTOMER REPEAT RATE</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">38.2%</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">Multi-visit game players</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B]">
          <p className="text-xs font-bold text-black/50 tracking-wider">EST. REVENUE GENERATED</p>
          <h3 className="font-serif text-3xl font-black mt-1 text-black">₹48,700</h3>
          <span className="text-emerald-700 text-xs font-bold block mt-2">Net Wallet Credit Cost: ₹1,312</span>
        </div>
      </div>

      {/* Daily Customer Scan Volume Chart */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-black">Daily Scan Traffic Volume (Last 14 Days)</h3>
            <p className="text-xs text-black/60">Compare total customer QR scans vs rewards claimed at table counters.</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#FF4C29] rounded-sm"></span> Total Scans
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#8B5CF6] rounded-sm"></span> Claims
            </span>
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="pt-6 pb-2 flex items-end justify-between gap-2 h-64 border-b-2 border-black/10">
          {dailyScanData.map((d, index) => {
            const scanHeight = Math.round((d.scans / maxScans) * 100);
            const claimHeight = Math.round((d.claims / maxScans) * 100);
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-full relative">
                  {/* Hover Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded border border-black z-10 whitespace-nowrap pointer-events-none">
                    {d.day}: {d.scans} scans / {d.claims} claims
                  </div>

                  {/* Scans Bar */}
                  <div
                    style={{ height: `${scanHeight}%` }}
                    className="w-1/2 bg-[#FF4C29] rounded-t-lg border-2 border-black transition-all group-hover:bg-[#ff340d]"
                  ></div>

                  {/* Claims Bar */}
                  <div
                    style={{ height: `${claimHeight}%` }}
                    className="w-1/2 bg-[#8B5CF6] rounded-t-lg border-2 border-black transition-all group-hover:bg-[#7c4dff]"
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-black/60 truncate w-full text-center">
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Row: Peak Scan Hours Heatmap + Game Campaign Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Peak Hours Heatmap */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-black border-b-2 border-black/10 pb-3">
              Peak Customer Scanning Hours
            </h3>
            <p className="text-xs text-black/60 my-3">
              Understanding when customers scan table QR codes at your cafe tables.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {peakHoursData.map(item => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="text-[#FF4C29] font-black">{item.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-[#F6F3EB] rounded-full border-2 border-black overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="h-full bg-[#FF4C29] rounded-full"
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-300 text-[11px] font-bold text-amber-900 mt-2">
            💡 Tip: Schedule time-based double reward multipliers during 8 AM - 10 AM to drive extra coffee sales!
          </div>
        </div>

        {/* Right: Minigame Performance Matrix */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000000] overflow-hidden flex flex-col">
          <div className="bg-black/5 p-5 border-b-2 border-black">
            <h3 className="font-serif text-lg font-bold text-black">Minigame Campaign Breakdown</h3>
            <p className="text-xs text-black/60">Compare performance across active gamified loyalty campaigns.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                  <th className="p-3.5 pl-6">Campaign</th>
                  <th className="p-3.5">Scans</th>
                  <th className="p-3.5">Claims</th>
                  <th className="p-3.5">Win Rate</th>
                  <th className="p-3.5 pr-6 text-right">Repeat Lift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 text-xs font-semibold">
                {[
                  { name: "Spin the Wheel", icon: "🎡", scans: 2410, claims: 360, rate: "14.9%", lift: "+22%" },
                  { name: "Instant Scratch Card", icon: "🎟️", scans: 1850, claims: 210, rate: "11.3%", lift: "+18%" },
                  { name: "Slot Machine", icon: "🎰", scans: 1200, claims: 144, rate: "12.0%", lift: "+15%" },
                  { name: "Catch & Win", icon: "🧺", scans: 780, claims: 98, rate: "12.5%", lift: "+12%" },
                ].map(game => (
                  <tr key={game.name} className="hover:bg-black/[0.02]">
                    <td className="p-3.5 pl-6 flex items-center gap-2 font-bold text-black">
                      <span>{game.icon}</span>
                      <span>{game.name}</span>
                    </td>
                    <td className="p-3.5 font-bold">{game.scans.toLocaleString()}</td>
                    <td className="p-3.5 font-bold text-purple-700">{game.claims}</td>
                    <td className="p-3.5">{game.rate}</td>
                    <td className="p-3.5 pr-6 text-right font-black text-emerald-700">{game.lift}</td>
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
