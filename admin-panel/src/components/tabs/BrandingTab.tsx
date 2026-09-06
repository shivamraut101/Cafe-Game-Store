"use client";

import React, { useState, useEffect } from "react";
import { getStoreBrandingAction, updateStoreBrandingAction } from "../../app/actions/adminActions";
import { getStoreAdminPinAction, updateStoreAdminPinAction } from "../../app/actions/authActions";

interface BrandingTabProps {
  storeName?: string;
}

export default function BrandingTab({ storeName: currentStoreName }: BrandingTabProps) {
  const [storeName, setStoreName] = useState(currentStoreName || "Brew & Bites Cafe");
  const [tagline, setTagline] = useState("Your daily dose of caffeine and fun.");
  const [primaryColor, setPrimaryColor] = useState("#FF4C29");
  const [secondaryColor, setSecondaryColor] = useState("#332FD0");
  const [storePin, setStorePin] = useState("9900");
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBranding();
  }, [currentStoreName]);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await getStoreBrandingAction(currentStoreName);
      if (res.success && res.branding) {
        setStoreName(res.branding.storeName || currentStoreName || "Brew & Bites Cafe");
        setTagline(res.branding.tagline || "");
        setPrimaryColor(res.branding.primaryColor || "#FF4C29");
        setSecondaryColor(res.branding.secondaryColor || "#332FD0");
        setActiveGames(res.branding.activeGames || []);
      }

      const pinRes = await getStoreAdminPinAction(currentStoreName || "Brew & Bites Cafe");
      if (pinRes.success && pinRes.pin) {
        setStorePin(pinRes.pin);
      }
    } catch (e) {
      console.error("Failed to load branding from DB", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg(null);
      const res = await updateStoreBrandingAction(
        {
          storeName,
          primaryColor,
          secondaryColor,
        },
        currentStoreName
      );

      if (storePin.trim().length >= 4) {
        await updateStoreAdminPinAction(currentStoreName || storeName, storePin.trim());
      }

      if (res.success) {
        setMsg("✅ Branding and Store Access PIN saved successfully!");
      } else {
        setMsg("❌ Failed to save branding to DB.");
      }
    } catch (e: any) {
      setMsg("❌ Error saving to database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      <div>
        <h2 className="font-serif text-3xl font-bold text-black mb-1">Branding & Theme (Live DB)</h2>
        <p className="text-sm font-semibold text-black/60">Customize how your Arcade Hub looks and save to MongoDB Atlas.</p>
      </div>

      {msg && (
        <div className="p-3 bg-black text-white rounded-xl text-xs font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29]">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Controls */}
        <div className="flex flex-col gap-6">
          {/* Identity */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="font-serif text-xl font-bold text-black mb-4">Business Identity</h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Business Name</label>
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
            </div>
          </div>

          {/* Theme Colors */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <h3 className="font-serif text-xl font-bold text-black mb-4">Theme Accent Colors</h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-black cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-32 p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-mono text-sm font-bold focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">Secondary Accent</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-black cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-32 p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-mono text-sm font-bold focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Store Admin Access PIN & Secret URL */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl font-bold text-black flex items-center gap-2">
                <span>🔐</span> Portal Access PIN & Secret URL
              </h3>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-full font-bold">
                PROTECTED
              </span>
            </div>
            <p className="text-xs text-black/60 font-semibold mb-4">
              Your secret PIN blocks public visitors from accessing your admin portal. Only people with this URL or PIN can see your dashboard.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">
                  Custom Store Admin PIN (Min 4 chars)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={storePin}
                    onChange={(e) => setStorePin(e.target.value)}
                    placeholder="9900"
                    className="w-36 p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-mono font-black text-lg text-[#FF4C29] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                  />
                  <span className="text-xs font-semibold text-black/50">
                    Can be 4-8 digits or a secret word
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">
                  Your Secret Direct Admin Access URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" ? `${window.location.origin}/?pin=${storePin}` : `https://cafe-game-store-admin-panel.vercel.app/?pin=${storePin}`}
                    className="flex-1 p-3 rounded-xl border-2 border-black bg-black/5 font-mono text-xs font-bold text-black select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/?pin=${storePin}`;
                      navigator.clipboard.writeText(url);
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                    }}
                    className="py-3 px-4 bg-black text-white rounded-xl border-2 border-black font-bold text-xs shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
                  >
                    {copiedPin ? "COPIED! ✓" : "COPY LINK 📋"}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-[11px] font-semibold text-amber-900 flex items-center justify-between">
                <span>Forgot your PIN? Anyone on your team can recover it via owner email.</span>
                <a href="/recover-pin" target="_blank" className="font-bold underline text-amber-950 ml-2 whitespace-nowrap">
                  Recovery Page ↗
                </a>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-4 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "SAVING TO MONGO DB..." : "SAVE BRANDING & PIN TO DB 💾"}
          </button>
        </div>

        {/* Right Col: Live Preview */}
        <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
          <h3 className="font-serif text-xl font-bold text-black border-b-2 border-black pb-3">
            Live Mobile Hub Preview ({activeGames.length} Active Games)
          </h3>
          
          <div className="w-full max-w-sm mx-auto bg-[#F6F3EB] border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-black text-black">{storeName}</span>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-black" style={{ backgroundColor: primaryColor }} />
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs font-bold text-black/40">Loading active games...</div>
            ) : activeGames.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-black/40 bg-white rounded-xl border border-black/20">
                No active games enabled. Enable games in Game Manager!
              </div>
            ) : (
              <div className="space-y-3">
                {activeGames.map((game) => (
                  <div
                    key={game.id || game.name}
                    className="p-3.5 rounded-2xl border-3 border-black text-white font-bold flex items-center gap-3 shadow-[2px_2px_0px_0px_#000]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="text-2xl">{game.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-serif text-sm font-black">{game.name}</h4>
                      <p className="text-[10px] opacity-90">Win {game.reward}!</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
