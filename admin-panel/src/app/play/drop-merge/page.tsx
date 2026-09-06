"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

interface ItemDef {
  tier: number;
  name: string;
  emoji: string;
  r: number;
  color: string;
  points: number;
}

const TIERS: ItemDef[] = [
  { tier: 0, name: "Cherry", emoji: "🍒", r: 16, color: "#EF4444", points: 2 },
  { tier: 1, name: "Strawberry", emoji: "🍓", r: 22, color: "#F43F5E", points: 4 },
  { tier: 2, name: "Grape", emoji: "🍇", r: 28, color: "#8B5CF6", points: 8 },
  { tier: 3, name: "Orange", emoji: "🍊", r: 35, color: "#F97316", points: 16 },
  { tier: 4, name: "Apple", emoji: "🍎", r: 44, color: "#DC2626", points: 32 },
  { tier: 5, name: "Diamond", emoji: "💎", r: 54, color: "#06B6D4", points: 64 },
  { tier: 6, name: "Crown", emoji: "👑", r: 66, color: "#EAB308", points: 128 },
  { tier: 7, name: "Super Star", emoji: "🌟", r: 80, color: "#FACC15", points: 256 },
];

interface PhysBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tier: number;
  r: number;
  color: string;
  emoji: string;
  settled: boolean;
  scale: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

const W = 340;
const H = 520;
const DANGER_Y = 90;
const GRAVITY = 0.35;
const BOUNCE = 0.28;
const FRICTION = 0.985;

export default function DropMergeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("playing");
  const [nextTier, setNextTier] = useState<number>(0);
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  const ballsRef = useRef<PhysBall[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const aimXRef = useRef<number>(W / 2);
  const isDraggingRef = useRef<boolean>(false);
  const canDropRef = useRef<boolean>(true);
  const dangerTimerRef = useRef<number>(0);
  const nextBallIdRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);
  const fRef = useRef<number>(0);

  const spawnParticles = (x: number, y: number, color: string) => {
    if (particlesRef.current.length > 30) {
      particlesRef.current.splice(0, 15);
    }
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const spd = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        life: 0,
        max: 20 + Math.random() * 10,
        color,
      });
    }
  };

  const getRandomDropTier = () => {
    // Drop only smaller tiers 0 to 2
    return Math.floor(Math.random() * 3);
  };

  const dropCurrentBall = useCallback(() => {
    if (!canDropRef.current || gameState !== "playing") return;
    canDropRef.current = false;

    const t = nextTier;
    const def = TIERS[t];
    const newBall: PhysBall = {
      id: nextBallIdRef.current++,
      x: Math.max(def.r + 5, Math.min(W - def.r - 5, aimXRef.current)),
      y: 50,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2.5,
      tier: t,
      r: def.r,
      color: def.color,
      emoji: def.emoji,
      settled: false,
      scale: 1,
    };
    ballsRef.current.push(newBall);
    ArcadeAudio.playDrop();

    // Prepare next drop after 400ms delay
    setTimeout(() => {
      setNextTier(getRandomDropTier());
      canDropRef.current = true;
    }, 450);
  }, [gameState, nextTier]);

  // Main Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;

    const loop = () => {
      fRef.current++;
      const balls = ballsRef.current;
      const particles = particlesRef.current;

      // --- Physics Update ---
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        b.vy += GRAVITY;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= FRICTION;

        // Wall collisions
        if (b.x - b.r < 8) {
          b.x = 8 + b.r;
          b.vx = -b.vx * BOUNCE;
        } else if (b.x + b.r > W - 8) {
          b.x = W - 8 - b.r;
          b.vx = -b.vx * BOUNCE;
        }

        // Floor collision
        if (b.y + b.r > H - 10) {
          b.y = H - 10 - b.r;
          b.vy = -b.vy * BOUNCE;
          if (Math.abs(b.vy) < 0.3) b.vy = 0;
        }

        // Animated growth pop
        if (b.scale < 1) {
          b.scale = Math.min(1, b.scale + 0.1);
        }
      }

      // Ball-to-ball collisions & merging
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];
          if (!b1 || !b2) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.r + b2.r;

          if (dist < minDist) {
            // Check for merge
            if (b1.tier === b2.tier && b1.tier < TIERS.length - 1) {
              const nextT = b1.tier + 1;
              const nextDef = TIERS[nextT];
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;

              balls.splice(j, 1);
              balls.splice(i, 1);

              const mergedBall: PhysBall = {
                id: nextBallIdRef.current++,
                x: midX,
                y: midY,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2,
                tier: nextT,
                r: nextDef.r,
                color: nextDef.color,
                emoji: nextDef.emoji,
                settled: false,
                scale: 0.6,
              };
              balls.push(mergedBall);

              scoreRef.current += nextDef.points;
              setScore(scoreRef.current);
              ArcadeAudio.playBonus();
              spawnParticles(midX, midY, nextDef.color);
              break;
            }

            // Normal elastic bounce
            const overlap = minDist - dist;
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);

            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            const relVx = b2.vx - b1.vx;
            const relVy = b2.vy - b1.vy;
            const impulse = (relVx * nx + relVy * ny) * 0.5;

            b1.vx += nx * impulse;
            b1.vy += ny * impulse;
            b2.vx -= nx * impulse;
            b2.vy -= ny * impulse;
          }
        }
      }

      // Check danger line overflow
      let inDanger = false;
      for (const b of balls) {
        if (b.y - b.r < DANGER_Y && Math.abs(b.vy) < 0.5) {
          inDanger = true;
          break;
        }
      }

      if (inDanger) {
        dangerTimerRef.current++;
        if (dangerTimerRef.current > 160 && gameState === "playing") {
          setGameState("gameover");
          ArcadeAudio.playCrash();

          const fs = scoreRef.current;
          if (fs > bestScore) setBestScore(fs);
          const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila") : "Downtown Tacos & Tequila";
          submitGameSessionAction({
            gameSlug: "drop-merge",
            score: fs,
            storeName: targetStore,
            duration: Math.max(3, Math.round(fRef.current / 60)),
          }).then((res) => {
            if (res.limitReached) setLimitNotice(res.error || "Daily limit reached.");
            if (res.success && res.rewardEarned && res.claimCode) {
              setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
            }
          });
        }
      } else {
        dangerTimerRef.current = Math.max(0, dangerTimerRef.current - 1);
      }

      // --- Draw Canvas ---
      ctx.clearRect(0, 0, W, H);

      // Background jar
      ctx.fillStyle = "#FAF8F5";
      ctx.fillRect(8, 0, W - 16, H - 10);

      // Border walls
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 0, W - 16, H - 10);

      // Danger line
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = dangerTimerRef.current > 60 ? "#EF4444" : "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, DANGER_Y);
      ctx.lineTo(W - 8, DANGER_Y);
      ctx.stroke();
      ctx.restore();

      // Drop aim guide
      if (canDropRef.current && gameState === "playing") {
        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(aimXRef.current, 50);
        ctx.lineTo(aimXRef.current, H - 10);
        ctx.stroke();
        ctx.restore();

        // Dropping preview ball at aim pos
        const pDef = TIERS[nextTier];
        ctx.save();
        ctx.fillStyle = pDef.color;
        ctx.beginPath();
        ctx.arc(aimXRef.current, 50, pDef.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = `${pDef.r}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pDef.emoji, aimXRef.current, 50);
        ctx.restore();
      }

      // Draw Balls
      for (const b of balls) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.scale, b.scale);

        // Circle body
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1A1A1A";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Highlight sheen
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(-b.r * 0.3, -b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.font = `${Math.round(b.r * 1.1)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.emoji, 0, 1);

        ctx.restore();
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.max;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (p.life >= p.max) particles.splice(i, 1);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, nextTier, bestScore]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    updateAimX(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current || e.pointerType === "mouse") updateAimX(e);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dropCurrentBall();
    }
  };

  // Global release listener so releasing outside canvas always drops properly
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dropCurrentBall();
      }
    };
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, [dropCurrentBall]);

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        aimXRef.current = Math.max(30, aimXRef.current - 18);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        aimXRef.current = Math.min(W - 30, aimXRef.current + 18);
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown" || e.key === "s") {
        dropCurrentBall();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, dropCurrentBall]);

  const updateAimX = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const scale = W / rect.width;
    aimXRef.current = Math.max(30, Math.min(W - 30, clientX * scale));
  };

  const resetGame = () => {
    ballsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    dangerTimerRef.current = 0;
    canDropRef.current = true;
    isDraggingRef.current = false;
    setScore(0);
    setEarnedReward(null);
    setLimitNotice(null);
    setGameState("playing");
    setNextTier(getRandomDropTier());
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-between p-3 select-none">
      {/* Header */}
      <header className="w-full max-w-md bg-gradient-to-r from-[#111] to-[#222] text-white p-3.5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍉</span>
          <div>
            <h1 className="font-serif font-black text-base leading-tight">Drop & Merge</h1>
            <p className="text-[9px] font-bold text-[#FF4C29] tracking-widest uppercase">
              Endless Merge Arcade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-[9px] font-bold text-white/50 uppercase block">Next</span>
            <span className="text-xl">{TIERS[nextTier]?.emoji}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-white/50 uppercase block">Score</span>
            <span className="font-mono text-emerald-400 font-black text-lg">{score}</span>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className="w-full max-w-md bg-white border-3 border-black rounded-3xl shadow-[6px_6px_0px_0px_#000] flex flex-col items-center my-3 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="block rounded-3xl cursor-crosshair"
          style={{ width: "100%", maxWidth: W, height: "auto", aspectRatio: `${W}/${H}`, touchAction: "none" }}
        />

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center text-white z-40 rounded-3xl">
            <span className="text-6xl mb-2">💥</span>
            <h2 className="font-serif text-3xl font-black text-[#FF4C29] mb-1">OVERFLOW!</h2>
            <p className="text-xs text-white/60 mb-4">Gems reached the top border!</p>

            <div className="bg-white text-black w-full p-4 rounded-2xl border-2 border-black mb-3 shadow-[3px_3px_0px_0px_#FF4C29]">
              <span className="text-[9px] font-black uppercase text-black/40 tracking-widest">Final Score</span>
              <h3 className="font-serif text-4xl font-black text-[#FF4C29]">{score}</h3>
            </div>

            {limitNotice && (
              <div className="bg-amber-400 text-black w-full p-2.5 rounded-xl border-2 border-black mb-3 text-xs font-black">
                ⏳ {limitNotice}
              </div>
            )}

            {earnedReward && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-black w-full p-3 rounded-xl border-2 border-black mb-3 text-center animate-bounce">
                <span className="text-[10px] font-black uppercase block text-black/60">🎉 YOU WON A REWARD!</span>
                <h4 className="font-serif text-base font-black">{earnedReward.rewardName}</h4>
                <p className="font-mono font-black text-xs bg-black text-white px-2 py-0.5 rounded-md inline-block my-1">
                  Code: {earnedReward.claimCode}
                </p>
                <Link
                  href={`/claim/${earnedReward.claimCode}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/claim/${earnedReward.claimCode}`;
                  }}
                  className="mt-2 block w-full py-2 px-3 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-wider text-center border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-800 active:scale-95 transition-transform cursor-pointer"
                >
                  SHOW TO STAFF AT COUNTER 📱
                </Link>
              </div>
            )}

            <button
              onClick={resetGame}
              className="w-full py-3.5 bg-emerald-400 text-black rounded-xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-bold text-black/40 pb-1">
        Drag to aim • Release to drop & merge
      </footer>
    </div>
  );
}
