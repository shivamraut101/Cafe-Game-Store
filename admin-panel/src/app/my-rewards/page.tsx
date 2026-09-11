"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserRewardsAction } from "../actions/gameActions";
import CustomerNameModal from "../../components/CustomerNameModal";
import { isDefaultPlayerName } from "../../lib/playerSession";

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
  validFrom?: string;
  expiresAt: string;
  timingMode?: "immediate_upsell" | "next_visit_retention";
  minOrderValue?: number;
  isLocked?: boolean;
  daysToReturn?: number;
  returnBillAmount?: number;
  storeName: string;
}

export default function CustomerRewardsWallet() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id?: string; guestId?: string; name: string; totalCafePoints: number } | null>(null);
  const [guestId, setGuestId] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [dismissedNameBanner, setDismissedNameBanner] = useState(false);
  const [rewards, setRewards] = useState<RewardVoucher[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "claimed" | "expired">("pending");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const { getOrCreateClientPlayerId, getClientDeviceFingerprint, setClientPlayerIdentity } = await import(
        "../../lib/playerSession"
      );
      const playerId = getOrCreateClientPlayerId();
      const fp = getClientDeviceFingerprint();
      setGuestId(playerId);
      const res = await getUserRewardsAction(playerId, fp);

      if (res.success && res.user && res.rewards) {
        setUser(res.user);
        setRewards(res.rewards as any);
        if (res.user.guestId) {
          setGuestId(res.user.guestId);
          setClientPlayerIdentity(res.user.guestId, res.user.name);
        }
      }
    } catch (e) {
      console.error("Failed to load rewards", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = rewards.filter((r) => r.status === activeTab);
  const hasDefaultName = isDefaultPlayerName(user?.name);

  const getGameIcon = (slug: string) => {
    if (slug === "coffee-tower") return "🏗️";
    if (slug === "flappy-barista") return "🐦";
    if (slug === "barista-catch") return "🍽️";
    if (slug === "drop-merge") return "🍉";
    if (slug === "brick-breaker") return "🧱";
    if (slug === "helix-drop") return "🌀";
    if (slug === "sky-hopper") return "🦘";
    if (slug === "air-hockey") return "🏒";
    if (slug === "tap-war") return "⚡";
    return "🎮";
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center p-4 font-sans select-none">
      {/* Header Bar */}
      <header className="w-full max-w-md bg-black text-white p-5 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h1 className="font-serif font-black text-xl text-white">Rewards Wallet</h1>
          </div>
          <button
            onClick={() => setShowNameModal(true)}
            className="text-xs font-bold text-white/70 mt-1 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group text-left"
            title="Tap to personalize customer name"
          >
            <span>Welcome back,</span>
            <span className="text-emerald-400 font-bold underline decoration-dotted underline-offset-2 group-hover:text-emerald-300">
              {user?.name || "Player"}
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20 group-hover:bg-white/20 transition-all">
              ✏️
            </span>
          </button>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/50 uppercase block">Reward Points</span>
          <span className="font-mono text-emerald-400 font-black text-xl">+{user?.totalCafePoints || 0} PTS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md flex flex-col gap-4">
        {/* Optional Name Personalization Banner (Dismissible) */}
        {hasDefaultName && !dismissedNameBanner && (
          <div className="bg-amber-50 border-3 border-amber-400 rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#000] flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏷️</span>
              <div>
                <p className="text-xs font-black text-black">Want to personalize your vouchers?</p>
                <p className="text-[10px] text-black/60 font-semibold">
                  Add an optional name so cafe staff know who to call at the counter.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowNameModal(true)}
                className="text-[11px] font-black bg-black text-white px-2.5 py-1.5 rounded-xl border border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                Add Name ✏️
              </button>
              <button
                onClick={() => setDismissedNameBanner(true)}
                className="text-black/40 hover:text-black p-1 text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        
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
                Arcade Lobby (9 Games)
              </h3>
              <p className="text-xs text-black/60 font-medium">
                Play Air Hockey, Tap War, Drop & Merge & more
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
            {filteredRewards.map((voucher) => {
              const isLocked = voucher.isLocked || (voucher.validFrom ? new Date(voucher.validFrom) > new Date() : false);
              return (
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
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h4 className="font-serif text-lg font-black text-black">{voucher.rewardName}</h4>
                          {voucher.timingMode === "next_visit_retention" && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                isLocked
                                  ? "bg-amber-100 text-amber-950 border-amber-400"
                                  : "bg-emerald-100 text-emerald-950 border-emerald-400"
                              }`}
                            >
                              {isLocked ? "🔒 Valid Next Visit" : "⚡ Unlocked For Return"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-black/60">{voucher.rewardDescription}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-[10px] font-bold text-black/40">Valid at: {voucher.storeName}</span>
                          {voucher.minOrderValue && voucher.minOrderValue > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded">
                              Min Bill: ₹{voucher.minOrderValue}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FBF9F4] p-3 rounded-2xl border-2 border-black flex items-center justify-between gap-2">
                    <div className="text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-black/40 block">
                        Voucher Code
                      </span>
                      <span className="font-mono text-base font-black text-[#FF4C29]">{voucher.claimCode}</span>
                      {voucher.status === "pending" && (
                        isLocked ? (
                          <span className="text-[10px] font-bold text-amber-800 block mt-0.5">
                            🔒 Unlocks {new Date(voucher.validFrom!).toLocaleDateString()} {new Date(voucher.validFrom!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                            ⏳ Valid until {new Date(voucher.expiresAt).toLocaleDateString()}
                          </span>
                        )
                      )}
                      {voucher.status === "claimed" && voucher.claimedAt && (
                        <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                          ✅ Redeemed at {new Date(voucher.claimedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* WhatsApp Quick Share / Save */}
                      {voucher.status === "pending" && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `🎁 My ${voucher.storeName} reward voucher!\n\nReward: ${voucher.rewardName}\nCode: ${voucher.claimCode}${
                              voucher.minOrderValue ? `\nMin Order: ₹${voucher.minOrderValue}` : ""
                            }\n\nOpen Voucher:\nhttps://forstore.app/claim/${voucher.claimCode}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] text-sm"
                          title="Save to WhatsApp"
                        >
                          📲
                        </a>
                      )}

                      {voucher.status === "pending" ? (
                        <Link
                          href={`/claim/${voucher.claimCode}`}
                          className="py-2.5 px-3.5 bg-black text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all whitespace-nowrap"
                        >
                          OPEN PASS 🎟️
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
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-bold text-black/40 mt-8">
        Show active voucher code to cafe staff at register to redeem!
      </footer>

      {/* Customer Name Customization Modal */}
      <CustomerNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={user?.name || ""}
        guestId={guestId}
        onNameSaved={(newName) => {
          setUser((prev) => (prev ? { ...prev, name: newName } : null));
        }}
        onProfileSynced={(syncedUser) => {
          setUser(syncedUser);
          setGuestId(syncedUser.guestId);
          try {
            localStorage.setItem("forstore_guest_player_id", syncedUser.guestId);
          } catch {}
          fetchRewards();
        }}
      />
    </div>
  );
}
