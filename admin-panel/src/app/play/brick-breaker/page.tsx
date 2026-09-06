"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

interface Brick {
  id: number;
  r: number;
  c: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  collected: boolean;
}

const W = 340;
const H = 520;
const COLS = 7;
const BRICK_H = 26;
const BRICK_PAD = 4;
const BRICK_W = (W - (COLS + 1) * BRICK_PAD) / COLS;
const BALL_SPEED = 9.8;
const FLOOR_Y = H - 55;

export default function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [totalBalls, setTotalBalls] = useState(25);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"aiming" | "shooting" | "gameover">("aiming");
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const isAimingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(W / 2);
  const startYRef = useRef<number>(FLOOR_Y - 6);
  const nextStartXRef = useRef<number>(W / 2);
  const hasFirstBallLandedRef = useRef<boolean>(false);
  const ballsSpawnedRef = useRef<number>(0);
  const shootTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const shootStartTimeRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  const totalBallsRef = useRef<number>(25);

  const getBrickColor = (hp: number, max: number) => {
    const ratio = hp / (max || 1);
    if (ratio > 0.7) return "#FF4C29";
    if (ratio > 0.4) return "#F59E0B";
    return "#10B981";
  };

  // Spawn new row of bricks at row 1
  const spawnRow = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    const newPowerUps: PowerUp[] = [];

    for (let c = 0; c < COLS; c++) {
      const rand = Math.random();
      const x = BRICK_PAD + c * (BRICK_W + BRICK_PAD);
      const y = 58;

      if (rand < 0.52) {
        const hp = lvl + Math.floor(Math.random() * 2);
        newBricks.push({
          id: Math.random(),
          r: 1,
          c,
          x,
          y,
          w: BRICK_W,
          h: BRICK_H,
          hp,
          maxHp: hp,
          color: getBrickColor(hp, hp),
        });
      } else if (rand < 0.68) {
        newPowerUps.push({
          x: x + BRICK_W / 2,
          y: y + BRICK_H / 2,
          collected: false,
        });
      }
    }

    // Shift existing bricks down
    bricksRef.current.forEach((b) => {
      b.y += BRICK_H + BRICK_PAD;
      b.r++;
    });

    powerUpsRef.current.forEach((p) => {
      p.y += BRICK_H + BRICK_PAD;
    });

    bricksRef.current = [...bricksRef.current, ...newBricks];
    powerUpsRef.current = [...powerUpsRef.current, ...newPowerUps];
  }, []);

  // Initialize first game board
  useEffect(() => {
    bricksRef.current = [];
    powerUpsRef.current = [];
    spawnRow(1);
    spawnRow(2);
  }, [spawnRow]);

  // Recall all balls immediately (Failsafe & Fast Forward)
  const recallAllBalls = useCallback(() => {
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];
    ballsRef.current.forEach((b) => {
      b.active = false;
    });
  }, []);

  // Shoot balls in sequence
  const shoot = useCallback(() => {
    if (gameState !== "aiming") return;
    ArcadeAudio.init();
    setGameState("shooting");
    setSpeedMultiplier(1);
    hasFirstBallLandedRef.current = false;
    ballsSpawnedRef.current = 0;
    ballsRef.current = [];
    shootStartTimeRef.current = Date.now();

    const angle = aimAngleRef.current;
    const baseVx = Math.cos(angle) * BALL_SPEED;
    const baseVy = Math.sin(angle) * BALL_SPEED;

    const count = totalBallsRef.current;
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];

    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        ballsRef.current.push({
          x: startXRef.current,
          y: startYRef.current,
          vx: baseVx,
          vy: baseVy,
          active: true,
        });
        ballsSpawnedRef.current++;
        if (i % 4 === 0) ArcadeAudio.playTap();
      }, i * 36);
      shootTimeoutsRef.current.push(t);
    }
  }, [gameState]);

  // Main Canvas & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;

    const loop = () => {
      const balls = ballsRef.current;
      const bricks = bricksRef.current;
      const powerUps = powerUpsRef.current;

      // Update active balls physics
      if (gameState === "shooting") {
        const elapsed = (Date.now() - shootStartTimeRef.current) / 1000;
        // Auto speed-up after 8s, auto recall after 13s to prevent any freeze
        const speedFactor = elapsed > 8 ? 2.5 : 1.0;

        for (let i = 0; i < balls.length; i++) {
          const b = balls[i];
          if (!b.active) continue;

          b.x += b.vx * speedFactor;
          b.y += b.vy * speedFactor;

          // Prevent infinite horizontal trap
          if (Math.abs(b.vy) < 0.6) {
            b.vy = b.vy < 0 ? -0.9 : 0.9;
          }

          // Left / Right wall collisions
          if (b.x - 4 <= 8) {
            b.x = 12;
            b.vx = Math.abs(b.vx);
          } else if (b.x + 4 >= W - 8) {
            b.x = W - 12;
            b.vx = -Math.abs(b.vx);
          }

          // Ceiling collision
          if (b.y - 4 <= 45) {
            b.y = 49;
            b.vy = Math.abs(b.vy);
          }

          // Floor line collision
          if (b.y + 4 >= FLOOR_Y) {
            b.active = false;
            b.y = FLOOR_Y - 6;

            if (!hasFirstBallLandedRef.current) {
              hasFirstBallLandedRef.current = true;
              nextStartXRef.current = Math.max(18, Math.min(W - 18, b.x));
            }
          }

          // Brick collisions
          for (let j = bricks.length - 1; j >= 0; j--) {
            const br = bricks[j];
            if (
              b.x + 4 >= br.x &&
              b.x - 4 <= br.x + br.w &&
              b.y + 4 >= br.y &&
              b.y - 4 <= br.y + br.h
            ) {
              const prevX = b.x - b.vx * speedFactor;
              const prevY = b.y - b.vy * speedFactor;

              if (prevX < br.x || prevX > br.x + br.w) b.vx = -b.vx;
              else b.vy = -b.vy;

              br.hp--;
              br.color = getBrickColor(br.hp, br.maxHp);
              scoreRef.current += 1;
              setScore(scoreRef.current);
              ArcadeAudio.playCatch();

              if (br.hp <= 0) {
                bricks.splice(j, 1);
                ArcadeAudio.playBonus();
              }
              break;
            }
          }

          // Power-up collisions (+1 balls)
          for (let k = 0; k < powerUps.length; k++) {
            const p = powerUps[k];
            if (!p.collected && Math.hypot(b.x - p.x, b.y - p.y) < 13) {
              p.collected = true;
              totalBallsRef.current += 1;
              setTotalBalls(totalBallsRef.current);
              ArcadeAudio.playScore();
            }
          }
        }

        // Check if turn finished (clean robust condition)
        const allSpawned = ballsSpawnedRef.current >= totalBallsRef.current;
        const activeCount = balls.filter((b) => b.active).length;
        const timedOut = elapsed > 13;

        if ((allSpawned && activeCount === 0) || timedOut) {
          startXRef.current = nextStartXRef.current;
          startYRef.current = FLOOR_Y - 6;
          ballsRef.current = [];

          // Check gameover condition (any brick touches/passes floor line)
          let lost = false;
          for (const br of bricks) {
            if (br.y + br.h >= FLOOR_Y) {
              lost = true;
              break;
            }
          }

          if (lost) {
            setGameState("gameover");
            ArcadeAudio.playCrash();

            const targetStore =
              typeof window !== "undefined"
                ? sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila"
                : "Downtown Tacos & Tequila";

            submitGameSessionAction({
              gameSlug: "brick-breaker",
              score: scoreRef.current,
              storeName: targetStore,
              duration: levelRef.current * 15,
            }).then((res) => {
              if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
              if (res?.success && res.rewardEarned && res.claimCode) {
                setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
              }
            });
          } else {
            levelRef.current++;
            setLevel(levelRef.current);
            spawnRow(levelRef.current);
            setGameState("aiming");
          }
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, W, H);

      // Outer Arena Border
      ctx.strokeStyle = "#262626";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 45, W - 16, H - 55);

      // Floor Baseline
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, FLOOR_Y);
      ctx.lineTo(W - 8, FLOOR_Y);
      ctx.stroke();

      // Draw Power-ups (+1 orbs)
      for (const p of powerUps) {
        if (p.collected) continue;
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+1", p.x, p.y);
      }

      // Draw Bricks
      for (const br of bricks) {
        ctx.fillStyle = br.color;
        ctx.beginPath();
        ctx.roundRect(br.x, br.y, br.w, br.h, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(br.hp), br.x + br.w / 2, br.y + br.h / 2);
      }

      // Draw Aiming Guide & Launcher
      if (gameState === "aiming") {
        const sx = startXRef.current;
        const sy = startYRef.current;
        const angle = aimAngleRef.current;

        // Dotted Aim Trajectory Line (10 dots)
        ctx.save();
        for (let d = 1; d <= 10; d++) {
          const dist = d * 22;
          const dotX = sx + Math.cos(angle) * dist;
          const dotY = sy + Math.sin(angle) * dist;
          if (dotY < 50 || dotX < 14 || dotX > W - 14) break;

          ctx.fillStyle = `rgba(255, 76, 41, ${1 - d * 0.08})`;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Launcher Base Ball
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FF4C29";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ball Count Badge above launcher
        ctx.fillStyle = "#94A3B8";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`x${totalBallsRef.current}`, sx, sy - 12);
      }

      // Draw Active Flying Balls
      for (const b of balls) {
        if (!b.active) continue;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, spawnRow]);

  // Update Aim Angle from pointer event
  const updateAimAngle = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;

    const dx = px - startXRef.current;
    const dy = py - startYRef.current;

    // Both direct upward pointing and slingshot drag supported naturally
    let angle = Math.atan2(dy, dx);
    if (dy > 0) {
      // User dragged downwards (slingshot): flip to upward angle
      angle = Math.atan2(-dy, -dx);
    }

    // Lock aiming upward only (avoid shooting completely sideways/flat)
    if (angle > -0.12) angle = -0.12;
    if (angle < -Math.PI + 0.12) angle = -Math.PI + 0.12;
    aimAngleRef.current = angle;
  };

  // Pointer Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameState !== "aiming") return;
    isAimingRef.current = true;
    updateAimAngle(clientX, clientY);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isAimingRef.current && gameState === "aiming") {
      updateAimAngle(clientX, clientY);
    }
  };

  const handlePointerUp = () => {
    if (isAimingRef.current && gameState === "aiming") {
      isAimingRef.current = false;
      shoot();
    }
  };

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "aiming") {
        if (e.key === "ArrowLeft" || e.key === "a") {
          aimAngleRef.current = Math.max(-Math.PI + 0.12, aimAngleRef.current - 0.08);
        } else if (e.key === "ArrowRight" || e.key === "d") {
          aimAngleRef.current = Math.min(-0.12, aimAngleRef.current + 0.08);
        } else if (e.key === " " || e.key === "Enter") {
          shoot();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, shoot]);

  // Global pointer up listener
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isAimingRef.current && gameState === "aiming") {
        isAimingRef.current = false;
        shoot();
      }
    };
    window.addEventListener("pointerup", handleGlobalUp);
    return () => window.removeEventListener("pointerup", handleGlobalUp);
  }, [gameState, shoot]);

  const resetGame = () => {
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];
    bricksRef.current = [];
    powerUpsRef.current = [];
    ballsRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    totalBallsRef.current = 25;
    startXRef.current = W / 2;
    startYRef.current = FLOOR_Y - 6;
    setLevel(1);
    setScore(0);
    setTotalBalls(25);
    setEarnedReward(null);
    setLimitNotice(null);
    setGameState("aiming");
    spawnRow(1);
    spawnRow(2);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-between p-3 select-none">
      {/* Header */}
      <header className="w-full max-w-md bg-[#171717] p-3.5 rounded-2xl border border-neutral-800 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧱</span>
          <div>
            <h1 className="font-serif font-black text-base leading-tight">Swipe Breaker</h1>
            <p className="text-[10px] font-bold text-[#FF4C29] tracking-wider uppercase">
              Wave {level} • {totalBalls} Balls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {gameState === "shooting" && (
            <button
              onClick={recallAllBalls}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold border border-amber-500/30 active:scale-95 transition"
            >
              ⚡ Recall (x2)
            </button>
          )}

          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Score</span>
            <span className="font-mono text-emerald-400 font-black text-lg">{score}</span>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col items-center my-2 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onTouchStart={(e) => {
            e.preventDefault();
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handlePointerUp}
          className="block rounded-3xl cursor-crosshair touch-none"
          style={{ width: "100%", maxWidth: W, height: "auto", aspectRatio: `${W}/${H}` }}
        />

        {/* Start / Aiming Guidance */}
        {gameState === "aiming" && (
          <div className="absolute top-14 left-0 right-0 pointer-events-none flex justify-center">
            <div className="bg-black/80 backdrop-blur-md border border-neutral-700 text-neutral-300 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              👆 Drag anywhere & release to launch
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center text-white z-40 rounded-3xl animate-in fade-in">
            <span className="text-5xl mb-2">💥</span>
            <h2 className="font-serif text-2xl font-black text-[#FF4C29] mb-1">WALL BREACHED!</h2>
            <p className="text-xs text-neutral-400 mb-4">Bricks reached the baseline</p>

            <div className="bg-neutral-900 border border-neutral-800 w-full p-4 rounded-2xl mb-3 shadow-md">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Blocks Smashed</span>
              <h3 className="font-serif text-3xl font-black text-[#FF4C29]">{score}</h3>
            </div>

            {limitNotice && (
              <div className="bg-amber-950/50 text-amber-300 border border-amber-800/40 w-full p-2.5 rounded-xl mb-3 text-xs font-bold">
                {limitNotice}
              </div>
            )}

            {earnedReward && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-white w-full p-3 rounded-xl mb-3 text-left">
                <span className="text-[10px] font-black uppercase text-amber-300 block">Reward Unlocked!</span>
                <h4 className="text-sm font-black text-white">{earnedReward.rewardName}</h4>
                <p className="font-mono text-xs text-amber-200 mt-0.5">Code: {earnedReward.claimCode}</p>
              </div>
            )}

            <button
              onClick={resetGame}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition cursor-pointer"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </main>

      <footer className="text-center text-xs font-medium text-neutral-400 pb-1">
        Drag on screen to aim • Release to shoot all balls
      </footer>
    </div>
  );
}
