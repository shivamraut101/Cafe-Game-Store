"use client";

import React, { useState } from "react";
import CustomDropdown from "../CustomDropdown";

export default function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h2 className="font-serif text-3xl font-bold text-black mb-2">Arcade Analytics</h2>
        <p className="text-sm font-semibold text-black/60">Monitor how your games are performing in real-time.</p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] text-white p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">Total Scans This Month</span>
          <span className="text-4xl font-black">12,450</span>
          <span className="text-xs font-bold text-emerald-400 mt-2">↑ 24% vs last month</span>
        </div>
        
        <div className="bg-white text-black p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Total Prizes Claimed</span>
          <span className="text-4xl font-black">1,830</span>
          <span className="text-xs font-bold text-emerald-600 mt-2">↑ 12% vs last month</span>
        </div>

        <div className="bg-white text-black p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-2 transition-transform hover:-translate-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">Engagement Rate</span>
          <span className="text-4xl font-black">68%</span>
          <span className="text-xs font-bold text-black/50 mt-2">Scanned & Played</span>
        </div>
      </div>

      {/* Charts Area */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-serif text-xl font-bold text-black">Scan Activity ({timeRange})</h3>
          <div className="w-40 z-20">
            <CustomDropdown 
              options={["Last 30 Days", "This Week", "Today"]}
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>
        </div>
        
        {/* Mocked Chart Visualization */}
        <div className="w-full h-64 border-b-2 border-l-2 border-black flex items-end justify-between px-2 pb-0 pt-8 gap-1 relative">
          {/* Y Axis Labels */}
          <div className="absolute left-[-40px] top-0 h-full flex flex-col justify-between text-[10px] font-bold text-black/40 py-2">
            <span>500</span>
            <span>250</span>
            <span>0</span>
          </div>

          {[...Array(30)].map((_, i) => {
            const height = Math.floor(Math.random() * 60) + 20;
            const isWeekend = i % 7 === 0 || i % 7 === 6;
            return (
              <div key={i} className="group relative w-full h-full flex items-end">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-500 hover:bg-[#FF4C29] ${isWeekend ? 'bg-black' : 'bg-black/20'}`}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                  {Math.floor(height * 5)} Scans
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-full flex justify-between mt-3 text-[10px] font-bold text-black/40 px-2">
          <span>Aug 1</span>
          <span>Aug 15</span>
          <span>Aug 30</span>
        </div>
      </div>

      {/* Game Performance Leaderboard */}
      <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
        <div className="bg-black text-white p-5">
          <h3 className="font-serif text-xl font-bold">Game Leaderboard</h3>
          <p className="text-xs font-medium text-white/60 mt-1">See which games are driving the most engagement.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Rank</th>
                <th className="p-4">Game</th>
                <th className="p-4">Total Plays</th>
                <th className="p-4">Prizes Won</th>
                <th className="p-4 pr-6 text-right">Avg. Play Time</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-sm">
              {[
                { rank: 1, icon: "🎡", name: "Spin the Wheel", plays: "5,240", prizes: "1,048", time: "24s" },
                { rank: 2, icon: "🎰", name: "Slot Machine", plays: "4,100", prizes: "410", time: "18s" },
                { rank: 3, icon: "🎟️", name: "Instant Lottery", plays: "2,250", prizes: "320", time: "12s" },
                { rank: 4, icon: "🐍", name: "Snakes & Ladders", plays: "860", prizes: "52", time: "45s" },
              ].map((game) => (
                <tr key={game.rank} className="hover:bg-[#FBF9F4] transition-colors">
                  <td className="p-4 pl-6 font-black text-lg text-black/40">#{game.rank}</td>
                  <td className="p-4 font-bold flex items-center gap-3">
                    <span className="text-2xl bg-white border-2 border-black/10 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">{game.icon}</span>
                    {game.name}
                  </td>
                  <td className="p-4 font-bold">{game.plays}</td>
                  <td className="p-4 font-semibold text-black/70">{game.prizes}</td>
                  <td className="p-4 pr-6 text-right font-mono font-bold text-black/50">{game.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
