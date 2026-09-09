"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getMiniGameConfigsAction, getStoreBrandingAction } from "../actions/adminActions";
import { getPlayerChallengerStatusAction } from "../actions/gameActions";
import CustomerNameModal from "../../components/CustomerNameModal";
import { isDefaultPlayerName } from "../../lib/playerSession";

interface GameCard {
  slug: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  rewardHighlight: string;
  topReward?: string;
  color: string;
  shadowColor: string;
  totalPlays?: number;
  popular?: boolean;
}

const DEFAULT_ARCADE_GAMES: GameCard[] = [
  {
    slug: "air-hockey",
    name: "Neon Air Hockey 2P",
    type: "👥 2-PLAYER TABLETOP • 1 Phone",
    icon: "🏒",
    description: "Lay phone on the table & duel your friend, partner, or kid in real-time!",
    rewardHighlight: "Win Table Winner Perk",
    topReward: "Table Winner Perk",
    color: "bg-[#2563EB]",
    shadowColor: "shadow-[4px_4px_0px_0px_#2563EB]",
    popular: true,
  },
  {
    slug: "tap-war",
    name: "Tap War 2P",
    type: "👥 2-PLAYER TABLETOP • 1 Phone",
    icon: "⚡",
    description: "Rapid-fire finger tap duel! Lay phone flat and battle for table supremacy!",
    rewardHighlight: "Win Rapid Tap Perk",
    topReward: "Rapid Tap Perk",
    color: "bg-[#D946EF]",
    shadowColor: "shadow-[4px_4px_0px_0px_#D946EF]",
    popular: true,
  },
  {
    slug: "brick-breaker",
    name: "Swipe Brick Breaker",
    type: "HARD • Unlimited",
    icon: "🧱",
    description: "Angle your shots, break neon blocks, collect multiballs & trigger cafe combos!",
    rewardHighlight: "Win 15% Off Voucher",
    topReward: "15% Off Voucher",
    color: "bg-[#6366F1]",
    shadowColor: "shadow-[4px_4px_0px_0px_#6366F1]",
    popular: true,
  },
  {
    slug: "coffee-tower",
    name: "Tower Stack",
    type: "MEDIUM • Unlimited",
    icon: "🏗️",
    description: "Stack moving cafe tiers with precision! Perfectly aligned blocks trigger score combos.",
    rewardHighlight: "Win 10% Off Voucher",
    topReward: "10% Off Voucher",
    color: "bg-[#FF4C29]",
    shadowColor: "shadow-[4px_4px_0px_0px_#FF4C29]",
    popular: true,
  },
  {
    slug: "flappy-barista",
    name: "Flappy Flight",
    type: "MEDIUM • Max 5/day",
    icon: "🚀",
    description: "Navigate past steaming pipes and espresso machines in this retro flyer!",
    rewardHighlight: "Win Instant 5% Off",
    topReward: "Instant 5% Off",
    color: "bg-[#F59E0B]",
    shadowColor: "shadow-[4px_4px_0px_0px_#F59E0B]",
    popular: true,
  },
  {
    slug: "barista-catch",
    name: "Prize Catcher",
    type: "EASY • Unlimited",
    icon: "🎁",
    description: "Catch falling coffee beans, donuts, and cups while avoiding spoiled milk!",
    rewardHighlight: "Win 15% Off Voucher",
    topReward: "15% Off Voucher",
    color: "bg-[#10B981]",
    shadowColor: "shadow-[4px_4px_0px_0px_#10B981]",
    popular: true,
  },
  {
    slug: "drop-merge",
    name: "Drop & Merge",
    type: "EASY • Unlimited",
    icon: "🍉",
    description: "Drop delicious cafe items, merge matching treats, and build the giant treat!",
    rewardHighlight: "Win 10% Off Reward",
    topReward: "10% Off Reward",
    color: "bg-[#EC4899]",
    shadowColor: "shadow-[4px_4px_0px_0px_#EC4899]",
    popular: true,
  },
  {
    slug: "helix-drop",
    name: "Helix Drop 3D",
    type: "MEDIUM • Unlimited",
    icon: "🌀",
    description: "Rotate the 3D spiral tower to drop through openings while avoiding red zones!",
    rewardHighlight: "Win 10% Off Voucher",
    topReward: "10% Off Voucher",
    color: "bg-[#06B6D4]",
    shadowColor: "shadow-[4px_4px_0px_0px_#06B6D4]",
    popular: true,
  },
  {
    slug: "sky-hopper",
    name: "Sky Hopper 3D",
    type: "MEDIUM • Unlimited",
    icon: "🦘",
    description: "Bounce across endless floating cafe tiles without falling into the void!",
    rewardHighlight: "Win 10% Off Voucher",
    topReward: "10% Off Voucher",
    color: "bg-[#14B8A6]",
    shadowColor: "shadow-[4px_4px_0px_0px_#14B8A6]",
    popular: true,
  },
];

export default function ArcadeLandingPage() {
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userName, setUserName] = useState<string>("Player");
  const [guestPlayerId, setGuestPlayerId] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [dismissedNamePrompt, setDismissedNamePrompt] = useState(false);
  const [games, setGames] = useState<GameCard[]>(DEFAULT_ARCADE_GAMES);
  const [loading, setLoading] = useState(false);

  const [claimedRewardNames, setClaimedRewardNames] = useState<string[]>([]);
  const [claimedGameSlugs, setClaimedGameSlugs] = useState<string[]>([]);
  const [hasPendingVoucher, setHasPendingVoucher] = useState(false);

  const [storeName, setStoreName] = useState("Arcade");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [storeSlug, setStoreSlug] = useState<string>("");


  useEffect(() => {
    // Read store parameter from URL query string (e.g. ?store=adda-99)
    let storeParam = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryStore = params.get("store");

      if (queryStore) {
        sessionStorage.setItem("selectedStore", queryStore);
        storeParam = queryStore;
      } else {
        storeParam = sessionStorage.getItem("selectedStore") || "";
      }

      const normalizedSlug = storeParam.toLowerCase().trim();
      setStoreSlug(normalizedSlug);

      const queryTable = params.get("table");
      if (queryTable) {
        sessionStorage.setItem("selectedTable", queryTable);
        setTableNumber(queryTable);
      } else {
        setTableNumber(sessionStorage.getItem("selectedTable") || "");
      }
    }

    // Ensure unique device-isolated guest player ID & hardware device fingerprint
    import("../../lib/playerSession").then(
      ({ getOrCreateClientPlayerId, getClientDeviceFingerprint, setClientPlayerIdentity }) => {
        const playerId = getOrCreateClientPlayerId();
        const fp = getClientDeviceFingerprint();
        setGuestPlayerId(playerId);

        // Store device fingerprint in cookie for server action telemetry
        try {
          if (fp) {
            document.cookie = `forstore_device_fp=${fp}; path=/; max-age=31536000; SameSite=Lax`;
          }
        } catch {}

        fetch(
          `/api/rewards/user?guestId=${encodeURIComponent(playerId)}&store=${encodeURIComponent(storeParam)}&fp=${encodeURIComponent(fp)}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
              setUserPoints(data.user.totalCafePoints || 0);
              setUserName(data.user.name || "Player");

              // Auto-link to unified master profile on this physical device
              if (data.user.guestId) {
                setGuestPlayerId(data.user.guestId);
                setClientPlayerIdentity(data.user.guestId, data.user.name);
              }
            }
          })
          .catch(() => {});

      // Anti-Farming stealth difficulty & claimed offer check (silent behind the scenes across user & device)
      getPlayerChallengerStatusAction(playerId, storeParam, fp)
        .then((statusRes) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("challengerMode", statusRes.success && statusRes.isChallenger ? "true" : "false");
          }
          if (statusRes.success) {
            setClaimedRewardNames(statusRes.claimedRewardNames || []);
            setClaimedGameSlugs(statusRes.claimedGameSlugs || []);
            setHasPendingVoucher(Boolean(statusRes.hasPendingVoucher));
          }
        })
        .catch(() => {});
    });

    // Fetch store branding for header
    getStoreBrandingAction(storeParam)
      .then((res) => {
        if (res.success && res.branding && res.branding.storeName) {
          setStoreName(res.branding.storeName);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("selectedStore", res.branding.storeName);
          }
        }
      })
      .catch(() => {});

    // Fetch live game configs from active MongoDB database for target store
    getMiniGameConfigsAction(undefined, storeParam)
      .then((res) => {
        if (res.success && res.configs && res.configs.length > 0) {
          const mapped: GameCard[] = res.configs
            .filter((c: any) => c.enabled !== false)
            .map((c) => {
              const topReward = c.rewardTiers && c.rewardTiers.length > 0 ? c.rewardTiers[0].rewardName : undefined;
              
              let color = "bg-[#FF4C29]";
              let shadowColor = "shadow-[4px_4px_0px_0px_#FF4C29]";
              if (c.slug === "flappy-barista") {
                color = "bg-[#F59E0B]";
                shadowColor = "shadow-[4px_4px_0px_0px_#F59E0B]";
              } else if (c.slug === "barista-catch") {
                color = "bg-[#10B981]";
                shadowColor = "shadow-[4px_4px_0px_0px_#10B981]";
              } else if (c.slug === "drop-merge") {
                color = "bg-[#EC4899]";
                shadowColor = "shadow-[4px_4px_0px_0px_#EC4899]";
              } else if (c.slug === "brick-breaker") {
                color = "bg-[#6366F1]";
                shadowColor = "shadow-[4px_4px_0px_0px_#6366F1]";
              } else if (c.slug === "helix-drop") {
                color = "bg-[#06B6D4]";
                shadowColor = "shadow-[4px_4px_0px_0px_#06B6D4]";
              } else if (c.slug === "sky-hopper") {
                color = "bg-[#14B8A6]";
                shadowColor = "shadow-[4px_4px_0px_0px_#14B8A6]";
              } else if (c.slug === "air-hockey") {
                color = "bg-[#2563EB]";
                shadowColor = "shadow-[4px_4px_0px_0px_#2563EB]";
              } else if (c.slug === "tap-war") {
                color = "bg-[#D946EF]";
                shadowColor = "shadow-[4px_4px_0px_0px_#D946EF]";
              }

              const is2Player = c.slug === "air-hockey" || c.slug === "tap-war";
              const typeLabel = is2Player
                ? "👥 2-PLAYER TABLETOP • 1 Phone"
                : `${c.difficulty.toUpperCase()} • Max ${c.maxDailyPlays > 0 ? c.maxDailyPlays + "/day" : "Unlimited"}`;

              const desc = is2Player
                ? `Lay phone on the table & duel your friend, partner, or kid in real-time!`
                : `Play ${c.name} to beat boredom, unlock streaks & claim perks!`;

              const totalPlays = c.stats?.totalPlays || 0;

              return {
                slug: c.slug,
                name: c.name,
                type: typeLabel,
                icon: c.icon,
                description: desc,
                rewardHighlight: topReward ? `Win ${topReward}` : "Play & Earn Points",
                topReward,
                color,
                shadowColor,
                totalPlays,
                popular: false,
              };
            });

          // Sort strictly based on the number of times played in that store (most played first)
          mapped.sort((a, b) => {
            const diff = (b.totalPlays || 0) - (a.totalPlays || 0);
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          });

          // Mark the #1 most played game in this store as popular
          if (mapped.length > 0 && (mapped[0].totalPlays || 0) > 0) {
            mapped[0].popular = true;
          }

          setGames(mapped.length > 0 ? mapped : DEFAULT_ARCADE_GAMES);
        } else {
          setGames(DEFAULT_ARCADE_GAMES);
        }
      })
      .catch((e) => {
        console.error("Failed to load games from DB, using fallback", e);
        setGames(DEFAULT_ARCADE_GAMES);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-between p-4 font-sans select-none">
      {/* Header Bar */}
      <header className="w-full max-w-md bg-black text-white p-5 rounded-3xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">✨</span>
            <h1 className="font-serif font-black text-xl text-white">{storeName}</h1>
            {tableNumber && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#FF4C29] text-white rounded-full border border-black shadow-[2px_2px_0px_0px_#000]">
                {tableNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
              Table Pass Active • Play & Win
            </span>
          </div>
          <button
            onClick={() => setShowNameModal(true)}
            className="text-xs font-bold text-white/70 mt-1 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group text-left"
            title="Tap to personalize customer name"
          >
            <span>Welcome,</span>
            <span className="text-emerald-400 font-bold underline decoration-dotted underline-offset-2 group-hover:text-emerald-300">
              {userName}
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20 group-hover:bg-white/20 transition-all">
              ✏️
            </span>
          </button>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/50 uppercase block">Reward Points</span>
          <span className="font-mono text-emerald-400 font-black text-xl">+{userPoints} PTS</span>
        </div>
      </header>

      {/* Main Arcade Menu */}
      <main className="w-full max-w-md flex flex-col gap-4 flex-1">
        {/* Optional Name Personalization Banner (Dismissible) */}
        {isDefaultPlayerName(userName) && !dismissedNamePrompt && (
          <div className="bg-amber-50 border-3 border-amber-400 rounded-2xl p-3.5 shadow-[3px_3px_0px_0px_#000] flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏷️</span>
              <div>
                <p className="text-xs font-black text-black">Playing as {userName}?</p>
                <p className="text-[10px] text-black/60 font-semibold">
                  Add an optional name for leaderboards & vouchers. ID protects your points.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowNameModal(true)}
                className="text-[11px] font-black bg-black text-white px-2.5 py-1.5 rounded-xl border border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                Set Name ✏️
              </button>
              <button
                onClick={() => setDismissedNamePrompt(true)}
                className="text-black/40 hover:text-black p-1 text-xs font-bold"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#FF4C29] to-[#F59E0B] text-white p-4 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#000] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-black/40 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-white/20 tracking-wider">
                PLAY & WIN REWARDS
              </span>
              <h2 className="font-serif text-2xl font-black mt-1">Pick a Game & Win!</h2>
              <p className="text-xs font-bold text-white/90 mt-0.5">
                Play mini-games to win exclusive discounts & instant perks!
              </p>
            </div>
            <span className="text-5xl animate-bounce">🎮</span>
          </div>
        </div>

        {/* My Rewards Wallet Button */}
        <Link
          href="/my-rewards"
          className="w-full py-3.5 px-4 bg-emerald-400 text-black rounded-2xl font-black text-sm border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <span>MY REWARDS WALLET</span>
          </div>
          <span className="font-mono font-black text-xs bg-black text-white px-2.5 py-1 rounded-lg">
            VIEW VOUCHERS →
          </span>
        </Link>

        {/* Games List Title */}
        <div className="flex items-center justify-between px-1 mt-2">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-black text-black">Available Arcade Games</h3>
            <span className="text-[9px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#FF4C29]">
              Most Played First
            </span>
          </div>
          <span className="text-xs font-bold text-black/40">{games.length} Active Games</span>
        </div>

        {/* Games Grid / Cards */}
        {loading ? (
          <div className="p-8 text-center bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_#000]">
            <span className="text-4xl animate-spin block mb-2">☕</span>
            <p className="text-xs font-black text-black/50">Loading arcade games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="p-8 text-center bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0px_0px_#000]">
            <p className="text-xs font-black text-black/50">No active games enabled yet.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {games.map((game) => (
            <div
              key={game.slug}
              className={`bg-white border-4 border-black rounded-3xl p-5 ${game.shadowColor} flex flex-col justify-between gap-4 relative overflow-hidden`}
            >
              {game.popular && (
                <span className="absolute top-3 right-3 bg-[#FF4C29] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
                  🔥 #1 MOST PLAYED
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${game.color} border-3 border-black flex items-center justify-center text-3xl text-white shadow-[3px_3px_0px_0px_#000]`}>
                  {game.icon}
                </div>
                <div className="flex-1 pr-12">
                  <h4 className="font-serif text-lg font-black text-black">{game.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-wider block">
                      {game.type}
                    </span>
                    {typeof game.totalPlays === "number" && game.totalPlays > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-md font-mono">
                        🕹️ {game.totalPlays} play{game.totalPlays !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-black/60 mt-1 leading-snug">
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Action / Reward Highlight Badge */}
              {(() => {
                const isOfferClaimed = Boolean(
                  hasPendingVoucher ||
                  claimedGameSlugs.includes(game.slug) ||
                  (game.topReward && claimedRewardNames.some(
                    (r) => r.toLowerCase().trim() === game.topReward?.toLowerCase().trim()
                  ))
                );

                return (
                  <div className="bg-[#FBF9F4] p-3 rounded-2xl border-2 border-black flex items-center justify-between gap-2">
                    {isOfferClaimed || !game.topReward ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base">⭐</span>
                        <span className="text-xs font-bold text-amber-700">Play & Earn Cafe Points</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏆</span>
                        <span className="text-xs font-bold text-emerald-700">Win {game.topReward}</span>
                      </div>
                    )}
                    <Link
                      href={`/play/${game.slug}`}
                      className="py-2.5 px-4 bg-black text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:bg-[#FF4C29] transition-all whitespace-nowrap"
                    >
                      PLAY NOW 🚀
                    </Link>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-bold text-black/40 py-2">
        Scan QR at your spot • Play mini-games to win exclusive rewards
      </footer>

      {/* Customer Name Customization Modal */}
      <CustomerNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={userName}
        guestId={guestPlayerId}
        onNameSaved={(newName) => {
          setUserName(newName);
        }}
        onProfileSynced={(syncedUser) => {
          setUserName(syncedUser.name);
          setGuestPlayerId(syncedUser.guestId);
          setUserPoints(syncedUser.totalCafePoints);
          try {
            import("../../lib/playerSession").then(({ setClientPlayerIdentity }) => {
              setClientPlayerIdentity(syncedUser.guestId, syncedUser.name);
            });
          } catch {}
        }}
      />
    </div>
  );
}
