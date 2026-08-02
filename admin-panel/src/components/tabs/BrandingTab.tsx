"use client";

import React, { useState, useEffect } from "react";
import { getStoreBrandingAction, updateStoreBrandingAction } from "../../app/actions/adminActions";

export default function BrandingTab() {
  const [storeName, setStoreName] = useState("Brew & Bites Cafe");
  const [tagline, setTagline] = useState("Your daily dose of caffeine and fun.");
  const [primaryColor, setPrimaryColor] = useState("#FF4C29");
  const [secondaryColor, setSecondaryColor] = useState("#332FD0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await getStoreBrandingAction();
      if (res.success && res.branding) {
        setStoreName(res.branding.storeName || "Brew & Bites Cafe");
        setTagline(res.branding.tagline || "");
        setPrimaryColor(res.branding.primaryColor || "#FF4C29");
        setSecondaryColor(res.branding.secondaryColor || "#332FD0");
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
      const res = await updateStoreBrandingAction({
        storeName,
        primaryColor,
        secondaryColor,
      });

      if (res.success) {
        setMsg("✅ Branding saved to MongoDB Atlas successfully!");
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-4 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "SAVING TO MONGO DB..." : "SAVE BRANDING TO DB 💾"}
          </button>
        </div>

        {/* Right Col: Live Preview */}
        <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
          <h3 className="font-serif text-xl font-bold text-black border-b-2 border-black pb-3">Live Mobile Hub Preview</h3>
          
          <div className="w-full max-w-sm mx-auto bg-[#F6F3EB] border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_#000000] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-black text-black">{storeName}</span>
              <span className="w-3 h-3 rounded-full border border-black" style={{ backgroundColor: primaryColor }} />
            </div>

            <div className="p-4 rounded-2xl border-3 border-black text-white font-bold" style={{ backgroundColor: primaryColor }}>
              <p className="text-xs uppercase tracking-wider opacity-80">Active Campaign</p>
              <h4 className="font-serif text-lg font-black">Coffee Stack Challenge</h4>
              <p className="text-xs mt-1 opacity-90">Play now to win 20% Off!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
