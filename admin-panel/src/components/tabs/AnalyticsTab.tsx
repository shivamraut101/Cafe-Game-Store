"use client";

import React, { useState, useEffect } from "react";
import CustomDropdown from "../CustomDropdown";
import { getAnalyticsDataAction } from "../../app/actions/adminActions";

interface AnalyticsTabProps {
  storeName?: string;
}

export default function AnalyticsTab({ storeName }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalScans: 0,
    totalVouchersWon: 0,
    totalRedeemed: 0,
    redemptionRate: 0,
    avgDuration: 45,
  });
  const [hourlyPeakData, setHourlyPeakData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [storeName]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getAnalyticsDataAction(storeName);
      if (res.success && res.metrics && res.hourlyPeakData) {
        setMetrics(res.metrics);
        setHourlyPeakData(res.hourlyPeakData);
      }
    } catch (e) {
      console.error("Failed to load analytics from DB", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      {/* Title */}
      <div>
        <h2 className="font-serif text-3xl font-bold text-black mb-1">Cafe Arcade Analytics</h2>
        <p className="text-sm font-semibold text-black/60">
          Track customer game plays, peak scan hours, and voucher redemption ROI.
        </p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        <div className="bg-[#111111] text-white p-5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">Total Table Scans</span>
          {loading ? (
            <div className="h-9 w-20 bg-white/20 animate-pulse rounded-lg mt-2" />
          ) : (
            <span className="text-4xl font-black mt-2">{metrics.totalScans.toLocaleString()}</span>
          )}
          <span className="text-[11px] font-bold text-emerald-400 mt-2">Live from DB</span>
        </div>

        <div className="bg-white text-black p-5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Vouchers Won</span>
          {loading ? (
            <div className="h-9 w-20 bg-black/10 animate-pulse rounded-lg mt-2" />
          ) : (
            <span className="text-4xl font-black mt-2">{metrics.totalVouchersWon.toLocaleString()}</span>
          )}
          <span className="text-[11px] font-bold text-emerald-600 mt-2">Live from DB</span>
        </div>

        <div className="bg-white text-black p-5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Redeemed at Register</span>
          {loading ? (
            <div className="h-9 w-20 bg-black/10 animate-pulse rounded-lg mt-2" />
          ) : (
            <span className="text-4xl font-black text-emerald-600 mt-2">{metrics.totalRedeemed.toLocaleString()}</span>
          )}
          <span className="text-[11px] font-bold text-black/60 mt-2">{loading ? "..." : `${metrics.redemptionRate}% Redemption Rate`}</span>
        </div>

        <div className="bg-white text-black p-5 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col justify-between min-h-[130px]">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Avg Play Duration</span>
          {loading ? (
            <div className="h-9 w-20 bg-black/10 animate-pulse rounded-lg mt-2" />
          ) : (
            <span className="text-4xl font-black mt-2">{metrics.avgDuration}s</span>
          )}
          <span className="text-[11px] font-bold text-black/60 mt-2">Optimal Dwell Time</span>
        </div>
      </div>

      {/* Peak Hour Scan Heatmap */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-black">Peak Scan Hours (Hourly Heatmap)</h3>
            <p className="text-xs font-semibold text-black/50">Identifies when customers scan table QR stands most</p>
          </div>
          <span className="bg-[#FF4C29] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
            🔥 PEAK RUSH: 8 AM - 10 AM
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4">
          {(() => {
            const maxScans = Math.max(...hourlyPeakData.map((h) => h.scans), 1);
            return hourlyPeakData.map((item) => (
              <div key={item.hour} className="flex flex-col items-center gap-2">
                <div className="w-full h-24 bg-[#FBF9F4] rounded-xl border-2 border-black relative overflow-hidden flex items-end">
                  <div
                    className={`w-full transition-all rounded-t-lg ${
                      item.peak ? "bg-[#FF4C29]" : "bg-black/20"
                    }`}
                    style={{ height: `${Math.max(5, (item.scans / maxScans) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-black/60 font-mono">{item.hour}</span>
                <span className="text-[11px] font-black text-black">{item.scans}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Game Performance Comparison */}
      <div className="bg-white border-3 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
        <div className="bg-black text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="font-serif text-xl font-bold">Game Performance Leaderboard</h3>
            <p className="text-xs font-medium text-white/60 mt-0.5">Which games drive the highest customer retention?</p>
          </div>
          <div className="w-40">
            <CustomDropdown
              options={["Last 30 Days", "This Week", "Today"]}
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Rank</th>
                <th className="p-4">Game</th>
                <th className="p-4">Total Plays</th>
                <th className="p-4">Vouchers Won</th>
                <th className="p-4 pr-6 text-right">Redemption ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-sm font-semibold">
              {[
                { rank: 1, icon: "☕", name: "Coffee Stack Tower", plays: "4,820", prizes: "612", rate: "84% Redeemed" },
                { rank: 2, icon: "🐦", name: "Flappy Barista", plays: "3,950", prizes: "518", rate: "79% Redeemed" },
                { rank: 3, icon: "🍽️", name: "Barista Catch", plays: "2,480", prizes: "410", rate: "72% Redeemed" },
                { rank: 4, icon: "🎡", name: "Spin to Win", plays: "1,200", prizes: "290", rate: "68% Redeemed" },
              ].map((row) => (
                <tr key={row.rank} className="hover:bg-black/[0.02]">
                  <td className="p-4 pl-6 font-black text-black/40">#{row.rank}</td>
                  <td className="p-4 font-bold flex items-center gap-2">
                    <span className="text-xl">{row.icon}</span>
                    <span>{row.name}</span>
                  </td>
                  <td className="p-4 font-mono font-bold">{row.plays}</td>
                  <td className="p-4 font-mono font-bold text-[#FF4C29]">{row.prizes}</td>
                  <td className="p-4 pr-6 text-right font-black text-emerald-600">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
