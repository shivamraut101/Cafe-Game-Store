"use client";

import React, { useState } from "react";
import { isClientProd } from "../lib/appEnv";

interface DemoOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoOnboardingModal({ isOpen, onClose }: DemoOnboardingModalProps) {
  const [cafeName, setCafeName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || isClientProd()) return null;

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeName.trim() || !contactInfo.trim()) return;

    setIsSubmitting(true);
    // Simulate lead capture (stored in localStorage for demo review)
    try {
      const existingLeads = JSON.parse(localStorage.getItem("forstore_demo_leads") || "[]");
      existingLeads.push({
        cafeName: cafeName.trim(),
        contact: contactInfo.trim(),
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem("forstore_demo_leads", JSON.stringify(existingLeads));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Shivam! I'm testing the demo on demo.curaflowstudio.com and would love to onboard my cafe with the 100 Free Plays trial.`
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#F6F3EB] border-4 border-black rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[8px_8px_0px_0px_#000000] relative my-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-sm hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000]"
          title="Close"
        >
          ✕
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full tracking-wider">
            ✦ PILOT FOR YOUR VENUE · 14-DAY TRIAL
          </span>
          <span className="text-xs font-semibold text-black/50">Zero hardware needed</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-serif text-2xl sm:text-3xl font-black text-black leading-tight">
          Bring Gamified Loyalty To <span className="underline decoration-[#FF4C29] decoration-wavy">Your Cafe</span>
        </h2>
        <p className="text-xs sm:text-sm text-black/70 font-semibold mt-2 leading-relaxed">
          Transform table wait time into customer retention. Get custom-branded games, reward tiers, and printable QR standees with <strong>100 free plays</strong> pre-loaded.
        </p>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 my-5">
          <div className="bg-white border-2 border-black rounded-2xl p-3 text-center shadow-[2px_2px_0px_0px_#10B981]">
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 block">100</span>
            <span className="text-[10px] font-bold text-black/60 uppercase">Free Plays</span>
          </div>
          <div className="bg-white border-2 border-black rounded-2xl p-3 text-center shadow-[2px_2px_0px_0px_#332FD0]">
            <span className="font-mono text-xl sm:text-2xl font-black text-[#332FD0] block">0</span>
            <span className="text-[10px] font-bold text-black/60 uppercase">App Downloads</span>
          </div>
          <div className="bg-white border-2 border-black rounded-2xl p-3 text-center shadow-[2px_2px_0px_0px_#000]">
            <span className="font-mono text-xl sm:text-2xl font-black text-black block">+25%</span>
            <span className="text-[10px] font-bold text-black/60 uppercase">Repeat Lift</span>
          </div>
        </div>

        {/* What You Get Grid */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 mb-5 shadow-[2px_2px_0px_0px_#000] flex flex-col gap-2.5 text-xs">
          <div className="flex items-start gap-2.5 font-semibold text-black">
            <span className="text-base leading-none">🖨️</span>
            <div>
              <span className="font-black">Printable Table QR Standees:</span> Ready-to-print PDFs branded with your logo, table numbers, and brand colors.
            </div>
          </div>
          <div className="flex items-start gap-2.5 font-semibold text-black">
            <span className="text-base leading-none">🎮</span>
            <div>
              <span className="font-black">9 Ready-to-Play Minigames:</span> Coffee Stack, Flappy Barista, Barista Catch & more. Instant mobile web play.
            </div>
          </div>
          <div className="flex items-start gap-2.5 font-semibold text-black">
            <span className="text-base leading-none">🛡️</span>
            <div>
              <span className="font-black">Pay-Per-Play Protection:</span> Only pay when customers play. Plays 11+ same day are 100% free on us.
            </div>
          </div>
          <div className="flex items-start gap-2.5 font-semibold text-black">
            <span className="text-base leading-none">☕</span>
            <div>
              <span className="font-black">3-Second Counter Redemption:</span> Staff verify customer reward vouchers directly from any phone or browser.
            </div>
          </div>
        </div>

        {/* Action Pathways */}
        {!submitted ? (
          <div className="flex flex-col gap-3">
            {/* Primary Action */}
            <a
              href="/admin?mode=register"
              className="w-full py-3.5 bg-black text-white border-2 border-black rounded-xl font-bold text-sm shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get started (100 free plays included)</span>
              <span className="text-xs text-white/60">→</span>
            </a>

            {/* Direct WhatsApp & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/919749694882?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-[#FBF9F4] text-black border-2 border-black rounded-xl font-bold text-xs hover:bg-black/5 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>💬</span> WhatsApp: +91 97496 94882
              </a>

              <a
                href="mailto:shivam@primexmeta.com?subject=Inquiry%20from%20Demo%20Store&body=Hi%20Shivam%2C%20I%20tested%20the%20demo%20at%20demo.curaflowstudio.com%20and%20want%20to%20know%20more%20about%20setting%20this%20up%20for%20my%20cafe."
                className="py-2.5 px-4 bg-[#FBF9F4] text-black border-2 border-black rounded-xl font-bold text-xs hover:bg-black/5 transition-all text-center flex items-center justify-center gap-2 truncate"
                title="shivam@primexmeta.com"
              >
                <span>✉️</span> Email: shivam@primexmeta.com
              </a>
            </div>

            {/* 30-Second Fast Callback Request */}
            <div className="mt-2 pt-3 border-t border-black/10">
              <span className="text-[11px] font-black uppercase tracking-wider text-black/50 block mb-2">
                Or request a personalized 5-min walkthrough:
              </span>
              <form onSubmit={handleCallbackSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="Your Cafe / Business Name"
                  className="flex-1 p-2.5 rounded-xl border-2 border-black bg-white font-semibold text-xs focus:outline-none focus:border-[#FF4C29]"
                />
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="WhatsApp # or Email"
                  className="flex-1 p-2.5 rounded-xl border-2 border-black bg-white font-semibold text-xs focus:outline-none focus:border-[#FF4C29]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-black text-white rounded-xl font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Request Call 📞"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border-3 border-emerald-500 rounded-2xl p-5 text-center shadow-[4px_4px_0px_0px_#000]">
            <span className="text-3xl mb-1 block">🎉</span>
            <h3 className="font-serif text-xl font-black text-emerald-900">Request Received!</h3>
            <p className="text-xs text-emerald-800 font-semibold mt-1 max-w-sm mx-auto">
              We will message you on WhatsApp or Email (+91 97496 94882 / shivam@primexmeta.com) within 15 minutes with a personalized setup and your 100 Free Plays grant.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href="/admin?mode=register"
                className="py-2 px-4 bg-[#FF4C29] text-white border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                Or Continue Setup Directly →
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 bg-white text-black border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
