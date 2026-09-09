"use client";

import React, { useState } from "react";

export interface BrandConfig {
  storeName: string;
  storeSlug: string;
  primaryColor: string;
  accentColor: string;
  logoEmoji: string;
  customDomain: string;
  removeWatermark: boolean;
  welcomeMessage: string;
}

interface BrandingSettingsProps {
  initialConfig?: Partial<BrandConfig>;
  userTier?: "Starter" | "Pro Store" | "Enterprise";
  onSave?: (config: BrandConfig) => void;
}

export default function BrandingSettings({
  initialConfig,
  userTier = "Pro Store",
  onSave,
}: BrandingSettingsProps) {
  const [config, setConfig] = useState<BrandConfig>({
    storeName: initialConfig?.storeName || "My Store",
    storeSlug: initialConfig?.storeSlug || "",
    primaryColor: initialConfig?.primaryColor || "#FF4C29",
    accentColor: initialConfig?.accentColor || "#8B5CF6",
    logoEmoji: initialConfig?.logoEmoji || "☕",
    customDomain: initialConfig?.customDomain || "",
    removeWatermark: initialConfig?.removeWatermark || false,
    welcomeMessage: initialConfig?.welcomeMessage || "Welcome to our Loyalty Hub!",
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isWhiteLabelUnlocked = userTier === "Pro Store" || userTier === "Enterprise";

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#8B5CF6] text-xl">🎨</span>
            <h2 className="font-serif text-2xl font-bold text-black">White-Label Branding Studio</h2>
          </div>
          <p className="text-[#4A4A4A] text-sm mt-1">
            Customize the player experience so your customers see your brand, colors, and domain.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
          <span className="text-xs font-bold text-purple-900">Current Tier: {userTier}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col gap-6">
          <h3 className="font-serif text-lg font-bold text-black border-b-2 border-black/10 pb-3">
            Store Identity & Visuals
          </h3>

          {/* Store Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                value={config.storeName}
                onChange={e => setConfig({ ...config, storeName: e.target.value })}
                className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                Store URL Slug
              </label>
              <div className="flex items-center">
                <span className="bg-black/5 border-2 border-r-0 border-black p-3 rounded-l-xl text-xs font-semibold text-black/60">
                  forstore.app/s/
                </span>
                <input
                  type="text"
                  value={config.storeSlug}
                  onChange={e => setConfig({ ...config, storeSlug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="w-full p-3 rounded-r-xl border-2 border-black bg-[#FBF9F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Icon Selector & Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                Brand Logo / Icon
              </label>
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-xl border-2 border-black bg-orange-100 flex items-center justify-center text-xl">
                  {config.logoEmoji}
                </div>
                <select
                  value={config.logoEmoji}
                  onChange={e => setConfig({ ...config, logoEmoji: e.target.value })}
                  className="p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm font-medium flex-1 focus:outline-none"
                >
                  {["☕", "🍔", "🍕", "🍦", "🍩", "🍣", "🌮", "🍺", "🥐", "🎮"].map(emoji => (
                    <option key={emoji} value={emoji}>
                      {emoji} Icon
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-11 h-11 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={e => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-mono uppercase focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={e => setConfig({ ...config, accentColor: e.target.value })}
                  className="w-11 h-11 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={config.accentColor}
                  onChange={e => setConfig({ ...config, accentColor: e.target.value })}
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-mono uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">
              Player Welcome Banner Text
            </label>
            <input
              type="text"
              value={config.welcomeMessage}
              onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
              className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4C29]"
            />
          </div>

          {/* Custom Domain Settings */}
          <div className="border-t-2 border-black/10 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-black">Custom Domain Integration</h4>
                <p className="text-xs text-black/60">Connect your own domain e.g. play.yourstore.com</p>
              </div>
              {!isWhiteLabelUnlocked && (
                <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PRO FEATURE
                </span>
              )}
            </div>
            <input
              type="text"
              disabled={!isWhiteLabelUnlocked}
              placeholder="e.g. play.yourstore.com"
              value={config.customDomain}
              onChange={e => setConfig({ ...config, customDomain: e.target.value })}
              className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            />
          </div>

          {/* Watermark Toggle */}
          <div className="bg-[#F6F3EB] rounded-xl p-4 border-2 border-black flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-black">Remove "Powered by ForStore" Branding</h4>
              <p className="text-xs text-black/60">100% clean custom white-label player interface.</p>
            </div>
            <input
              type="checkbox"
              disabled={userTier !== "Enterprise"}
              checked={config.removeWatermark}
              onChange={e => setConfig({ ...config, removeWatermark: e.target.checked })}
              className="w-5 h-5 accent-black rounded cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                ✓ Branding Settings Saved!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto bg-[#111111] text-white px-6 py-3 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-sm"
            >
              Save White-Label Theme
            </button>
          </div>
        </form>

        {/* Right Column: Live Mobile Preview Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start gap-4">
          <div className="w-full max-w-[320px] bg-black p-4 rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] relative">
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-3 h-3 bg-neutral-800 rounded-full"></div>
            </div>

            {/* Mobile Screen Container */}
            <div className="bg-[#F6F3EB] rounded-[28px] overflow-hidden border-2 border-black min-h-[500px] flex flex-col">
              {/* Header inside Phone */}
              <div
                style={{ backgroundColor: config.primaryColor }}
                className="p-4 text-white border-b-2 border-black flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl bg-white/20 p-1 rounded-lg">{config.logoEmoji}</span>
                  <span className="font-serif font-black text-sm text-white tracking-tight">
                    {config.storeName}
                  </span>
                </div>
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">LIVE PREVIEW</span>
              </div>

              {/* Game View Canvas inside Phone */}
              <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-4 bg-white relative">
                <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl text-xs font-semibold text-black">
                  {config.welcomeMessage}
                </div>

                <div
                  style={{ borderColor: config.accentColor }}
                  className="w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_#000] bg-amber-50"
                >
                  <span className="text-4xl animate-bounce">🎡</span>
                  <span className="text-xs font-extrabold mt-1 text-black">Spin to Win!</span>
                </div>

                <button
                  style={{ backgroundColor: config.primaryColor }}
                  className="w-full text-white font-bold py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs"
                >
                  PLAY NOW
                </button>
              </div>

              {/* Mobile Footer */}
              <div className="p-2.5 bg-[#F6F3EB] border-t-2 border-black text-center text-[10px] font-bold text-black/60">
                {config.removeWatermark ? (
                  <span>© {config.storeName} Loyalty</span>
                ) : (
                  <span>Powered by ForStore White-Label</span>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-black/50">📱 Customer Phone View Simulation</span>
        </div>
      </div>
    </div>
  );
}
