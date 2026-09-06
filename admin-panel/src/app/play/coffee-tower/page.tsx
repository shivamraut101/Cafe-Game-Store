"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Matter from "matter-js";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

const ITEMS = [
  { name: "Bonus Block ⭐", color: "#FF4C29" },
  { name: "Gem Block 💎", color: "#F59E0B" },
  { name: "Golden Block 👑", color: "#EC4899" },
  { name: "Mystery Block 🎁", color: "#8B5CF6" },
  { name: "Lucky Block 🍀", color: "#10B981" },
  { name: "Super Block ⚡", color: "#332FD0" },
  { name: "Prize Block 🏆", color: "#D97706" },
];

const CANVAS_W = 320;
const CANVAS_H = 420;
const BLOCK_H = 30;
const BASE_Y = CANVAS_H - 40;
const INITIAL_WIDTH = 160;

export default function CoffeeTowerGame() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [cooldownNotice, setCooldownNotice] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [isChallenger, setIsChallenger] = useState(false);

  // Challenger Mode detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("challengerMode") === "true") {
        setIsChallenger(true);
      }
      const targetStore = sessionStorage.getItem("selectedStore") || "adda-99";
      import("../../actions/gameActions").then(({ getPlayerChallengerStatusAction }) => {
        getPlayerChallengerStatusAction(undefined, targetStore).then((res) => {
          if (res.success && res.isChallenger) {
            setIsChallenger(true);
            sessionStorage.setItem("challengerMode", "true");
          }
        }).catch(() => {});
      });
    }
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Game logic refs (mutable, no re-render needed)
  const stackRef = useRef<Matter.Body[]>([]);
  const sliderRef = useRef({ x: 80, width: INITIAL_WIDTH, dir: 1, speed: 2.2 });
  const sliderAnimRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const gameStateRef = useRef<"start" | "playing" | "gameover">("start");
  const lastTapTimeRef = useRef<number>(0);

  // Keep ref in sync
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // Wait time counter
  useEffect(() => {
    const t = setInterval(() => setWaitTime((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // High-performance audio synth with combo scaling
  const playSound = useCallback((type: "drop" | "perfect" | "crash", comboCount: number = 0) => {
    if (type === "drop") ArcadeAudio.playDrop();
    else if (type === "perfect") ArcadeAudio.playPerfect(comboCount);
    else ArcadeAudio.playCrash();
  }, []);

  // Boot Matter.js once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.5 } });
    engineRef.current = engine;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: {
        width: CANVAS_W,
        height: CANVAS_H,
        wireframes: false,
        background: "#FBF9F4",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;

    // Ground
    const ground = Matter.Bodies.rectangle(CANVAS_W / 2, CANVAS_H - 15, CANVAS_W + 40, 30, {
      isStatic: true,
      render: { fillStyle: "#1A1A1A" },
    });
    // Walls
    const lw = Matter.Bodies.rectangle(-15, CANVAS_H / 2, 30, CANVAS_H + 200, { isStatic: true, render: { visible: false } });
    const rw = Matter.Bodies.rectangle(CANVAS_W + 15, CANVAS_H / 2, 30, CANVAS_H + 200, { isStatic: true, render: { visible: false } });

    Matter.Composite.add(engine.world, [ground, lw, rw]);

    // Custom afterRender: draw the sliding block on top of physics canvas
    Matter.Events.on(render, "afterRender", () => {
      if (gameStateRef.current !== "playing") return;
      const ctx = render.context;
      const s = sliderRef.current;
      const item = ITEMS[scoreRef.current % ITEMS.length];

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.roundRect(s.x + 3, 33, s.width, BLOCK_H, 8);
      ctx.fill();

      // Block body
      ctx.fillStyle = item.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(s.x, 30, s.width, BLOCK_H, 8);
      ctx.fill();
      ctx.stroke();

      // Text label with smart sizing and clipping so text NEVER overflows or hangs outside
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(s.x, 30, s.width, BLOCK_H, 8);
      ctx.clip();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let label = item.name;
      if (s.width < 55) {
        // Narrow block: show only the emoji icon
        const emojiMatch = item.name.match(/\p{Extended_Pictographic}/u);
        label = emojiMatch ? emojiMatch[0] : "";
      } else if (s.width < 95) {
        // Medium block: show compact name, e.g. "Lucky 🍀"
        const parts = item.name.split(" ");
        label = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : item.name;
      }

      if (label) {
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(label, s.x + s.width / 2, 30 + BLOCK_H / 2);
      }
      ctx.restore();
    });

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    return () => {
      if (sliderAnimRef.current) cancelAnimationFrame(sliderAnimRef.current);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Slider animation loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (sliderAnimRef.current) cancelAnimationFrame(sliderAnimRef.current);
      return;
    }

    const tick = () => {
      const s = sliderRef.current;
      s.x += s.dir * s.speed;
      if (s.x + s.width >= CANVAS_W) { s.dir = -1; s.x = CANVAS_W - s.width; }
      if (s.x <= 0) { s.dir = 1; s.x = 0; }
      sliderAnimRef.current = requestAnimationFrame(tick);
    };
    sliderAnimRef.current = requestAnimationFrame(tick);
    return () => { if (sliderAnimRef.current) cancelAnimationFrame(sliderAnimRef.current); };
  }, [gameState]);

  // --- Game Actions ---

  const clearDynamicBodies = useCallback(() => {
    if (!engineRef.current) return;
    const all = Matter.Composite.allBodies(engineRef.current.world);
    all.forEach((b) => {
      if (!b.isStatic || (b.position.y < CANVAS_H - 40 && b.position.y > 10)) {
        Matter.Composite.remove(engineRef.current!.world, b);
      }
    });
  }, []);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;
    clearDynamicBodies();
    const startW = isChallenger ? 130 : INITIAL_WIDTH;
    const startSpeed = isChallenger ? 3.0 : 2.2;

    // Base table block
    const base = Matter.Bodies.rectangle(CANVAS_W / 2, BASE_Y, startW, BLOCK_H, {
      isStatic: true,
      chamfer: { radius: 6 },
      render: { fillStyle: "#1A1A1A", strokeStyle: "#000", lineWidth: 2.5 },
    });
    Matter.Composite.add(engineRef.current.world, base);
    stackRef.current.push(base);

    sliderRef.current = { x: 80, width: startW, dir: 1, speed: startSpeed };
    setScore(0); setCombo(0); setGameState("playing");
    // Start grace period: prevent the tap that started the game from dropping block 1
    lastTapTimeRef.current = performance.now() + 350;
  }, [clearDynamicBodies, isChallenger]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    // Strict debounce: reject any duplicate/synthetic mobile events within 260ms
    if (now < lastTapTimeRef.current || now - lastTapTimeRef.current < 260) {
      return;
    }
    lastTapTimeRef.current = now;

    // Only drop block during active gameplay
    if (gameState !== "playing" || !engineRef.current) return;

    const engine = engineRef.current;
    const stack = stackRef.current;
    const s = sliderRef.current;
    const topBody = stack[stack.length - 1];

    // Compare slider center to top block center
    const sliderLeft = s.x;
    const sliderRight = s.x + s.width;
    const topLeft = topBody.position.x - topBody.bounds.max.x + topBody.bounds.min.x + topBody.position.x;
    // simpler: use bounds
    const tl = topBody.bounds.min.x;
    const tr = topBody.bounds.max.x;

    // Overlap calculation
    const overlapLeft = Math.max(sliderLeft, tl);
    const overlapRight = Math.min(sliderRight, tr);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 5) {
      // TOTAL MISS -> DRAMATIC TOWER COLLAPSE
      playSound("crash");

      // Convert entire stack to dynamic bodies with explosive force
      stack.forEach((body, idx) => {
        Matter.Body.setStatic(body, false);
        body.restitution = 0.6;
        body.friction = 0.05;
        const pushDir = sliderLeft > tl ? 1 : -1;
        Matter.Body.setVelocity(body, {
          x: pushDir * (stack.length - idx) * 1.5 + (Math.random() - 0.5) * 3,
          y: -(Math.random() * 4 + 1),
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
      });

      // Also drop the slider block itself as debris
      const item = ITEMS[scoreRef.current % ITEMS.length];
      const missedBlock = Matter.Bodies.rectangle(
        s.x + s.width / 2, 30 + BLOCK_H / 2, s.width, BLOCK_H,
        { chamfer: { radius: 6 }, restitution: 0.5, friction: 0.1, render: { fillStyle: item.color, strokeStyle: "#000", lineWidth: 2 } }
      );
      Matter.Body.setVelocity(missedBlock, { x: (Math.random() - 0.5) * 5, y: 2 });
      Matter.Body.setAngularVelocity(missedBlock, (Math.random() - 0.5) * 0.3);
      Matter.Composite.add(engine.world, missedBlock);

      if (window.navigator?.vibrate) window.navigator.vibrate([200, 100, 300]);

      stackRef.current = [];
      const fs = scoreRef.current;
      if (fs > highScore) setHighScore(fs);
      setEarnedPoints((p) => p + fs * 10);
      setGameState("gameover");
      lastTapTimeRef.current = performance.now() + 650; // Buffer to prevent accidental dismissal of Game Over screen

      // Submit session & check for reward vouchers via Server Action
      const targetStoreName = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila") : "Downtown Tacos & Tequila";
      submitGameSessionAction({
        gameSlug: "coffee-tower",
        score: fs,
        storeName: targetStoreName,
        duration: Math.max(2, waitTime),
      }).then((res) => {
        if (res.limitReached) {
          setLimitNotice(res.error || "Daily limit reached for this game.");
        } else if (res.cooldownNotice) {
          setCooldownNotice(res.cooldownNotice);
        }
        if (res.success && res.rewardEarned && res.claimCode) {
          setEarnedReward({
            rewardName: res.rewardEarned.rewardName,
            claimCode: res.claimCode,
          });
        }
      });
      return;
    }

    // --- There IS overlap: place a new block and spawn overhang debris ---
    const overlapCenterX = (overlapLeft + overlapRight) / 2;
    const topOfStack = topBody.position.y - BLOCK_H;

    // Perfect check
    const isPerfect = Math.abs(overlapWidth - s.width) < 5;
    if (isPerfect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      playSound("perfect", nextCombo);
      setShowPerfect(true);
      setTimeout(() => setShowPerfect(false), 700);
      if (window.navigator?.vibrate) window.navigator.vibrate([30, 40, 30]);
    } else {
      setCombo(0);
      playSound("drop");
      if (window.navigator?.vibrate) window.navigator.vibrate(50);

      // Spawn overhang slice(s) as REAL Matter.js dynamic bodies!
      const item = ITEMS[scoreRef.current % ITEMS.length];

      // Left overhang?
      if (sliderLeft < tl) {
        const ohW = tl - sliderLeft;
        const ohBody = Matter.Bodies.rectangle(
          sliderLeft + ohW / 2, topOfStack, ohW, BLOCK_H,
          { chamfer: { radius: 4 }, restitution: 0.4, friction: 0.05, density: 0.002,
            render: { fillStyle: item.color, strokeStyle: "#000", lineWidth: 2 } }
        );
        Matter.Body.setVelocity(ohBody, { x: -3 - Math.random() * 2, y: -1 });
        Matter.Body.setAngularVelocity(ohBody, -0.15 - Math.random() * 0.15);
        Matter.Composite.add(engine.world, ohBody);
      }

      // Right overhang?
      if (sliderRight > tr) {
        const ohW = sliderRight - tr;
        const ohBody = Matter.Bodies.rectangle(
          tr + ohW / 2, topOfStack, ohW, BLOCK_H,
          { chamfer: { radius: 4 }, restitution: 0.4, friction: 0.05, density: 0.002,
            render: { fillStyle: item.color, strokeStyle: "#000", lineWidth: 2 } }
        );
        Matter.Body.setVelocity(ohBody, { x: 3 + Math.random() * 2, y: -1 });
        Matter.Body.setAngularVelocity(ohBody, 0.15 + Math.random() * 0.15);
        Matter.Composite.add(engine.world, ohBody);
      }
    }

    // Place the PERFECTLY ALIGNED new stack block (static)
    const item = ITEMS[(scoreRef.current + 1) % ITEMS.length];
    const newBlock = Matter.Bodies.rectangle(overlapCenterX, topOfStack, overlapWidth, BLOCK_H, {
      isStatic: true,
      chamfer: { radius: 6 },
      render: { fillStyle: item.color, strokeStyle: "#000", lineWidth: 2.5 },
    });
    Matter.Composite.add(engine.world, newBlock);
    stack.push(newBlock);

    setScore((p) => p + 1);

    // If tower grows too tall, shift everything down
    if (topOfStack < 100) {
      const shift = BLOCK_H;
      stack.forEach((b) => Matter.Body.setPosition(b, { x: b.position.x, y: b.position.y + shift }));
      // Also shift all dynamic debris bodies
      Matter.Composite.allBodies(engine.world).forEach((b) => {
        if (!b.isStatic) {
          Matter.Body.setPosition(b, { x: b.position.x, y: b.position.y + shift });
        }
      });
    }

    // Prune off-screen fallen debris to maintain 60 FPS physics
    Matter.Composite.allBodies(engine.world).forEach((b) => {
      if (!b.isStatic && b.position.y > CANVAS_H + 80) {
        Matter.Composite.remove(engine.world, b);
      }
    });

    // Update slider for next round
    s.width = overlapWidth;
    s.x = 0; s.dir = 1;
    const accel = isChallenger ? 0.25 : 0.18;
    s.speed = Math.min(8, s.speed + accel);
  }, [gameState, startGame, playSound, highScore, combo, isChallenger]);

  // Keyboard spacebar controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTap]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div
      onPointerDown={(e) => {
        // Only react during active gameplay! Never react on start or gameover screens
        if (gameStateRef.current !== "playing") return;
        if (!e.isPrimary) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest("a, button, input, [role='button']")) return;
        handleTap();
      }}
      className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-between p-4 select-none touch-none cursor-pointer"
    >
      {/* Header */}
      <header className="w-full max-w-[360px] bg-black text-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <div>
              <h1 className="font-serif font-black text-lg leading-tight">Tower Stack</h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[10px] font-bold text-[#FF4C29] tracking-widest uppercase">
                  Arcade Challenge
                </p>
                {isChallenger && (
                  <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded border border-white/30 uppercase animate-pulse">
                    🔥 HARD MODE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-white/50 uppercase block">Points</span>
          <span className="font-mono text-emerald-400 font-black text-lg">{earnedPoints}</span>
        </div>
      </header>

      {/* Game Card */}
      <main className="w-full max-w-[360px] bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] flex flex-col items-center my-4 relative overflow-hidden">
        {/* HUD */}
        <div className="w-full flex justify-between items-center p-3 z-10">
          <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_#FF4C29]">
            {score} BLOCKS
          </div>
          {showPerfect && (
            <div className="bg-emerald-400 text-black px-3 py-1 rounded-full text-xs font-black border-2 border-black animate-bounce shadow-[2px_2px_0px_0px_#000]">
              ✨ PERFECT x{combo}!
            </div>
          )}
          <div className="text-xs font-black text-black/40">BEST: {highScore}</div>
        </div>

        {/* Matter.js Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full block rounded-b-2xl"
          style={{ width: "100%", height: "auto", aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        />

        {/* Start Overlay */}
        {gameState === "start" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-40 rounded-3xl">
            <span className="text-7xl mb-3 animate-bounce">🏗️</span>
            <h2 className="font-serif text-3xl font-black mb-2">Tower Stack</h2>
            <p className="text-xs text-white/70 max-w-xs mb-6">
              Stack blocks as high as possible! Overhang slices tumble with <strong>real Matter.js physics</strong>. Miss completely and the whole tower collapses!
            </p>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center cursor-pointer active:scale-95 transition-transform"
            >
              TAP ANYWHERE TO PLAY 🚀
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white z-40 rounded-3xl">
            <span className="text-6xl mb-2">💥</span>
            <h2 className="font-serif text-3xl font-black text-red-500 mb-1">TOWER COLLAPSED!</h2>
            <p className="text-xs font-bold text-white/60 mb-4">Watch the blocks tumble below!</p>

            <div className="bg-white text-black w-full p-4 rounded-2xl border-2 border-black mb-4 shadow-[4px_4px_0px_0px_#FF4C29]">
              <span className="text-[10px] font-black uppercase text-black/50 tracking-wider">HEIGHT REACHED</span>
              <h3 className="font-serif text-3xl font-black text-[#FF4C29]">{score} BLOCKS</h3>
              <p className="text-[11px] font-bold text-emerald-700 mt-1">+{score * 10} Reward Points earned</p>
            </div>

            {limitNotice && (
              <div className="bg-amber-400 text-black w-full p-3 rounded-2xl border-2 border-black mb-4 text-xs font-black text-center shadow-[3px_3px_0px_0px_#000]">
                ⏳ {limitNotice}
              </div>
            )}

            {cooldownNotice && !earnedReward && (
              <div className="bg-blue-100 text-blue-900 w-full p-3 rounded-2xl border-2 border-blue-400 mb-4 text-xs font-bold text-center">
                ℹ️ {cooldownNotice}
              </div>
            )}

            {/* Earned Reward Voucher Banner */}
            {earnedReward && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-black w-full p-4 rounded-2xl border-2 border-black mb-4 shadow-[4px_4px_0px_0px_#000] text-center animate-bounce">
                <span className="text-[10px] font-black uppercase tracking-wider block text-black/60">🎉 YOU WON A REWARD!</span>
                <h4 className="font-serif text-lg font-black my-0.5">{earnedReward.rewardName}</h4>
                <p className="font-mono font-black text-xs bg-black text-white px-3 py-1 rounded-lg inline-block my-1">
                  Code: {earnedReward.claimCode}
                </p>
                <Link
                  href={`/claim/${earnedReward.claimCode}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/claim/${earnedReward.claimCode}`;
                  }}
                  className="mt-3 block w-full py-3 px-4 bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider text-center border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-800 active:scale-95 transition-transform cursor-pointer"
                >
                  SHOW TO STAFF AT COUNTER 📱
                </Link>
              </div>
            )}

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="w-full py-4 bg-emerald-400 text-black rounded-2xl font-black text-base border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center cursor-pointer active:scale-95 transition-transform"
            >
              TAP TO PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-bold text-black/50 pb-2">
        Powered by Matter.js Physics • Tap to drop & stack
      </footer>
    </div>
  );
}
