"use client";

import React, { useState, useEffect, useRef } from "react";
interface QRStudioProps {
  storeName?: string;
  gameTitle?: string;
  gameSlug?: string;
  primaryColor?: string;
  logoEmoji?: string;
  [key: string]: any;
}

export type DotType = "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
export type CornerSquareType = "dot" | "square" | "extra-rounded";
export type CornerDotType = "dot" | "square";

export interface ThemePreset {
  id: string;
  name: string;
  icon: string;
  qrColor: string;
  posterBg: string;
  headerBg: string;
  accentColor: string;
}

const themePresets: ThemePreset[] = [
  {
    id: "midnight-dark",
    name: "Midnight Luxury",
    icon: "🍸",
    qrColor: "#1A1A1A",
    posterBg: "#0F172A",
    headerBg: "#000000",
    accentColor: "#F59E0B",
  },
  {
    id: "sunset-glow",
    name: "Cafe Sunset",
    icon: "☕",
    qrColor: "#FF4C29",
    posterBg: "#FFF7ED",
    headerBg: "#EA580C",
    accentColor: "#F97316",
  },
  {
    id: "matcha-tea",
    name: "Zen Matcha",
    icon: "🍵",
    qrColor: "#065F46",
    posterBg: "#F0FDF4",
    headerBg: "#047857",
    accentColor: "#10B981",
  },
  {
    id: "cyber-punk",
    name: "Electric Arcade",
    icon: "⚡",
    qrColor: "#7C3AED",
    posterBg: "#FAF5FF",
    headerBg: "#6D28D9",
    accentColor: "#8B5CF6",
  },
  {
    id: "clean-white",
    name: "Nordic Minimal",
    icon: "✨",
    qrColor: "#111827",
    posterBg: "#FFFFFF",
    headerBg: "#1F2937",
    accentColor: "#3B82F6",
  },
  {
    id: "retro-kraft",
    name: "Artisan Craft",
    icon: "📜",
    qrColor: "#78350F",
    posterBg: "#FEF3C7",
    headerBg: "#92400E",
    accentColor: "#B45309",
  },
];

export default function QRStudio({
  storeName = "My Store",
  primaryColor = "#FF4C29",
  logoEmoji = "☕",
}: QRStudioProps) {
  // Character-limited inputs
  const [headline, setHeadline] = useState("SCAN TO PLAY & WIN INSTANT REWARDS!");
  const [subtext, setSubtext] = useState("Scan with any phone camera • No app download required");
  const [tableNumber, setTableNumber] = useState("Table #04");

  // Style & Color Customizer State (QR)
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(themePresets[0]);
  const [customQrColor, setCustomQrColor] = useState(themePresets[0].qrColor);
  const [customPosterBg, setCustomPosterBg] = useState(themePresets[0].posterBg);
  
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Extended qr-code-styling options
  const [dotStyle, setDotStyle] = useState<DotType>("extra-rounded");
  const [cornerSquareStyle, setCornerSquareStyle] = useState<CornerSquareType>("extra-rounded");
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotType>("dot");

  // Custom Circular Text Border
  const [enableCircularBorder, setEnableCircularBorder] = useState(false);
  const [borderText, setBorderText] = useState("SEE WHY IT'S SUPER • TURN YOUR CODE INTO REVENUE • ");
  const [borderColor, setBorderColor] = useState("#FF4C29");

  // AI Generative Mode State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("A beautiful neon cyberpunk cafe sign at night, glowing colors, highly detailed.");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

  // QR Code Styling Ref
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCodeInstance, setQrCodeInstance] = useState<any>(null);

  // QR Code Destination URL (Permanent clean URL with store slug and table)
  const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const defaultUrl = typeof window !== "undefined"
    ? `${window.location.origin}/arcade?store=${storeSlug}${tableNumber ? `&table=${encodeURIComponent(tableNumber)}` : ""}`
    : `http://localhost:3000/arcade?store=${storeSlug}`;
  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (typeof window !== "undefined") {
      const tableParam = tableNumber ? `&table=${encodeURIComponent(tableNumber)}` : "";
      const newUrl = `${window.location.origin}/arcade?store=${slug}${tableParam}`;
      setTargetUrl(newUrl);
      if (qrCodeInstance) {
        qrCodeInstance.update({ data: newUrl });
      }
    }
  }, [storeName, tableNumber, qrCodeInstance]);

  const handleSelectPreset = (preset: ThemePreset) => {
    setActiveTheme(preset);
    setCustomQrColor(preset.qrColor);
    setCustomPosterBg(preset.posterBg);
  };

  const handlePrint = () => {
    window.print();
  };

  // Initialize QR Code Styling instance
  useEffect(() => {
    import("qr-code-styling").then((QRCodeStylingModule) => {
      const QRCodeStyling = QRCodeStylingModule.default;
      const instance = new QRCodeStyling({
        width: 180,
        height: 180,
        type: "svg",
        data: targetUrl,
        dotsOptions: { color: customQrColor, type: dotStyle },
        backgroundOptions: { color: "transparent" },
        imageOptions: { crossOrigin: "anonymous", margin: 5 },
      });
      setQrCodeInstance(instance);
      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        instance.append(qrRef.current);
      }
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomLogo = () => {
    setCustomLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update QR Code on settings change
  useEffect(() => {
    if (qrCodeInstance) {
      // Using an encoded SVG string for the emoji image fallback
      const emojiSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="80">${logoEmoji}</text></svg>`;
      
      qrCodeInstance.update({
        data: targetUrl,
        image: customLogoUrl || emojiSvg,
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 6,
          imageSize: 0.5,
        },
        dotsOptions: {
          color: customQrColor,
          type: dotStyle,
        },
        cornersSquareOptions: {
          color: customQrColor,
          type: cornerSquareStyle,
        },
        cornersDotOptions: {
          color: customQrColor,
          type: cornerDotStyle,
        }
      });
    }
  }, [qrCodeInstance, targetUrl, customQrColor, dotStyle, cornerSquareStyle, cornerDotStyle, logoEmoji, customLogoUrl]);

  const handleGenerateAI = () => {
    setIsGeneratingAi(true);
    setAiProgress(0);
    setAiGeneratedImage(null);
    
    // Simulate API request to Replicate/ControlNet
    const interval = setInterval(() => {
      setAiProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGeneratingAi(false);
          // Set a visually stunning placeholder from Unsplash that looks like a neon sign for the mockup
          setAiGeneratedImage("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop");
          return 100;
        }
        return p + 10;
      });
    }, 400);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isAiMode ? "🎨" : "📱"}</span>
              <h2 className="font-serif text-2xl font-bold text-black">
                {isAiMode ? "Generative AI QR Studio" : "Advanced QR Poster Studio"}
              </h2>
            </div>
            <p className="text-[#4A4A4A] text-sm mt-1">
              {isAiMode 
                ? "Generate breathtaking, scannable QR artworks using ControlNet & Stable Diffusion."
                : "Custom-styled high-density QR code standees and table tents tailored to your business branding."}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[#FBF9F4] p-1.5 border-2 border-black rounded-xl self-start">
            <button
              onClick={() => setIsAiMode(false)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                !isAiMode ? "bg-[#111111] text-white shadow-[2px_2px_0px_0px_#FF4C29]" : "text-black/60 hover:text-black"
              }`}
            >
              📱 Vector Standard
            </button>
            <button
              onClick={() => setIsAiMode(true)}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                isAiMode ? "bg-[#111111] text-white shadow-[2px_2px_0px_0px_#8B5CF6]" : "text-black/60 hover:text-black"
              }`}
            >
              🎨 Generative AI
              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-sm border border-purple-200 uppercase">Premium</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customizer Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col gap-6">
          <h3 className="font-serif text-lg font-bold text-black border-b-2 border-black/10 pb-3 flex items-center justify-between">
            <span>Poster Customizer Settings</span>
            <span className="text-xs font-semibold text-black/50">Strict Character Limits</span>
          </h3>

          {/* Permanent Table QR Pass Info Card */}
          <div className="bg-emerald-50 border-2 border-emerald-500/60 rounded-xl p-3.5 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                <span>✨</span> Permanent Table QR Code
              </span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded border border-emerald-400 uppercase">
                Anti-Farming Protected
              </span>
            </div>
            <p className="text-[11px] text-emerald-950/80 leading-relaxed font-medium">
              Customers scan this table QR with any phone camera to instantly launch the arcade. Repeat claims are protected by the store's anti-farming cooldown & adaptive difficulty rules.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 px-3 py-1.5 bg-white text-black font-mono text-[10px] rounded-lg border border-black/20 truncate"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(targetUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="px-3 py-1.5 bg-black text-white text-xs font-black rounded-lg uppercase whitespace-nowrap cursor-pointer hover:bg-neutral-800"
              >
                {copiedUrl ? "Copied! ✅" : "Copy URL"}
              </button>
            </div>
          </div>

          {/* Theme Preset */}
          <div>
            <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-2">
              Select Background Color Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themePresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col gap-1.5 transition-all ${
                    activeTheme.id === preset.id
                      ? "border-black bg-orange-50 shadow-[2px_2px_0px_0px_#000] scale-[1.02]"
                      : "border-black/20 hover:border-black/40 bg-[#FBF9F4]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{preset.icon}</span>
                    <div className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.qrColor }}></div>
                  </div>
                  <span className="text-xs font-bold text-black leading-tight">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Headline Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider">Poster Main Headline</label>
              <span className={`text-[11px] font-bold ${headline.length >= 40 ? "text-red-600" : "text-black/50"}`}>{headline.length} / 45 chars</span>
            </div>
            <input type="text" maxLength={45} value={headline} onChange={e => setHeadline(e.target.value)} className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF4C29]" />
          </div>

          {/* Instructions Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider">Instructions Subtext</label>
              <span className={`text-[11px] font-bold ${subtext.length >= 60 ? "text-red-600" : "text-black/50"}`}>{subtext.length} / 65 chars</span>
            </div>
            <input type="text" maxLength={65} value={subtext} onChange={e => setSubtext(e.target.value)} className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF4C29]" />
          </div>

          {/* Location & Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider">Spot / Location Tag</label>
                <span className="text-[11px] font-bold text-black/50">{tableNumber.length} / 20</span>
              </div>
              <input type="text" maxLength={20} value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm font-semibold focus:outline-none" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {["Table #01", "Seat #01", "Station #01", "Lounge #01", "Counter", "Waiting Area"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTableNumber(tag)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/30 bg-white hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">QR Main Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={customQrColor} onChange={e => setCustomQrColor(e.target.value)} className="w-11 h-11 rounded-xl border-2 border-black cursor-pointer bg-white" />
                <input type="text" value={customQrColor} onChange={e => setCustomQrColor(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-mono uppercase focus:outline-none" />
              </div>
            </div>
          </div>

          {!isAiMode && (
            <div className="border-t-2 border-black/10 pt-4">
              <div className="bg-amber-50 rounded-2xl p-3.5 border-2 border-amber-300 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <span>🔗</span> QR Redirect Destination (Website Arcade Hub)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(targetUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="text-[10px] font-black uppercase px-2.5 py-1 bg-black text-white rounded-lg border border-black shadow-[1px_1px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all"
                  >
                    {copiedUrl ? "COPIED! ✅" : "COPY URL 📋"}
                  </button>
                </div>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-black font-mono text-xs font-bold bg-white focus:outline-none focus:border-[#FF4C29]"
                />
                <div className="flex justify-between items-center text-[10px] font-bold text-amber-800">
                  <span>When scanned, users land on this site to pick a game</span>
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-black font-black"
                  >
                    TEST REDIRECT 🚀
                  </a>
                </div>
              </div>
            </div>
          )}

          {!isAiMode ? (
            /* Advanced QR Customizations */
            <div className="border-t-2 border-black/10 pt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Advanced QR Styling Options</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-black/50 uppercase">Center Logo:</span>
                  <input type="file" accept="image/png, image/jpeg" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-black text-white px-2 py-1 rounded-md font-bold shadow-[1px_1px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-none transition-all">
                    {customLogoUrl ? "Change Image" : "Upload Image"}
                  </button>
                  {customLogoUrl && (
                    <button onClick={removeCustomLogo} className="text-xs bg-red-100 text-red-600 border border-red-300 px-2 py-1 rounded-md font-bold hover:bg-red-200 transition-all">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              
              {/* Dot Style */}
              <div>
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-2">Matrix Dot Pattern</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "extra-rounded", label: "Extra Rounded" },
                    { id: "rounded", label: "Rounded" },
                    { id: "classy", label: "Classy" },
                    { id: "classy-rounded", label: "Classy Rounded" },
                    { id: "dots", label: "Dots" },
                    { id: "square", label: "Square" },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDotStyle(st.id as DotType)}
                      className={`py-1.5 px-3 rounded-lg border-2 text-xs font-bold transition-all ${
                        dotStyle === st.id ? "border-black bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]" : "border-black/20 bg-[#FBF9F4] hover:border-black/40 text-black"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Square Style */}
              <div>
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-2">Corner Square Shape (Outer)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "extra-rounded", label: "Extra Rounded" },
                    { id: "dot", label: "Dot (Circular)" },
                    { id: "square", label: "Square" },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCornerSquareStyle(st.id as CornerSquareType)}
                      className={`py-1.5 px-3 rounded-lg border-2 text-xs font-bold transition-all ${
                        cornerSquareStyle === st.id ? "border-black bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]" : "border-black/20 bg-[#FBF9F4] hover:border-black/40 text-black"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Dot Style */}
              <div>
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-2">Corner Dot Shape (Inner)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "dot", label: "Dot (Circular)" },
                    { id: "square", label: "Square" },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCornerDotStyle(st.id as CornerDotType)}
                      className={`py-1.5 px-3 rounded-lg border-2 text-xs font-bold transition-all ${
                        cornerDotStyle === st.id ? "border-black bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]" : "border-black/20 bg-[#FBF9F4] hover:border-black/40 text-black"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Circular Border */}
              <div className="border-t-2 border-black/10 pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Circular Text Border</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-black/60">Enable</span>
                    <input type="checkbox" checked={enableCircularBorder} onChange={e => setEnableCircularBorder(e.target.checked)} className="w-4 h-4 rounded border-2 border-black accent-[#FF4C29]" />
                  </label>
                </div>

                {enableCircularBorder && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">Border Text</label>
                      <input type="text" value={borderText} onChange={e => setBorderText(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FF4C29]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-1.5">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-11 h-11 rounded-xl border-2 border-black cursor-pointer bg-white" />
                        <input type="text" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] text-xs font-mono uppercase focus:outline-none" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* AI GENERATIVE CONTROLS */
            <div className="border-t-2 border-black/10 pt-4 flex flex-col gap-6">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-xs font-black uppercase text-purple-800 tracking-wider">ControlNet + Stable Diffusion</span>
                <p className="text-sm text-purple-900 font-medium">Use AI to blend a highly robust QR code directly into a piece of digital art. The resulting image is 100% scannable by any modern smartphone.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-black/70 tracking-wider mb-2">AI Image Prompt</label>
                <textarea 
                  rows={3}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe the artwork you want..."
                  className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none"
                />
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-300 flex flex-col gap-1 text-xs">
                <span className="font-bold text-amber-900">🔗 Target Game URL (Embedded in Art):</span>
                <span className="font-mono text-black/70 truncate">{targetUrl}</span>
              </div>

              {isGeneratingAi ? (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex justify-between text-xs font-bold text-purple-900 mb-2">
                    <span>Rendering artwork in cloud GPU...</span>
                    <span>{aiProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${aiProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateAI}
                  className="w-full bg-[#8B5CF6] text-white px-6 py-4 rounded-xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all text-base flex justify-center items-center gap-2"
                >
                  ✨ Generate AI Art QR (Costs 50 Credits)
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Column: Live Printable Poster Rendering */}
        <div className="lg:col-span-6 flex flex-col items-center justify-start gap-4">
          <div
            id="printable-poster"
            style={{ backgroundColor: customPosterBg }}
            className="w-full max-w-[380px] rounded-[32px] border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center text-center gap-6 relative transition-all overflow-hidden"
          >
            {/* Header Store Tag Badge */}
            <div
              style={{ backgroundColor: activeTheme.headerBg }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border-2 border-black text-white shadow-[2px_2px_0px_0px_#000]"
            >
              <span className="text-xl bg-white/20 p-1 rounded-lg">{logoEmoji}</span>
              <span className="font-serif font-black text-sm tracking-tight">{storeName}</span>
            </div>

            {/* Headline */}
            <h3 className="font-serif text-2xl font-black text-black leading-tight">
              {headline}
            </h3>

            {/* Center Area QR Render */}
            <div className={`relative flex items-center justify-center ${enableCircularBorder && !isAiMode ? 'mt-6 mb-6' : ''}`}>
              {/* Optional Circular Text Border Overlay (Only in Vector mode) */}
              {enableCircularBorder && !isAiMode && (
                <div className="absolute inset-[-46px] pointer-events-none animate-[spin_20s_linear_infinite]">
                  <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                    <path
                      id="text-path"
                      d="M 100, 100 m -100, 0 a 100,100 0 1,1 200,0 a 100,100 0 1,1 -200,0"
                      fill="none"
                    />
                    <text className="text-[12px] font-black tracking-[0.25em] uppercase" fill={borderColor}>
                      <textPath href="#text-path" startOffset="0%">
                        {borderText.repeat(3)}
                      </textPath>
                    </text>
                  </svg>
                </div>
              )}
              
              <div className={`w-56 h-56 p-4 border-4 border-black shadow-[5px_5px_0px_0px_#000000] relative flex items-center justify-center z-10 transition-all bg-white ${enableCircularBorder && !isAiMode ? 'rounded-full' : 'rounded-3xl'} ${isAiMode ? 'overflow-hidden' : ''}`}>
                {!isAiMode ? (
                  <div ref={qrRef} className="w-full h-full flex items-center justify-center" />
                ) : (
                  <>
                    {aiGeneratedImage ? (
                      <img src={aiGeneratedImage} alt="AI Generated QR" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <span className="text-4xl block mb-2 opacity-50">🎨</span>
                        <span className="text-xs font-bold text-black/50">Enter a prompt and click generate</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Table Badge */}
            <span
              style={{ backgroundColor: activeTheme.headerBg }}
              className="text-white text-xs font-black px-4 py-1.5 rounded-full border-2 border-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]"
            >
              {tableNumber}
            </span>

            {/* Subtext Instructions */}
            <p className="text-xs font-bold text-black/80 leading-relaxed max-w-xs">
              {subtext}
            </p>

            {/* Watermark Footer */}
            <div className="border-t-2 border-black/10 pt-3 w-full text-[10px] font-bold text-black/50 flex items-center justify-between">
              <span>Powered by ForStore Web SaaS</span>
              <span>www.forstore.app</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[380px] mt-2">
            <a
              href="/play/spin-wheel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-[#FF4C29] text-white rounded-2xl font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all text-center flex items-center justify-center gap-2"
            >
              <span>📱</span> Test Customer Play Page
            </a>
          </div>

          <span className="text-xs font-bold text-black/50">🖨️ A5 / Table Tent Printable Preview</span>
        </div>
      </div>
    </div>
  );
}
