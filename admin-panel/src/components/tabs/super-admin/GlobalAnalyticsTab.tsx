"use client";

import React, { useState } from "react";
import CustomDropdown from "../../CustomDropdown";

export default function GlobalAnalyticsTab() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const chartData = [
    { day: "Mon", value: 40 }, { day: "Tue", value: 65 }, { day: "Wed", value: 80 },
    { day: "Thu", value: 50 }, { day: "Fri", value: 95 }, { day: "Sat", value: 130 },
    { day: "Sun", value: 110 }, { day: "Mon", value: 45 }, { day: "Tue", value: 70 },
    { day: "Wed", value: 85 }, { day: "Thu", value: 60 }, { day: "Fri", value: 105 },
    { day: "Sat", value: 140 }, { day: "Sun", value: 120 }
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">Global Analytics</h2>
          <p className="text-sm font-semibold text-black/60">System-wide performance, scans, and player engagement.</p>
        </div>
        <div className="w-48 z-20">
          <CustomDropdown 
            options={["Last 30 Days", "This Quarter", "Year to Date"]}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
      </div>

      {/* Actionable AI Insights Panel */}
      <div className="bg-[#111111] text-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#FF4C29] flex flex-col md:flex-row gap-6 items-center">
        <div className="w-16 h-16 bg-[#FF4C29] rounded-2xl border-2 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0px_0px_#000]">
          🤖
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold mb-2">AI Growth Insights</h3>
          <ul className="flex flex-col gap-2 text-sm font-semibold text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">↑</span> 
              <span><strong className="text-white">Slot Machine</strong> campaigns have a 32% higher claim rate than Scratch Cards this month. Consider pushing a new Slot Machine template.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FF4C29] mt-0.5">⚠</span> 
              <span>Weekend scan volume in <strong className="text-white">Chicago</strong> dropped by 12%. Automated email nudge suggested for 14 Chicago-based merchants.</span>
            </li>
          </ul>
        </div>
        <button className="bg-white text-black px-6 py-3 rounded-xl font-bold text-sm border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all whitespace-nowrap">
          Generate Full Report
        </button>
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
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Total QR Scans</div>
                  <div className="text-3xl font-black">1,248,590</div>
                </div>
                <div className="text-4xl opacity-20">📱</div>
              </div>
            </div>
            
            <div className="w-1 h-6 bg-black/20 ml-12"></div>
            
            {/* Step 2 */}
            <div className="flex items-center gap-4 pl-8">
              <div className="w-full bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_#332FD0]">
                <div>
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Games Played</div>
                  <div className="text-3xl font-black">842,100</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-black uppercase text-[#FF4C29] bg-[#FF4C29]/10 px-2 py-0.5 rounded border border-[#FF4C29]/30">67% Conversion</div>
                </div>
              </div>
            </div>

            <div className="w-1 h-6 bg-black/20 ml-20"></div>
            
            {/* Step 3 */}
            <div className="flex items-center gap-4 pl-16">
              <div className="w-full bg-white border-2 border-black rounded-xl p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_#10B981]">
                <div>
                  <div className="text-xs font-bold text-black/50 uppercase tracking-wider mb-1">Rewards Claimed</div>
                  <div className="text-3xl font-black">119,578</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-black uppercase text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30">14.2% Global Win Rate</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Top Regions Heatmap Data */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
          <h3 className="font-serif text-xl font-bold text-black mb-6">Top Regions</h3>
          <div className="flex flex-col gap-4">
            {[
              { city: "New York, NY", percentage: 35, scans: "437K" },
              { city: "Austin, TX", percentage: 25, scans: "312K" },
              { city: "London, UK", percentage: 18, scans: "224K" },
              { city: "Chicago, IL", percentage: 12, scans: "150K" },
              { city: "Miami, FL", percentage: 10, scans: "124K" },
            ].map((region, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>{region.city}</span>
                  <span>{region.scans}</span>
                </div>
                <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden border border-black/20">
                  <div 
                    className="h-full bg-black rounded-full" 
                    style={{ width: `${region.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-white text-black rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all flex justify-center items-center gap-2">
            <span>🗺️</span> View Heatmap Map
          </button>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-black">Platform Scan Volume</h3>
            <p className="text-sm font-semibold text-black/50">Daily scans across all active 142 merchants.</p>
          </div>
          <div className="text-3xl font-black">1.24M <span className="text-sm text-black/50">total</span></div>
        </div>
        
        {/* Interactive Neo-brutalist Bar Chart */}
        <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 border-b-4 border-black pb-1 relative">
          {chartData.map((data, i) => (
            <div 
              key={i} 
              className="w-full flex flex-col justify-end relative group cursor-crosshair h-full"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] z-20 pointer-events-none transition-opacity duration-200 ${hoveredBar === i ? 'opacity-100' : 'opacity-0'}`}>
                {data.value * 120} scans
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
              </div>
              
              {/* Bar */}
              <div 
                className={`w-full border-2 border-black rounded-t-md transition-all duration-300 ${hoveredBar === i ? 'bg-[#FF4C29] -translate-y-2 shadow-[2px_2px_0px_0px_#000]' : 'bg-[#111111]'}`} 
                style={{ height: `${(data.value / 150) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-[10px] sm:text-xs font-bold text-black/40">
          {chartData.map((data, i) => (
            <span key={i} className={`w-full text-center transition-colors ${hoveredBar === i ? 'text-black' : ''}`}>{data.day}</span>
          ))}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Stores */}
        <div className="bg-[#FBF9F4] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
          <h3 className="font-serif text-xl font-bold text-black mb-6">Top Performing Stores</h3>
          <div className="flex flex-col gap-4">
            {[
              { name: "Downtown Tacos & Tequila", scans: 45100, trend: "+12%", winRate: "14.2%", claims: "6,400" },
              { name: "Brew & Bites Cafe", scans: 12400, trend: "+8%", winRate: "16.5%", claims: "2,050" },
              { name: "Pixel Arcade Cafe", scans: 9800, trend: "+5%", winRate: "12.8%", claims: "1,250" },
            ].map((store, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0px_0px_#000000]">
                <div className="flex items-center gap-3">
                  <span className="font-black text-black/30 text-xl">#{i+1}</span>
                  <div>
                    <span className="font-bold text-sm block">{store.name}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{store.trend} Growth</span>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider">Scans</span>
                    <span className="font-bold text-sm">{store.scans.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider">Win Rate</span>
                    <span className="font-bold text-sm text-[#332FD0]">{store.winRate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider">Claims</span>
                    <span className="font-bold text-sm text-[#10B981]">{store.claims}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Game Types */}
        <div className="bg-[#FBF9F4] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000]">
          <h3 className="font-serif text-xl font-bold text-black mb-6">Game Type Analytics</h3>
          <div className="flex flex-col gap-4">
            {[
              { type: "Spin the Wheel", icon: "🎡", share: "45%", avgWinRate: "15%", totalPlays: "378,900" },
              { type: "Slot Machine", icon: "🎰", share: "30%", avgWinRate: "12%", totalPlays: "252,600" },
              { type: "Scratch Card", icon: "🎟️", share: "15%", avgWinRate: "8%", totalPlays: "126,300" },
            ].map((game, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0px_0px_#000000]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-[#FBF9F4] p-2 rounded-xl border border-black/10">{game.icon}</span>
                  <div>
                    <span className="font-bold text-sm block">{game.type}</span>
                    <span className="text-[10px] font-bold text-[#FF4C29] uppercase tracking-widest">{game.share} Global Share</span>
                  </div>
                </div>
                <div className="flex gap-4 sm:gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider">Avg Win Rate</span>
                    <span className="font-bold text-sm text-[#332FD0]">{game.avgWinRate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-black/50 uppercase tracking-wider">Total Plays</span>
                    <span className="font-bold text-sm text-[#10B981]">{game.totalPlays}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
