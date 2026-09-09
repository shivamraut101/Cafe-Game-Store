"use client";

import React, { useState, useEffect } from "react";
import { getClientAppEnvironment } from "../lib/appEnv";
import DemoOnboardingModal from "./DemoOnboardingModal";
import { triggerBuyoutModal } from "./DemoBuyoutModal";
import { triggerStoryboardModal } from "./DemoStoryboardModal";

/**
 * Environment Indicator Banner with Sales Conversion Triggers
 * - Only renders in "demo" or "dev" mode.
 * - Completely invisible (renders null) in "prod" / "production" (e.g. app.curaflowstudio.com).
 * - Rendered as a relative top bar so it NEVER collides with or overlaps the sticky header navigation.
 */
export default function EnvironmentBanner() {
  const [env, setEnv] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setEnv(getClientAppEnvironment());
  }, []);

  // During initial mount or in production, render absolutely nothing
  if (!env || env === "prod" || env === "production" || dismissed) {
    return null;
  }

  return (
    <>
      <aside
        aria-label="Demo Environment Notice"
        className="w-full bg-[#FFFBEB] text-amber-950 border-b border-amber-300/80 py-2 px-4 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 relative z-30 shadow-sm"
      >
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="font-bold text-black bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300 text-[11px] uppercase tracking-wider">
            Demo Sandbox
          </span>
          <span className="text-black/40 hidden sm:inline">·</span>
          <span className="text-black/80 font-medium">
            Currently previewing sample cafe: <strong className="font-bold text-black">Brew & Bites</strong> (100 free plays pre-loaded)
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => triggerStoryboardModal(0)}
            className="text-black hover:text-[#332FD0] font-black text-xs flex items-center gap-1 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-md border border-amber-400 transition-colors cursor-pointer"
            title="See the 3-step customer loop in 60 seconds"
          >
            <span>📖</span>
            <span>60s Storyboard</span>
          </button>

          <span className="text-black/20">|</span>

          <button
            onClick={() => triggerBuyoutModal({ plan: "Pro Store", source: "demo_top_banner" })}
            className="text-black hover:text-[#FF4C29] font-black text-xs underline decoration-2 underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🚀 Launch for your cafe</span>
            <span className="text-[10px]">→</span>
          </button>

          <span className="text-black/20">|</span>

          <a
            href="https://wa.me/919749694882?text=Hi%20Shivam!%20I%20am%20exploring%20the%20demo%20at%20demo.curaflowstudio.com%20and%20want%20to%20set%20this%20up%20for%20my%20cafe."
            target="_blank"
            rel="noopener noreferrer"
            className="text-black/80 hover:text-black font-bold text-xs transition-colors flex items-center gap-1"
          >
            <span>💬</span> WhatsApp
          </a>

          <span className="text-black/20">|</span>

          <a
            href="mailto:shivam@primexmeta.com?subject=Inquiry%20from%20Demo%20Store&body=Hi%20Shivam%2C%20I%20tested%20the%20demo%20at%20demo.curaflowstudio.com%20and%20want%20to%20know%20more%20about%20setting%20this%20up%20for%20my%20cafe."
            className="text-black/80 hover:text-black font-bold text-xs transition-colors flex items-center gap-1"
          >
            <span>✉️</span> Email
          </a>

          <button
            onClick={() => setDismissed(true)}
            className="text-black/40 hover:text-black text-sm ml-1 cursor-pointer p-0.5"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      </aside>

      <DemoOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}


