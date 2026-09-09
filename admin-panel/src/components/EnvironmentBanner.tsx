"use client";

import React, { useState, useEffect } from "react";
import { getClientAppEnvironment } from "../lib/appEnv";

/**
 * Environment Indicator Banner
 * - Only renders in "demo" or "dev" mode.
 * - Completely invisible (renders null) in "prod" / "production".
 */
export default function EnvironmentBanner() {
  const [env, setEnv] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setEnv(getClientAppEnvironment());
  }, []);

  // During initial mount or in production, render absolutely nothing
  if (!env || env === "prod" || env === "production" || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Demo Environment Notice"
      className="w-full bg-amber-400 text-black border-b-2 border-black py-1.5 px-4 text-xs font-black flex items-center justify-between z-50 sticky top-0 shadow-[0_2px_0_0_#000]"
    >
      <div className="flex items-center gap-2 mx-auto text-center flex-wrap justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping shrink-0" />
        <span className="uppercase tracking-wider">
          🟡 DEMO SANDBOX — 100 Free Plays / 1,000 Credits Pre-loaded • Test Mode Active • Isolated from Production
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-black/60 hover:text-black font-black text-sm ml-2 cursor-pointer p-1"
        title="Dismiss banner"
      >
        ✕
      </button>
    </aside>
  );
}

