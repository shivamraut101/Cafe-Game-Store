"use client";

import React, { useState, useEffect } from "react";
import { getClientAppEnvironment } from "../lib/appEnv";
import DemoOnboardingModal from "./DemoOnboardingModal";

export default function DemoOnboardingFab() {
  const [isDemo, setIsDemo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const env = getClientAppEnvironment();
    if (env === "demo" || env === "dev") {
      setIsDemo(true);
    }
  }, []);

  if (!isDemo) return null;

  return (
    <>
      <aside aria-label="Demo Onboarding Quick Action" className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white border-2 border-black rounded-full font-bold text-xs shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#FF4C29] transition-all cursor-pointer"
          title="Explore setting this up for your cafe"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span>Launch for your cafe</span>
          <span className="text-white/40 text-[11px]">·</span>
          <span className="text-emerald-400 font-semibold">100 free plays</span>
          <span className="text-xs group-hover:translate-x-0.5 transition-transform text-white/60">→</span>
        </button>
      </aside>

      <DemoOnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
