"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

const W = 340;
const H = 540;
const ROUNDS_TO_WIN = 2; // Best of 3
const TAP_POWER = 9.5;
const DECAY_RATE = 0.08;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export default function TapWarGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [roundsP1, setRoundsP1] = useState(0);
  const [roundsP2, setRoundsP2] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "roundover" | "gameover">("idle");
  const [roundWinner, setRoundWinner] = useState<"p1" | "p2" | null>(null);
  const [matchWinner, setMatchWinner] = useState<"p1" | "p2" | null>(null);
  const [vsBot, setVsBot] = useState(false);
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Mutable Physics
  const beamYRef = useRef(H / 2);
  const beamVelRef = useRef(0);
  const sparksRef = useRef<Spark[]>([]);
  const roundsP1Ref = useRef(0);
  const roundsP2Ref = useRef(0);
  const totalTapsP1Ref = useRef(0);
  const totalTapsP2Ref = useRef(0);
  const matchDurationRef = useRef(0);

  // Spawn Plasma Sparks
  const spawnSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      sparksRef.current.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3.5,
        life: 0,
        maxLife: 15 + Math.random() * 12,
      });
    }
  };

  // Reset for next round
  const resetRound = useCallback(() => {
    beamYRef.current = H / 2;
    beamVelRef.current = 0;
    setRoundWinner(null);
    setGameState("playing");
  }, []);

  // Initialize Game
  const initGame = useCallback((playWithBot = false) => {
    setVsBot(playWithBot);
    roundsP1Ref.current = 0;
    roundsP2Ref.current = 0;
    totalTapsP1Ref.current = 0;
    totalTapsP2Ref.current = 0;
    setRoundsP1(0);
    setRoundsP2(0);
    setMatchWinner(null);
    setEarnedReward(null);
    setLimitNotice(null);
    matchDurationRef.current = Date.now();

    resetRound();
  }, [resetRound]);

  // Handle Player Tap
  const handleTap = (player: "p1" | "p2", tapX: number) => {
    if (gameState !== "playing") return;
    ArcadeAudio.init();

    if (player === "p1") {
      // P1 pushes beam UP (decreasing beamY)
      totalTapsP1Ref.current++;
      beamVelRef.current -= TAP_POWER;
      spawnSparks(tapX, beamYRef.current, "#38BDF8", 8);
      ArcadeAudio.playTap();
    } else {
      // P2 pushes beam DOWN (increasing beamY)
      totalTapsP2Ref.current++;
      beamVelRef.current += TAP_POWER;
      spawnSparks(tapX, beamYRef.current, "#F43F5E", 8);
      ArcadeAudio.playTap();
    }
  };

  // Touch Handler for simultaneous taps
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    ArcadeAudio.init();
    if (gameState === "idle") {
      initGame(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const cx = (t.clientX - rect.left) * scaleX;
      const cy = (t.clientY - rect.top) * scaleY;

      if (cy > H / 2) {
        handleTap("p1", cx);
      } else if (!vsBot) {
        handleTap("p2", cx);
      }
    }
  };

  // Mouse fallback
  const handleMouseDown = (e: React.MouseEvent) => {
    ArcadeAudio.init();
    if (gameState === "idle") {
      initGame(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if (cy > H / 2) {
      handleTap("p1", cx);
    } else if (!vsBot) {
      handleTap("p2", cx);
    }
  };

  // Keyboard listener for desktop tapping
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === "idle") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          initGame(true);
        }
        return;
      }
      if (gameState !== "playing") return;

      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowDown") {
        e.preventDefault();
        handleTap("p1", W / 2 + (Math.random() - 0.5) * 60);
      } else if (["KeyW", "ArrowUp"].includes(e.code)) {
        e.preventDefault();
        if (!vsBot) {
          handleTap("p2", W / 2 + (Math.random() - 0.5) * 60);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, vsBot, initGame]);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let botTapTimer = 0;

    const loop = () => {
      // --- UPDATE PHYSICS ---
      if (gameState === "playing") {
        // Bot AI tapping if in vsBot mode with dynamic excitement pacing
        if (vsBot) {
          botTapTimer++;
          const beamRatio = beamYRef.current / H; // 0 is bot losing, 1 is bot winning
          let threshold = 8;
          if (beamRatio < 0.35) {
            // Player is close to winning - bot rallies with rapid defensive taps!
            threshold = 5 + Math.random() * 3;
          } else if (beamRatio > 0.68) {
            // Bot is far ahead - give the player breathing room to make a heroic comeback
            threshold = 10 + Math.random() * 5;
          } else {
            // Balanced back-and-forth contest
            threshold = 7 + Math.random() * 3;
          }

          if (botTapTimer >= threshold) {
            botTapTimer = 0;
            handleTap("p2", W / 2 + (Math.random() - 0.5) * 100);
          }
        }

        // Apply beam velocity & spring-like damping
        beamYRef.current += beamVelRef.current;
        beamVelRef.current *= 0.84; // Friction damping

        // Restoring force toward center if no one taps
        const centerOffset = beamYRef.current - H / 2;
        beamYRef.current -= centerOffset * DECAY_RATE * 0.05;

        // Check Round Win Thresholds
        const TOP_THRESHOLD = 50; // P1 wins round
        const BOTTOM_THRESHOLD = H - 50; // P2 wins round

        if (beamYRef.current <= TOP_THRESHOLD) {
          // PLAYER 1 WINS ROUND!
          roundsP1Ref.current += 1;
          const currentP1 = roundsP1Ref.current;
          setRoundsP1(currentP1);
          setRoundWinner("p1");
          ArcadeAudio.playBonus();
          spawnSparks(W / 2, 60, "#38BDF8", 35);

          if (currentP1 >= ROUNDS_TO_WIN) {
            setMatchWinner("p1");
            setGameState("gameover");
            ArcadeAudio.playPerfect(5);

            const elapsedSec = Math.max(10, Math.floor((Date.now() - matchDurationRef.current) / 1000));
            const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "") : "";
            submitGameSessionAction({
              gameSlug: "tap-war",
              score: totalTapsP1Ref.current,
              storeName: targetStore,
              duration: elapsedSec,
            }).then((res) => {
              if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
              if (res?.success && res?.rewardEarned && res?.claimCode) {
                setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
              }
            });
          } else {
            setGameState("roundover");
            setTimeout(resetRound, 1400);
          }
        } else if (beamYRef.current >= BOTTOM_THRESHOLD) {
          // PLAYER 2 WINS ROUND!
          roundsP2Ref.current += 1;
          const currentP2 = roundsP2Ref.current;
          setRoundsP2(currentP2);
          setRoundWinner("p2");
          ArcadeAudio.playBonus();
          spawnSparks(W / 2, H - 60, "#F43F5E", 35);

          if (currentP2 >= ROUNDS_TO_WIN) {
            setMatchWinner("p2");
            setGameState("gameover");
            ArcadeAudio.playPerfect(5);

            const elapsedSec = Math.max(10, Math.floor((Date.now() - matchDurationRef.current) / 1000));
            const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "") : "";
            submitGameSessionAction({
              gameSlug: "tap-war",
              score: totalTapsP2Ref.current,
              storeName: targetStore,
              duration: elapsedSec,
            }).then((res) => {
              if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
              if (res?.success && res?.rewardEarned && res?.claimCode) {
                setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
              }
            });
          } else {
            setGameState("roundover");
            setTimeout(resetRound, 1400);
          }
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, W, H);

      const by = beamYRef.current;

      // Player 2 Territory (Top Half: Neon Rose/Fuchsia)
      const p2Grad = ctx.createLinearGradient(0, 0, 0, by);
      p2Grad.addColorStop(0, "#3B071E");
      p2Grad.addColorStop(1, "#831843");
      ctx.fillStyle = p2Grad;
      ctx.fillRect(0, 0, W, by);

      // Player 1 Territory (Bottom Half: Neon Cyan/Blue)
      const p1Grad = ctx.createLinearGradient(0, by, 0, H);
      p1Grad.addColorStop(0, "#0369A1");
      p1Grad.addColorStop(1, "#082F49");
      ctx.fillStyle = p1Grad;
      ctx.fillRect(0, by, W, H - by);

      // Center Dividing Plasma Beam
      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#F43F5E";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(W, by);
      ctx.stroke();

      // Outer glow line
      ctx.strokeStyle = "#FDE047";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Player 2 Zone Labels & Score (Rotated 180° for Tabletop View)
      ctx.save();
      ctx.translate(W / 2, by / 2);
      ctx.rotate(Math.PI);

      ctx.font = "black 32px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(vsBot ? "BOT 🤖" : "PLAYER 2 ⚡", 0, -10);

      // Round circles for P2
      const p2Circles = "● ".repeat(roundsP2Ref.current) + "○ ".repeat(ROUNDS_TO_WIN - roundsP2Ref.current);
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#FDA4AF";
      ctx.fillText(p2Circles.trim(), 0, 24);
      ctx.restore();

      // Player 1 Zone Labels & Score (Standard view)
      ctx.save();
      ctx.translate(W / 2, by + (H - by) / 2);

      ctx.font = "black 32px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PLAYER 1 ⚡", 0, -10);

      // Round circles for P1
      const p1Circles = "● ".repeat(roundsP1Ref.current) + "○ ".repeat(ROUNDS_TO_WIN - roundsP1Ref.current);
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#7DD3FC";
      ctx.fillText(p1Circles.trim(), 0, 24);
      ctx.restore();

      // Render Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const alpha = 1 - s.life / s.maxLife;

        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1, s.size * alpha), 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (s.life >= s.maxLife) {
          sparksRef.current.splice(i, 1);
        }
      }

      // Round Winner Overlay
      if (gameState === "roundover") {
        ctx.fillStyle = "rgba(10, 15, 26, 0.75)";
        ctx.fillRect(0, 0, W, H);

        ctx.font = "black 28px sans-serif";
        ctx.fillStyle = roundWinner === "p1" ? "#38BDF8" : "#F43F5E";
        ctx.textAlign = "center";
        ctx.fillText(roundWinner === "p1" ? "ROUND TO P1! 🔥" : "ROUND TO P2! 🔥", W / 2, H / 2 - 10);

        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#E2E8F0";
        ctx.fillText("Next round starting...", W / 2, H / 2 + 25);
      }

      // Start Screen Overlay
      if (gameState === "idle") {
        ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#F43F5E";
        ctx.font = "black 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TAP WAR 2P", W / 2, H / 2 - 40);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "13px sans-serif";
        ctx.fillText("Frantic 2-Player Rapid-Tap Tug-of-War", W / 2, H / 2 - 12);
        ctx.fillText("Push the laser line into opponent's zone!", W / 2, H / 2 + 10);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, vsBot, resetRound]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-2 select-none">
      {/* Header Bar */}
      <div className="w-[340px] flex justify-between items-center mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">⚡</span>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
            Tap War 2P
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
            BEST OF 3
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          className="cursor-pointer block touch-none"
        />

        {/* Start Game Mode Modal */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-3xl mb-3 border border-fuchsia-500/40">
              ⚡
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              TAP WAR 2P
            </h2>
            <p className="text-neutral-400 text-xs mb-6 max-w-[240px]">
              Tap as fast as you can to push the laser beam into the other player’s side!
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-[240px]">
              <button
                onClick={() => {
                  ArcadeAudio.init();
                  initGame(false);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-fuchsia-500/30 active:scale-98 transition"
              >
                👥 2 PLAYERS (SAME PHONE)
              </button>

              <button
                onClick={() => {
                  ArcadeAudio.init();
                  initGame(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs border border-neutral-700 active:scale-98 transition"
              >
                🤖 PRACTICE VS BOT
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-3xl mb-2 border border-amber-500/40">
              🏆
            </div>

            {matchWinner === "p1" ? (
              <div>
                <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                  Player 1 Victory!
                </span>
                <h2 className="text-2xl font-black text-white mb-1">
                  BLUE WINS THE MATCH!
                </h2>
              </div>
            ) : (
              <div>
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
                  {vsBot ? "Bot Victory" : "Player 2 Victory!"}
                </span>
                <h2 className="text-2xl font-black text-white mb-1">
                  RED WINS THE MATCH!
                </h2>
              </div>
            )}

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 w-full mb-4 mt-3">
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <span className="text-[11px] text-cyan-400 font-bold block">P1 (BLUE)</span>
                  <span className="text-2xl font-black text-white">{roundsP1} Wins</span>
                </div>
                <span className="text-neutral-500 font-bold text-sm">VS</span>
                <div className="text-center">
                  <span className="text-[11px] text-rose-400 font-bold block">
                    {vsBot ? "BOT" : "P2 (RED)"}
                  </span>
                  <span className="text-2xl font-black text-white">{roundsP2} Wins</span>
                </div>
              </div>
            </div>

            {earnedReward && (
              <div className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl p-3 mb-4 text-left">
                <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                  Reward Unlocked!
                </div>
                <div className="text-sm font-black text-white">
                  {earnedReward.rewardName}
                </div>
                <div className="text-xs text-amber-200 mt-1 font-mono">
                  Code: {earnedReward.claimCode}
                </div>
              </div>
            )}

            {limitNotice && (
              <div className="text-xs text-amber-400 mb-3 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2 w-full">
                {limitNotice}
              </div>
            )}

            <button
              onClick={() => {
                ArcadeAudio.init();
                initGame(vsBot);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/25 transition active:scale-[0.98]"
            >
              Play Rematch
            </button>
          </div>
        )}
      </div>

      {/* Tabletop Play Guide */}
      <div className="w-[340px] mt-2 flex items-center justify-between text-neutral-500 text-[11px] px-2 font-medium">
        <span>⚡ Tap screen or ⌨️ Space/Enter</span>
        <span>Best of 3 rounds</span>
      </div>
    </div>
  );
}
