"use client";

import React, { useState, useEffect } from "react";
import { MiniGameConfig, GameDifficulty, GameRewardTier } from "../../types";
import { getStoreAntiFarmingAction, updateStoreAntiFarmingAction } from "../../app/actions/gameActions";

interface GameManagerTabProps {
  configs: MiniGameConfig[];
  onUpdateConfig: (updated: MiniGameConfig) => void;
  currentStore?: string;
}

const DIFFICULTY_META: Record<GameDifficulty, { label: string; color: string; desc: string; emoji: string }> = {
  easy: { label: "Easy", color: "#10B981", desc: "Relaxed pace, generous scoring — great for casual players", emoji: "🟢" },
  medium: { label: "Medium", color: "#F59E0B", desc: "Balanced challenge — the default experience", emoji: "🟡" },
  hard: { label: "Hard", color: "#FF4C29", desc: "Fast & tight — for competitive players chasing high scores", emoji: "🔴" },
  insane: { label: "Insane", color: "#8B5CF6", desc: "Maximum intensity — only the best survive", emoji: "💀" },
};

const DIFFICULTY_DETAILS: Record<string, Record<GameDifficulty, string>> = {
  "coffee-tower": {
    easy: "Slow speed (1.5), wide start (200px)",
    medium: "Normal speed (2.5), standard width (180px)",
    hard: "Fast speed (3.5), narrow (160px)",
    insane: "Blazing speed (5.0), tiny blocks (140px)",
  },
  "flappy-barista": {
    easy: "Large gap (180px), slow scroll (1.2x)",
    medium: "Normal gap (155px), standard scroll (1.6x)",
    hard: "Tight gap (130px), fast scroll (2.2x)",
    insane: "Tiny gap (110px), extreme scroll (3.0x)",
  },
  "barista-catch": {
    easy: "Slow fall (1.5x), rare spawns",
    medium: "Normal fall (2.2x), regular spawns",
    hard: "Fast fall (3.2x), frequent spawns",
    insane: "Extreme fall (4.5x), constant spawns",
  },
  "drop-merge": {
    easy: "Generous container, slow item bounce",
    medium: "Standard container, normal physics bounce",
    hard: "Narrow container, bouncy physics challenge",
    insane: "High-friction container, strict overflow line",
  },
  "brick-breaker": {
    easy: "Slow ball velocity, 1.5x hit power",
    medium: "Standard velocity, normal brick health",
    hard: "Fast ball speed, reinforced bricks",
    insane: "Ultra-fast ricochet, heavy armored bricks",
  },
  "helix-drop": {
    easy: "Wide gaps (45deg), slow rotation",
    medium: "Balanced gaps (30deg), standard speed",
    hard: "Narrow gaps (20deg), moving hazard sectors",
    insane: "Tiny gaps (12deg), shifting danger zones",
  },
  "sky-hopper": {
    easy: "Dense platforms, high springboard bounce",
    medium: "Balanced platforms, regular springs",
    hard: "Sparse platforms, moving clouds",
    insane: "Tiny breaking platforms, fast vertical scroll",
  },
  "air-hockey": {
    easy: "Standard puck speed, forgiving goal radius",
    medium: "Bouncy neon puck, standard goals",
    hard: "Fast ricochet speed, tight goal slots",
    insane: "Lightning puck physics, laser wall bounces",
  },
  "tap-war": {
    easy: "Gentle tug momentum, high tap responsiveness",
    medium: "Balanced laser tension, rapid tap response",
    hard: "Heavy laser tension, endurance tapping duel",
    insane: "High-decay laser resistance, blisteringly fast clash",
  },
  "spin-wheel": {
    easy: "Generous sectors, higher jackpot chances",
    medium: "Standard sectors, balanced chances",
    hard: "Tighter winning sectors, lower jackpot rate",
    insane: "Extremely small winning sectors, maximum risk",
  },
  "scratchcard": {
    easy: "Requires minor scratch area (30%) to reveal",
    medium: "Requires standard scratch area (50%) to reveal",
    hard: "Requires thorough scratch area (75%) to reveal",
    insane: "Requires near complete scratch area (95%) to reveal",
  },
  "neon-slots": {
    easy: "Fewer symbols, highly frequent payouts",
    medium: "Standard symbols, balanced payouts",
    hard: "Many symbols, rare payouts but higher reward value",
    insane: "Extreme symbols, ultra-rare jackpot payouts",
  },
  "plinko": {
    easy: "Fewer pegs, direct trajectories to high reward slots",
    medium: "Standard pegs, balanced trajectories",
    hard: "Dense pegs, highly randomized trajectories",
    insane: "Max density pegs, high risk of hitting zero or low reward slots",
  },
  "mystery-boba": {
    easy: "3 cups, 2 containing winning rewards",
    medium: "3 cups, 1 containing winning reward",
    hard: "4 cups, 1 containing winning reward",
    insane: "5 cups, 1 containing winning reward",
  },
  "precision-tap": {
    easy: "Wide target zone (35% - 65%), slow needle speed",
    medium: "Standard target zone (40% - 60%), medium needle speed",
    hard: "Narrow target zone (45% - 55%), fast needle speed",
    insane: "Razor-thin target zone (48% - 52%), blistering needle speed",
  },
  "lucky-dice": {
    easy: "Wins on sum >= 6, roll double probability boosted (+15%)",
    medium: "Wins on sum >= 8, standard dice roll probabilities",
    hard: "Wins on sum >= 10, roll double probability lowered (-10%)",
    insane: "Wins only on sum >= 11 or natural double 6s",
  },
  "rock-paper-scissors": {
    easy: "Barista Bot plays predictably (favors Rock)",
    medium: "Barista Bot plays random moves",
    hard: "Barista Bot uses pattern analysis to counter customer choice (55% counter rate)",
    insane: "Barista Bot has extreme counter prediction intelligence (75% counter rate)",
  },
};

export default function GameManagerTab({ configs, onUpdateConfig, currentStore }: GameManagerTabProps) {
  const [expandedGame, setExpandedGame] = useState<string | null>(configs[0]?.id || null);
  const [editingTier, setEditingTier] = useState<string | null>(null);

  // Anti-Farming & Dynamic Scaling State
  const [cooldownDays, setCooldownDays] = useState<number>(7);
  const [dynamicScaling, setDynamicScaling] = useState<boolean>(true);
  const [savingAntiFarming, setSavingAntiFarming] = useState(false);
  const [antiFarmingSavedMsg, setAntiFarmingSavedMsg] = useState<string | null>(null);
  const [loadingAntiFarming, setLoadingAntiFarming] = useState(false);

  useEffect(() => {
    async function loadAntiFarmingSettings() {
      setLoadingAntiFarming(true);
      try {
        const res = await getStoreAntiFarmingAction(currentStore);
        if (res.success) {
          if (typeof res.rewardCooldownDays === "number") setCooldownDays(res.rewardCooldownDays);
          if (typeof res.dynamicDifficultyScaling === "boolean") setDynamicScaling(res.dynamicDifficultyScaling);
        }
      } catch (e) {
        console.error("Failed to load anti-farming settings", e);
      } finally {
        setLoadingAntiFarming(false);
      }
    }
    loadAntiFarmingSettings();
  }, [currentStore]);

  const handleSaveAntiFarming = async () => {
    setSavingAntiFarming(true);
    setAntiFarmingSavedMsg(null);
    try {
      const res = await updateStoreAntiFarmingAction(currentStore || "", cooldownDays, dynamicScaling);
      if (res.success) {
        setAntiFarmingSavedMsg("Anti-farming rules saved successfully! 🎉");
        setTimeout(() => setAntiFarmingSavedMsg(null), 3500);
      } else {
        setAntiFarmingSavedMsg("Error: " + (res.error || "Failed to update"));
      }
    } catch (e: any) {
      setAntiFarmingSavedMsg("Error: " + (e.message || "Failed to update"));
    } finally {
      setSavingAntiFarming(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedGame(expandedGame === id ? null : id);
  };

  const updateField = <K extends keyof MiniGameConfig>(config: MiniGameConfig, field: K, value: MiniGameConfig[K]) => {
    onUpdateConfig({ ...config, [field]: value });
  };

  const addRewardTier = (config: MiniGameConfig) => {
    const newTier: GameRewardTier = {
      id: `tier-${Date.now()}`,
      pointThreshold: (config.rewardTiers.length + 1) * 50,
      rewardName: "",
      rewardDescription: "",
    };
    onUpdateConfig({ ...config, rewardTiers: [...config.rewardTiers, newTier] });
    setEditingTier(newTier.id);
  };

  const updateTier = (config: MiniGameConfig, tierId: string, field: keyof GameRewardTier, value: string | number) => {
    const updatedTiers = config.rewardTiers.map((t) =>
      t.id === tierId ? { ...t, [field]: value } : t
    );
    onUpdateConfig({ ...config, rewardTiers: updatedTiers });
  };

  const removeTier = (config: MiniGameConfig, tierId: string) => {
    onUpdateConfig({ ...config, rewardTiers: config.rewardTiers.filter((t) => t.id !== tierId) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-black text-black">Game Manager</h2>
          <p className="text-sm font-semibold text-black/50 mt-1">
            Configure rewards, difficulty & limits for customer-facing mini-games
          </p>
        </div>
        <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29]">
          {configs.filter((c) => c.enabled).length} / {configs.length} Games Active
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
          <p className="text-xs font-bold text-black/40 uppercase tracking-wider">Total Plays Today</p>
          <h3 className="font-serif text-2xl font-black mt-1">
            {configs.reduce((sum, c) => sum + (c.stats?.totalPlaysToday || 0), 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_#332FD0]">
          <p className="text-xs font-bold text-black/40 uppercase tracking-wider">Avg Score Across Games</p>
          <h3 className="font-serif text-2xl font-black mt-1">
            {configs.length > 0 ? Math.round(configs.reduce((sum, c) => sum + (c.stats?.avgScore || 0), 0) / configs.length) : 0}
          </h3>
        </div>
        <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
          <p className="text-xs font-bold text-black/40 uppercase tracking-wider">Rewards Claimed Today</p>
          <h3 className="font-serif text-2xl font-black mt-1">
            {configs.reduce((sum, c) => sum + (c.stats?.rewardsClaimed || 0), 0).toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Anti-Farming & Challenger Mode Card */}
      <div className="bg-white border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000]">
              🛡️
            </div>
            <div>
              <h3 className="font-serif text-lg font-black text-black">
                Customer Anti-Farming & Reward Cooldown Rules
              </h3>
              <p className="text-xs font-semibold text-black/60">
                Control reward cooldown windows per customer and enable automatic game difficulty scaling to prevent repetitive reward farming.
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveAntiFarming}
            disabled={savingAntiFarming}
            className="px-5 py-2.5 bg-black text-white text-xs font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:bg-[#FF4C29] transition-all disabled:opacity-50 cursor-pointer self-start md:self-center whitespace-nowrap"
          >
            {savingAntiFarming ? "Saving..." : "Save Anti-Farming Rules 💾"}
          </button>
        </div>

        {antiFarmingSavedMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <span>✅</span>
            <span>{antiFarmingSavedMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rule 1: Cooldown Window */}
          <div className="bg-[#FBF9F4] p-4 rounded-2xl border-2 border-black/20 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-black tracking-wider">
                  ⏱️ Same-Offer Cooldown Window
                </label>
                <span className="text-xs font-mono font-black bg-black text-white px-2 py-0.5 rounded-md">
                  {cooldownDays} Day{cooldownDays !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-black/60 mt-1">
                If a user wins an offer, they cannot win that same offer again for this duration. Any repeat wins award Cafe Points instead.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[
                { label: "1 Day", days: 1 },
                { label: "3 Days", days: 3 },
                { label: "7 Days (1 Wk)", days: 7 },
                { label: "14 Days (2 Wks)", days: 14 },
                { label: "30 Days (1 Mo)", days: 30 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setCooldownDays(preset.days)}
                  className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg border-2 border-black transition-all cursor-pointer ${
                    cooldownDays === preset.days
                      ? "bg-[#FF4C29] text-white shadow-[2px_2px_0px_0px_#000]"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-black/10">
              <span className="text-[10px] font-bold text-black/50">Custom Window:</span>
              <input
                type="number"
                min={1}
                max={365}
                value={cooldownDays}
                onChange={(e) => setCooldownDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white border-2 border-black rounded-lg text-center"
              />
              <span className="text-[10px] font-bold text-black/50">days per user</span>
            </div>
          </div>

          {/* Rule 2: Challenger Mode (Dynamic Difficulty Scaling) */}
          <div className="bg-[#FBF9F4] p-4 rounded-2xl border-2 border-black/20 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-black tracking-wider">
                  🔥 Challenger Mode (Dynamic Hard Mode)
                </label>
                <button
                  type="button"
                  onClick={() => setDynamicScaling(!dynamicScaling)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 border-black ${
                    dynamicScaling ? "bg-emerald-500" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dynamicScaling ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] font-semibold text-black/60 mt-1">
                When active, any customer who has earned an offer within their cooldown window faces automatically harder games (faster speeds, tighter obstacles, narrower towers).
              </p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-black/10 text-[10px] font-semibold text-black/70 flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>
                {dynamicScaling
                  ? "Active: Repeat players will see '🔥 Challenger Mode' and face higher difficulty."
                  : "Disabled: Games remain at standard configured difficulty for all players."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Cards */}
      {configs.map((config) => {
        const isExpanded = expandedGame === config.id;
        const diffMeta = DIFFICULTY_META[config.difficulty];
        const gameDetails = DIFFICULTY_DETAILS[config.slug] || {};

        return (
          <div
            key={config.id}
            className={`bg-white border-2 border-black rounded-3xl overflow-hidden transition-all ${
              isExpanded ? "shadow-[6px_6px_0px_0px_#000]" : "shadow-[4px_4px_0px_0px_#000]"
            }`}
          >
            {/* Card Header (always visible) */}
            <div
              onClick={() => toggleExpand(config.id)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/[0.02] transition-colors border-b-2 border-black bg-[#FBF9F4]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] flex items-center justify-center text-3xl">
                  {config.icon}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black text-black">{config.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${diffMeta.color}15`,
                        borderColor: diffMeta.color,
                        color: diffMeta.color,
                      }}
                    >
                      {diffMeta.emoji} {diffMeta.label}
                    </span>
                    <span className="text-xs font-bold text-black/40">
                      {config.rewardTiers.length} reward tier{config.rewardTiers.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs font-bold text-black/40">
                      {config.stats.totalPlaysToday} plays today
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Enable/Disable Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateField(config, "enabled", !config.enabled);
                  }}
                  className={`relative w-14 h-7 rounded-full border-2 border-black transition-colors ${
                    config.enabled ? "bg-[#10B981]" : "bg-black/10"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-black transition-transform ${
                      config.enabled ? "translate-x-7" : "translate-x-0.5"
                    }`}
                  />
                </button>

                {/* Expand arrow */}
                <span
                  className={`text-black/40 transition-transform text-lg ${isExpanded ? "rotate-180" : ""}`}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-6 space-y-8">
                {/* ─── Difficulty Selector ─────────────────── */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/50 mb-3 block">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["easy", "medium", "hard", "insane"] as GameDifficulty[]).map((diff) => {
                      const meta = DIFFICULTY_META[diff];
                      const isActive = config.difficulty === diff;
                      return (
                        <button
                          key={diff}
                          onClick={() => updateField(config, "difficulty", diff)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            isActive
                              ? "border-black shadow-[3px_3px_0px_0px_#000] translate-y-[-2px]"
                              : "border-black/15 hover:border-black/30"
                          }`}
                          style={{
                            backgroundColor: isActive ? `${meta.color}15` : "white",
                          }}
                        >
                          <span className="text-2xl block mb-1">{meta.emoji}</span>
                          <span
                            className="text-xs font-black block"
                            style={{ color: isActive ? meta.color : "#00000060" }}
                          >
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-semibold text-black/40 mt-2">
                    {diffMeta.desc}
                  </p>
                  <div
                    className="mt-2 text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg border"
                    style={{
                      backgroundColor: `${diffMeta.color}08`,
                      borderColor: `${diffMeta.color}30`,
                      color: diffMeta.color,
                    }}
                  >
                    ⚙️ {gameDetails[config.difficulty] || "Custom parameters"}
                  </div>
                </div>

                {/* ─── Max Daily Plays ─────────────────────── */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/50 mb-3 block">
                    Max Daily Plays per Customer
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={config.maxDailyPlays}
                      onChange={(e) => updateField(config, "maxDailyPlays", Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-3 py-2 rounded-xl border-2 border-black font-mono font-black text-center text-lg bg-white shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:shadow-[3px_3px_0px_0px_#FF4C29]"
                    />
                    <span className="text-sm font-bold text-black/50">
                      {config.maxDailyPlays === 0 ? "Unlimited plays" : `${config.maxDailyPlays} plays / day`}
                    </span>
                  </div>
                </div>

                {/* ─── Reward Tiers ─────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-black uppercase tracking-wider text-black/50">
                      Reward Tiers
                    </label>
                    <button
                      onClick={() => addRewardTier(config)}
                      className="px-3 py-1.5 bg-[#FF4C29] text-white rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                      + Add Tier
                    </button>
                  </div>

                  {config.rewardTiers.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-black/15 rounded-2xl">
                      <span className="text-3xl block mb-2">🎁</span>
                      <p className="text-sm font-bold text-black/30">No reward tiers configured</p>
                      <p className="text-xs font-semibold text-black/20 mt-1">
                        Add tiers to give customers rewards when they reach score milestones
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {config.rewardTiers
                        .sort((a, b) => a.pointThreshold - b.pointThreshold)
                        .map((tier, idx) => {
                          const isEditing = editingTier === tier.id;
                          return (
                            <div
                              key={tier.id}
                              className={`rounded-2xl border-2 border-black overflow-hidden transition-all ${
                                isEditing ? "shadow-[4px_4px_0px_0px_#FF4C29]" : "shadow-[2px_2px_0px_0px_#000]"
                              }`}
                            >
                              <div className="flex items-center gap-3 p-3 bg-[#FBF9F4]">
                                {/* Tier badge */}
                                <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#10B981]">
                                  #{idx + 1}
                                </div>

                                {/* Point threshold */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-black/40">Score ≥</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={tier.pointThreshold}
                                    onChange={(e) =>
                                      updateTier(config, tier.id, "pointThreshold", Math.max(1, parseInt(e.target.value) || 0))
                                    }
                                    className="w-20 px-2 py-1.5 rounded-lg border-2 border-black font-mono font-black text-center text-sm bg-white focus:outline-none focus:border-[#FF4C29]"
                                  />
                                  <span className="text-xs font-bold text-black/40">pts</span>
                                </div>

                                <div className="flex-1" />

                                {/* Edit / Delete */}
                                <button
                                  onClick={() => setEditingTier(isEditing ? null : tier.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-black border-2 transition-all ${
                                    isEditing
                                      ? "bg-black text-white border-black"
                                      : "bg-white text-black border-black/20 hover:border-black"
                                  }`}
                                >
                                  {isEditing ? "Done" : "Edit"}
                                </button>
                                <button
                                  onClick={() => removeTier(config, tier.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-black text-red-500 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Editable fields */}
                              {isEditing && (
                                <div className="p-4 bg-white border-t-2 border-black space-y-3">
                                  <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-black/40 block mb-1">
                                      Reward Name
                                    </label>
                                    <input
                                      type="text"
                                      value={tier.rewardName}
                                      onChange={(e) => updateTier(config, tier.id, "rewardName", e.target.value)}
                                      placeholder="e.g. Free Coffee, 20% Off, Free Pastry"
                                      className="w-full px-3 py-2 rounded-xl border-2 border-black font-bold text-sm bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_#FF4C29] placeholder:text-black/20"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-black/40 block mb-1">
                                      Reward Description
                                    </label>
                                    <input
                                      type="text"
                                      value={tier.rewardDescription}
                                      onChange={(e) => updateTier(config, tier.id, "rewardDescription", e.target.value)}
                                      placeholder="e.g. Any regular size coffee of your choice"
                                      className="w-full px-3 py-2 rounded-xl border-2 border-black font-semibold text-sm bg-white focus:outline-none focus:shadow-[2px_2px_0px_0px_#FF4C29] placeholder:text-black/20"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Preview row (when not editing) */}
                              {!isEditing && (tier.rewardName || tier.rewardDescription) && (
                                <div className="px-4 py-2 bg-white border-t border-black/10 flex items-center gap-2">
                                  <span className="text-sm">🎁</span>
                                  <span className="text-xs font-bold text-black/70">
                                    {tier.rewardName || "Unnamed Reward"}
                                  </span>
                                  {tier.rewardDescription && (
                                    <span className="text-xs font-semibold text-black/35">
                                      — {tier.rewardDescription}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* ─── Game Stats ───────────────────────────── */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-black/50 mb-3 block">
                    Today&apos;s Performance
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#FBF9F4] rounded-xl p-3 border border-black/10 text-center">
                      <p className="text-[10px] font-bold text-black/40 uppercase">Plays</p>
                      <p className="font-serif text-xl font-black">{config.stats.totalPlaysToday}</p>
                    </div>
                    <div className="bg-[#FBF9F4] rounded-xl p-3 border border-black/10 text-center">
                      <p className="text-[10px] font-bold text-black/40 uppercase">Avg Score</p>
                      <p className="font-serif text-xl font-black">{config.stats.avgScore}</p>
                    </div>
                    <div className="bg-[#FBF9F4] rounded-xl p-3 border border-black/10 text-center">
                      <p className="text-[10px] font-bold text-black/40 uppercase">Rewards Claimed</p>
                      <p className="font-serif text-xl font-black text-[#10B981]">{config.stats.rewardsClaimed}</p>
                    </div>
                  </div>
                </div>

                {/* ─── Preview Link ────────────────────────── */}
                <div className="flex items-center justify-between p-4 bg-[#FBF9F4] rounded-2xl border-2 border-black/10">
                  <div>
                    <p className="text-xs font-black text-black/50 uppercase tracking-wider">Test This Game</p>
                    <p className="text-sm font-mono font-bold text-black/70 mt-0.5">/play/{config.slug}</p>
                  </div>
                  <a
                    href={`/play/${config.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 bg-black text-white rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    Open Preview →
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
