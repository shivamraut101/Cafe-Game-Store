"use client";

import React, { useState, useEffect } from "react";
import { getClientAppEnvironment } from "../lib/appEnv";
import DemoOnboardingModal from "./DemoOnboardingModal";

/**
 * Environment Indicator Banner with Sales Conversion Triggers
 * - Only renders in "demo" or "dev" mode.
 * - Completely invisible (renders null) in "prod" / "production" (e.g. app.curaflowstudio.com).
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
        className="w-full bg-[#FFFBEB] text-amber-950 border-b border-amber-300 py-1.5 px-4 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 z-50 sticky top-0 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="font-bold text-black">
            Demo Sandbox
          </span>
          <span className="text-black/40">·</span>
          <span className="text-black/70">
            Currently previewing sample cafe: <strong>Brew & Bites</strong> (100 free plays pre-loaded)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-black hover:text-[#FF4C29] font-bold text-xs underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Launch for your cafe</span>
            <span className="text-black/40 text-[10px]">→</span>
          </button>

          <span className="text-black/20">|</span>

          <a
            href="https://wa.me/?text=Hi%20ForStore%20Team!%20I'm%20exploring%20the%20demo%20at%20demo.curaflowstudio.com%20and%20had%20a%20few%20questions%20about%20onboarding."
            target="_blank"
            rel="noopener noreferrer"
            className="text-black/60 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1"
          >
            Ask a question
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


