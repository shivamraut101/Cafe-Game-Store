"use client";

import React, { useEffect, useState } from "react";
import InStorePassGate from "@/components/InStorePassGate";
import { getClientInStoreSession } from "@/lib/storeAccessPass";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [storeSlug, setStoreSlug] = useState<string>("adda-99");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selectedStore = sessionStorage.getItem("selectedStore") || "adda-99";
      setStoreSlug(selectedStore);
      const session = getClientInStoreSession(selectedStore);
      setIsUnlocked(Boolean(session));
    }
  }, []);

  if (isUnlocked === false) {
    return (
      <InStorePassGate
        storeSlug={storeSlug}
        storeName="Cafe & Arcade"
        onUnlocked={() => setIsUnlocked(true)}
      />
    );
  }

  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-4">
        <span className="text-4xl animate-spin">☕</span>
        <p className="text-xs font-black text-black/50 mt-3">Validating in-store table pass...</p>
      </div>
    );
  }

  return <>{children}</>;
}
