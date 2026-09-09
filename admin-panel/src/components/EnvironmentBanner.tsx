"use client";

import React, { useState, useEffect } from "react";

/**
 * Environment Indicator Banner
 * - Only renders in "demo" or "dev" mode.
 * - Completely invisible (renders null) in "prod" / "production".
 */
export default function EnvironmentBanner() {
  const [env, setEnv] = useState<string>("demo");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const activeEnv = (
      process.env.NEXT_PUBLIC_APP_ENV ||
      "demo"
    )
      .toLowerCase()
      .trim();
    setEnv(activeEnv);
  }, []);

  // In production, render absolutely nothing
  if (env === "prod" || env === "production" || dismissed) {
    return null;
  }

  return (
    <aside aria-label="Demo Environment Notice" className="w-full bg-amber-400 text-black border-b-2 border-black py-1 px-4 text-xs font-black flex items-center justify-between z-50 sticky top-0 shadow-[0_2px_0_0_#000]">
      <div className="flex items-center gap-2 mx-auto">
        <span className="w-2 h-2 rounded-full bg-black animate-ping" />
        <span className="uppercase tracking-wider">
          🟡 DEMO SANDBOX — Test data & credits are isolated from Production
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-black/60 hover:text-black font-black text-sm ml-2 cursor-pointer"
        title="Dismiss banner"
      >
        ✕
      </button>
    </aside>
  );
}
