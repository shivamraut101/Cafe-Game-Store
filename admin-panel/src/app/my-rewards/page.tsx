"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserRewardsAction } from "../actions/gameActions";

interface RewardVoucher {
  id: string;
  claimCode: string;
  gameSlug: string;
  rewardName: string;
  rewardDescription: string;
  rewardType: string;
  status: "pending" | "claimed" | "expired";
  earnedAt: string;
  claimedAt?: string;
  expiresAt: string;
  storeName: string;
}

export default function CustomerRewardsWallet() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; totalCafePoints: number } | null>(null);
  const [rewards, setRewards] = useState<RewardVoucher[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "claimed" | "expired">("pending");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await getUserRewardsAction();

      if (res.success && res.user && res.rewards) {
        setUser(res.user);
        setRewards(res.rewards as any);
      }
    } catch (e) {
      console.error("Failed to load rewards", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter((r) => r.status === activeTab);

  const getGameIcon = (slug: string) => {
    if (slug === "coffee-tower") return "🏗️";
    if (slug === "flappy-barista") return "🐦";
    if (slug === "barista-catch") return "🍽️";
    if (slug === "drop-merge") return "🍉";
    if (slug === "brick-breaker") return "🧱";
    if (slug === "helix-drop") return "🌀";
    if (slug === "sky-hopper") return "🦘";
    return "🎮";
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center p-4 font-sans select-none">
      {/* Header Bar */}
      <header className="w-full max-w-md bg-black text-white p-5 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h1 className="font-serif font-black text-xl text-white">Rewards Wallet</h1>
          </div>
          <p className="text-xs font-bold text-white/60 mt-0.5">
            Welcome back, <span className="text-emerald-400 font-bold">{user?.name || "Player"}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/50 uppercase block">Reward Points</span>
          <span className="font-mono text-emerald-400 font-black text-xl">+{user?.totalCafePoints || 0} PTS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md flex flex-col gap-4">
        
        {/* Arcade Lobby Shortcut Banner */}
        <Link
          href="/arcade"
          className="bg-white border-4 border-black rounded-3xl p-4 shadow-[6px_6px_0px_0px_#000] flex justify-between items-center hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#000] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF4C29] to-[#F59E0B] flex items-center justify-center text-2xl shadow-sm">
              🎮
            </div>
            <div>
              <h3 className="font-serif font-black text-base group-hover:text-[#FF4C29] transition-colors">
                Arcade Lobby (7 Games)
              </h3>
              <p className="text-xs text-black/60 font-medium">
                Play Suika, Brick Breaker, Helix Drop & more
              </p>
            </div>
          </div>
          <span className="font-black text-lg text-black/40 group-hover:text-black transition-colors">→</span>
        </Link>

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border-3 border-black shadow-[4px_4px_0px_0px_#000]">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "pending"
                ? "bg-emerald-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                : "text-black/50 hover:text-black"
            }`}
          >
            Active ({rewards.filter((r) => r.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("claimed")}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "claimed"
                ? "bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29]"
                : "text-black/50 hover:text-black"
            }`}
          >
            Redeemed ({rewards.filter((r) => r.status === "claimed").length})
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "expired"
                ? "bg-red-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                : "text-black/50 hover:text-black"
            }`}
          >
            Expired ({rewards.filter((r) => r.status === "expired").length})
          </button>
        </div>

        {/* Rewards List */}
        {loading ? (
          <div className="p-8 text-center bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_#000]">
            <span className="text-4xl animate-spin block mb-2">☕</span>
            <p className="text-xs font-black text-black/50">Fetching your reward vouchers...</p>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="p-8 text-center bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_#000]">
            <span className="text-5xl block mb-2">🏷️</span>
            <h3 className="font-serif text-xl font-black text-black mb-1">No Vouchers Found</h3>
            <p className="text-xs font-bold text-black/50 mb-4">
              {activeTab === "pending"
                ? "Play arcade games to win exclusive vouchers & discounts!"
                : `No ${activeTab} reward vouchers.`}
            </p>
            <Link
              href="/play/coffee-tower"
              className="inline-block py-3 px-6 bg-[#FF4C29] text-white rounded-2xl font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              PLAY GAME NOW 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRewards.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_#000] relative overflow-hidden flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000]">
                      {getGameIcon(voucher.gameSlug)}
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-black text-black">{voucher.rewardName}</h4>
                      <p className="text-xs font-semibold text-black/60">{voucher.rewardDescription}</p>
                      <p className="text-[10px] font-bold text-black/40 mt-0.5">Valid at: {voucher.storeName}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FBF9F4] p-3 rounded-2xl border-2 border-black flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-black/40 block">
                      Voucher Code (2h Window)
                    </span>
                    <span className="font-mono text-base font-black text-[#FF4C29]">{voucher.claimCode}</span>
                    {voucher.status === "pending" && (
                      <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                        ⏳ Valid for 2 hours from win
                      </span>
                    )}
                    {voucher.status === "claimed" && voucher.claimedAt && (
                      <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                        ✅ Redeemed at {new Date(voucher.claimedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {voucher.status === "pending" ? (
                    <Link
                      href={`/claim/${voucher.claimCode}`}
                      className="py-2.5 px-4 bg-emerald-400 text-black font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] transition-all"
                    >
                      SHOW TO STAFF 📱
                    </Link>
                  ) : (
                    <span
                      className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg border ${
                        voucher.status === "claimed"
                          ? "bg-black text-white border-black"
                          : "bg-red-400 text-black border-black"
                      }`}
                    >
                      {voucher.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-bold text-black/40 mt-8">
        Show active voucher code to cafe staff at register to redeem!
      </footer>
    </div>
  );
}
