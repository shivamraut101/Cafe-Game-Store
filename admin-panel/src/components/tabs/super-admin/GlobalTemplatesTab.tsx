"use client";

import React, { useState } from "react";
import GameDemoModal from "../../GameDemoModal";

export default function GlobalTemplatesTab() {
  const [activeDemoEngineId, setActiveDemoEngineId] = useState<string | null>(null);

  const engines = [
    {
      id: "wheel-2",
      title: "Elastic Spin-Wheel 2.0",
      category: "Physics Wheel",
      icon: "🎡",
      bgGradient: "from-amber-400 via-orange-500 to-red-500",
      loadTime: "0.8s",
      fps: "60 FPS",
      size: "12 KB",
      dopamineTag: "Elastic Bounce + Haptic Tick",
      desc: "Native CSS 3D & Canvas wheel with realistic spring bounceback, audio tick sync, and near-miss deceleration curve.",
      status: "Active Template"
    },
    {
      id: "scratch-card",
      title: "Canvas Gold Scratchcard",
      category: "Touch Scratch",
      icon: "🎟️",
      bgGradient: "from-yellow-400 via-amber-500 to-yellow-600",
      loadTime: "0.6s",
      fps: "60 FPS",
      size: "8 KB",
      dopamineTag: "Tactile Rubbing + Auto Burst",
      desc: "Destination-out canvas masking with floating gold dust particles and dynamic auto-reveal at 60% scratched.",
      status: "Active Template"
    },
    {
      id: "neon-slots",
      title: "Neon Vegas 3-Reel Slots",
      category: "Slot Machine",
      icon: "🎰",
      bgGradient: "from-purple-600 via-pink-600 to-red-500",
      loadTime: "0.9s",
      fps: "60 FPS",
      size: "15 KB",
      dopamineTag: "Staggered Reel Suspense",
      desc: "Hardware-accelerated 3D reel spinner with staggered stopping sequence and jackpot visual explosion.",
      status: "Active Template"
    },
    {
      id: "plinko-drop",
      title: "Gravity Plinko Chip Drop",
      category: "Physics Drop",
      icon: "⚪",
      bgGradient: "from-cyan-500 via-blue-600 to-indigo-700",
      loadTime: "1.1s",
      fps: "60 FPS",
      size: "35 KB",
      dopamineTag: "Suspenseful Peg Pathing",
      desc: "Micro-Verlet 2D physics engine simulating realistic chip bounces between pegs with audio collision clinks.",
      status: "Featured Engine"
    },
    {
      id: "mystery-box",
      title: "3D Mystery Boba Box",
      category: "Unboxing",
      icon: "🧋",
      bgGradient: "from-emerald-400 via-teal-600 to-cyan-800",
      loadTime: "0.7s",
      fps: "60 FPS",
      size: "10 KB",
      dopamineTag: "Curiosity & Choice Illusion",
      desc: "Interactive 3D container shake and crack animation with floating voucher burst on tap.",
      status: "Active Template"
    },
    {
      id: "precision-tap",
      title: "Precision Meter 'Stop the Needle'",
      category: "Reflex Skill",
      icon: "⏱️",
      bgGradient: "from-rose-500 via-red-600 to-orange-600",
      loadTime: "0.5s",
      fps: "60 FPS",
      size: "6 KB",
      dopamineTag: "Skill Mastery Illusion",
      desc: "High-speed oscillating meter test. Tap at peak green zone to win max reward points.",
      status: "Active Template"
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">High-Performance Game Engines</h2>
          <p className="text-sm font-semibold text-black/60">Zero-lag, mobile-optimized engines pre-built for instant QR scanning.</p>
        </div>
        <button className="bg-[#111111] text-white px-6 py-3 rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all flex items-center gap-2">
          <span>✨</span> Create New Engine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black text-white p-6 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#FF4C29]">
        <div>
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Avg Load Time</span>
          <span className="font-serif text-2xl font-black text-emerald-400">&lt; 0.8 Seconds</span>
        </div>
        <div>
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Asset Weight</span>
          <span className="font-serif text-2xl font-black text-cyan-400">&lt; 20 KB / game</span>
        </div>
        <div>
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Target Frame Rate</span>
          <span className="font-serif text-2xl font-black text-amber-400">60 FPS Locked</span>
        </div>
        <div>
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Haptic Latency</span>
          <span className="font-serif text-2xl font-black text-rose-400">5 ms Vibe Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engines.map((engine) => (
          <div key={engine.id} className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col justify-between h-full">
            <div>
              <div className={`w-full h-36 bg-gradient-to-br ${engine.bgGradient} rounded-2xl border-2 border-black mb-4 flex items-center justify-center relative overflow-hidden shadow-[2px_2px_0px_0px_#000]`}>
                <span className="text-6xl drop-shadow-lg transform hover:scale-110 transition-transform duration-300">{engine.icon}</span>
                <span className="absolute top-3 right-3 bg-black text-white px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border border-white/20">
                  {engine.size}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C29] bg-[#FF4C29]/10 px-2 py-0.5 rounded border border-[#FF4C29]/20">
                  {engine.category}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ⚡ {engine.loadTime}
                </span>
              </div>

              <h3 className="font-serif text-xl font-black text-black mb-2">{engine.title}</h3>
              <p className="text-xs font-semibold text-black/60 mb-4">{engine.desc}</p>
            </div>

            <div>
              <div className="bg-[#FBF9F4] p-3 rounded-xl border border-black/20 mb-4 text-[11px] font-bold text-black/80 flex items-center gap-2">
                <span>🔥</span>
                <span><strong>Dopamine Factor:</strong> {engine.dopamineTag}</span>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveDemoEngineId(engine.id)}
                  className="flex-1 py-2.5 bg-black text-white rounded-xl font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-1"
                >
                  <span>🎮</span> Launch Demo
                </button>
                <button className="py-2.5 px-4 bg-white text-black rounded-xl font-bold text-xs border-2 border-black hover:bg-black/5 transition-colors">
                  Push to Stores
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GameDemoModal
        engineId={activeDemoEngineId}
        onClose={() => setActiveDemoEngineId(null)}
      />
    </div>
  );
}
