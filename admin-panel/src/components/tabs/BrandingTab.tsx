"use client";

import React, { useState } from "react";

export default function BrandingTab() {
  const [storeName, setStoreName] = useState("Brew & Bites Cafe");
  const [tagline, setTagline] = useState("Your daily dose of caffeine and fun.");
  const [primaryColor, setPrimaryColor] = useState("#FF4C29");
  
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h2 className="font-serif text-3xl font-bold text-black mb-2">Branding & Theme</h2>
        <p className="text-sm font-semibold text-black/60">Customize how your Arcade Hub looks to your customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Controls */}
        <div className="flex flex-col gap-6">
          {/* Identity */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="font-serif text-xl font-bold text-black mb-4">Store Identity</h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Store Name</label>
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4C29] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Tagline (Optional)</label>
                <input 
                  type="text" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4C29] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Arcade Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-black bg-[#FBF9F4] flex items-center justify-center overflow-hidden">
                    <span className="text-3xl">☕</span>
                  </div>
                  <button className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/80 transition-colors">
                    Upload PNG
                  </button>
                  <button className="text-black/50 hover:text-red-500 text-xs font-bold transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="font-serif text-xl font-bold text-black mb-4">Arcade Color Theme</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-3">Primary Brand Color</label>
              <div className="flex items-center gap-3 mb-4">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-black p-0 overflow-hidden"
                />
                <input 
                  type="text" 
                  value={primaryColor.toUpperCase()}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-28 p-2 rounded-lg border-2 border-black font-mono text-sm uppercase text-center"
                />
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Quick Presets</label>
              <div className="flex gap-2">
                {["#FF4C29", "#332FD0", "#00A86B", "#FF007F", "#FCA311"].map(color => (
                  <button 
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === color ? 'border-black scale-110 shadow-sm' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <button className="w-full py-4 bg-[#111111] text-white rounded-xl font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all">
            Save Brand Settings
          </button>
        </div>

        {/* Right Col: Live Preview */}
        <div className="sticky top-24 h-[600px] flex items-center justify-center bg-black/5 rounded-3xl border-2 border-black/10 overflow-hidden">
          {/* Phone Mockup */}
          <div className="w-[300px] h-[600px] bg-black rounded-[40px] p-3 shadow-2xl relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20"></div>
            
            {/* Screen */}
            <div className="w-full h-full bg-[#F6F3EB] rounded-[30px] overflow-hidden relative border-2 border-black">
              
              {/* Header */}
              <div className="p-6 pb-4 pt-10" style={{ backgroundColor: primaryColor }}>
                <div className="w-12 h-12 bg-white rounded-xl border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000] mb-3">
                  ☕
                </div>
                <h3 className="font-serif font-black text-xl text-white tracking-tight">{storeName}</h3>
                <p className="text-white/80 text-xs font-medium mt-1">{tagline}</p>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-3 h-full overflow-y-auto pb-20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Active Games</div>
                
                {[
                  { icon: "🎡", name: "Spin the Wheel" },
                  { icon: "🎟️", name: "Scratch Card" },
                  { icon: "🎰", name: "Slot Machine" }
                ].map(g => (
                  <div key={g.name} className="bg-white p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center text-xl">{g.icon}</div>
                    <div className="flex-1 font-bold text-sm">{g.name}</div>
                    <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Overlay Gradient for scrolling effect */}
              <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#F6F3EB] to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
