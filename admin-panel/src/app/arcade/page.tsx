"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getMiniGameConfigsAction, getStoreBrandingAction } from "../actions/adminActions";

interface GameCard {
  slug: string;
  name: string;
  type: string;
  icon: string;
  description: string;
  rewardHighlight: string;
  color: string;
  shadowColor: string;
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
    color: "bg-[#14B8A6]",
    shadowColor: "shadow-[4px_4px_0px_0px_#14B8A6]",
    popular: true,
  },
];

export default function ArcadeLandingPage() {
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userName, setUserName] = useState<string>("Player");
  const [games, setGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [storeName, setStoreName] = useState("Brew & Bites Arcade");

  useEffect(() => {
    // Read store parameter from URL query string (e.g. ?store=downtown-tacos-tequila)
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
    }

    // Fetch customer profile & points from API
    fetch("/api/rewards/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserPoints(data.user.totalCafePoints || 0);
          setUserName(data.user.name || "Player");
        }
      })
      .catch(() => {});

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
              const topReward = c.rewardTiers && c.rewardTiers.length > 0 ? c.rewardTiers[0].rewardName : "Instant Rewards";
              
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

              return {
                slug: c.slug,
                name: c.name,
                type: typeLabel,
                icon: c.icon,
                description: desc,
                rewardHighlight: `Win ${topReward}`,
                color,
                shadowColor,
                popular: true,
              };
            });
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
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="font-serif font-black text-xl text-white">{storeName}</h1>
          </div>
          <p className="text-xs font-bold text-white/60 mt-0.5">
            Welcome, <span className="text-emerald-400 font-bold">{userName}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/50 uppercase block">Reward Points</span>
          <span className="font-mono text-emerald-400 font-black text-xl">+{userPoints} PTS</span>
        </div>
      </header>

      {/* Main Arcade Menu */}
      <main className="w-full max-w-md flex flex-col gap-4 flex-1">
        
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
          <h3 className="font-serif text-lg font-black text-black">Available Arcade Games</h3>
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
                  🔥 POPULAR
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${game.color} border-3 border-black flex items-center justify-center text-3xl text-white shadow-[3px_3px_0px_0px_#000]`}>
                  {game.icon}
                </div>
                <div className="flex-1 pr-12">
                  <h4 className="font-serif text-lg font-black text-black">{game.name}</h4>
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-wider block">
                    {game.type}
                  </span>
                  <p className="text-xs font-semibold text-black/60 mt-1 leading-snug">
                    {game.description}
                  </p>
                </div>
              </div>

              {/* Reward Highlight Badge */}
              <div className="bg-[#FBF9F4] p-3 rounded-2xl border-2 border-black flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏆</span>
                  <span className="text-xs font-bold text-emerald-700">{game.rewardHighlight}</span>
                </div>
                <Link
                  href={`/play/${game.slug}`}
                  className="py-2.5 px-4 bg-black text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:bg-[#FF4C29] transition-all whitespace-nowrap"
                >
                  PLAY NOW 🚀
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs font-bold text-black/40 py-2">
        Scan QR at your spot • Play mini-games to win exclusive rewards
      </footer>
    </div>
  );
}
