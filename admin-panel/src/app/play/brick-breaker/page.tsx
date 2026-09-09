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

interface HitParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

const W = 340;
const H = 520;
const COLS = 7;
const BRICK_H = 26;
const BRICK_PAD = 4;
const BRICK_W = (W - (COLS + 1) * BRICK_PAD) / COLS;
const BASE_BALL_SPEED = 14.2; // Turbocharged base velocity (was 9.8)
const FLOOR_Y = H - 55;

export default function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [totalBalls, setTotalBalls] = useState(20);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"aiming" | "shooting" | "gameover">("aiming");
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<HitParticle[]>([]);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const isAimingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(W / 2);
  const startYRef = useRef<number>(FLOOR_Y - 8);
  const nextStartXRef = useRef<number>(W / 2);
  const hasFirstBallLandedRef = useRef<boolean>(false);
  const landedCountRef = useRef<number>(0);
  const ballsSpawnedRef = useRef<number>(0);
  const shootTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const shootStartTimeRef = useRef<number>(0);

  const scoreRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  const totalBallsRef = useRef<number>(20);

  const getBrickColor = (hp: number, max: number) => {
    const ratio = hp / (max || 1);
    if (ratio > 0.7) return "#FF4C29";
    if (ratio > 0.4) return "#F59E0B";
    return "#10B981";
  };

  const spawnParticles = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        alpha: 1.0,
        size: 2 + Math.random() * 2.5,
      });
    }
  };

  // Spawn new row of bricks at top
  const spawnRow = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    const newPowerUps: PowerUp[] = [];

    for (let c = 0; c < COLS; c++) {
      const rand = Math.random();
      const x = BRICK_PAD + c * (BRICK_W + BRICK_PAD);
      const y = 58;

      if (rand < 0.55) {
        const hp = Math.max(1, lvl + Math.floor(Math.random() * 2));
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
      } else if (rand < 0.70) {
        newPowerUps.push({
          x: x + BRICK_W / 2,
          y: y + BRICK_H / 2,
          collected: false,
        });
      }
    }

    // Shift existing rows down
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

  // Instant Recall all flying balls (Fast-forward to next turn immediately)
  const recallAllBalls = useCallback(() => {
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];

    if (!hasFirstBallLandedRef.current) {
      hasFirstBallLandedRef.current = true;
      nextStartXRef.current = startXRef.current;
    }

    ballsRef.current.forEach((b) => {
      b.active = false;
    });
    ballsSpawnedRef.current = totalBallsRef.current;
    landedCountRef.current = totalBallsRef.current;
  }, []);

  // Turbocharged stream launch
  const shoot = useCallback(() => {
    if (gameState !== "aiming") return;
    ArcadeAudio.init();
    setGameState("shooting");
    hasFirstBallLandedRef.current = false;
    landedCountRef.current = 0;
    ballsSpawnedRef.current = 0;
    ballsRef.current = [];
    shootStartTimeRef.current = Date.now();

    const angle = aimAngleRef.current;
    const baseVx = Math.cos(angle) * BASE_BALL_SPEED;
    const baseVy = Math.sin(angle) * BASE_BALL_SPEED;

    const count = totalBallsRef.current;
    shootTimeoutsRef.current.forEach(clearTimeout);
    shootTimeoutsRef.current = [];

    // Rapid stream interval: all balls launched within ~200-260ms max
    const intervalMs = Math.max(7, Math.min(15, Math.floor(220 / Math.max(1, count))));

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
        if (i % 5 === 0) ArcadeAudio.playTap();
      }, i * intervalMs);
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
      const particles = particlesRef.current;

      // Update active particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Update active balls physics
      if (gameState === "shooting") {
        const elapsed = (Date.now() - shootStartTimeRef.current) / 1000;

        // Auto speed-up curve: fast right away, hyper speed after 2s, auto-recall at 4.5s
        let speedFactor = 1.1;
        if (elapsed > 1.0) speedFactor = 1.9;
        if (elapsed > 2.0) speedFactor = 3.0;
        if (elapsed > 3.2) speedFactor = 4.2;
        if (elapsed > 4.5) {
          recallAllBalls();
        }

        // Sub-step physics to guarantee NO tunneling through bricks at high speeds
        const subSteps = Math.ceil(speedFactor);
        const stepMultiplier = speedFactor / subSteps;

        for (let step = 0; step < subSteps; step++) {
          for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (!b.active) continue;

            b.x += b.vx * stepMultiplier;
            b.y += b.vy * stepMultiplier;

            // Prevent horizontal trapping
            if (Math.abs(b.vy) < 0.8) {
              b.vy = b.vy < 0 ? -1.2 : 1.2;
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

            // Floor baseline collision
            if (b.y + 4 >= FLOOR_Y) {
              b.active = false;
              b.y = FLOOR_Y - 8;
              landedCountRef.current++;

              if (!hasFirstBallLandedRef.current) {
                hasFirstBallLandedRef.current = true;
                nextStartXRef.current = Math.max(20, Math.min(W - 20, b.x));
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
                const prevX = b.x - b.vx * stepMultiplier;
                const prevY = b.y - b.vy * stepMultiplier;

                if (prevX < br.x || prevX > br.x + br.w) b.vx = -b.vx;
                else b.vy = -b.vy;

                br.hp--;
                br.color = getBrickColor(br.hp, br.maxHp);
                scoreRef.current += 1;
                setScore(scoreRef.current);

                spawnParticles(b.x, b.y, br.color, 4);
                ArcadeAudio.playCatch();

                if (br.hp <= 0) {
                  spawnParticles(br.x + br.w / 2, br.y + br.h / 2, br.color, 12);
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
                spawnParticles(p.x, p.y, "#10B981", 8);
                ArcadeAudio.playScore();
              }
            }
          }
        }

        // Check if turn finished (clean transition)
        const allSpawned = ballsSpawnedRef.current >= totalBallsRef.current;
        const activeCount = balls.filter((b) => b.active).length;
        const timedOut = elapsed > 4.8;

        if ((allSpawned && activeCount === 0) || timedOut) {
          startXRef.current = nextStartXRef.current;
          startYRef.current = FLOOR_Y - 8;
          ballsRef.current = [];

          // Check gameover condition (any brick touches floor line)
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
                ? sessionStorage.getItem("selectedStore") || ""
                : "";

            submitGameSessionAction({
              gameSlug: "brick-breaker",
              score: scoreRef.current,
              storeName: targetStore,
              duration: levelRef.current * 10,
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

      // Deep arcade background
      ctx.fillStyle = "#0A0A0A";
      ctx.fillRect(0, 0, W, H);

      // Outer Arena Border
      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 45, W - 16, H - 55);

      // Floor Baseline (Danger boundary)
      ctx.strokeStyle = "#EF4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(8, FLOOR_Y);
      ctx.lineTo(W - 8, FLOOR_Y);
      ctx.stroke();

      // Draw Power-ups (+1 orbs)
      for (const p of powerUps) {
        if (p.collected) continue;
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
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

      // Draw Hit Particles
      for (const pt of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Reflective Aim Trajectory when in aiming state
      if (gameState === "aiming") {
        const sx = startXRef.current;
        const sy = startYRef.current;
        const angle = aimAngleRef.current;

        let currX = sx;
        let currY = sy;
        let dirX = Math.cos(angle);
        let dirY = Math.sin(angle);
        let distTraveled = 0;
        const maxDist = 480;
        const step = 14;

        ctx.save();
        while (distTraveled < maxDist) {
          currX += dirX * step;
          currY += dirY * step;
          distTraveled += step;

          // Wall bounce reflection
          if (currX <= 14) {
            currX = 14;
            dirX = -dirX;
          } else if (currX >= W - 14) {
            currX = W - 14;
            dirX = -dirX;
          }

          if (currY <= 48) break;

          // Brick collision stop
          let hitBrick = false;
          for (const br of bricks) {
            if (
              currX >= br.x - 2 &&
              currX <= br.x + br.w + 2 &&
              currY >= br.y - 2 &&
              currY <= br.y + br.h + 2
            ) {
              hitBrick = true;
              break;
            }
          }
          if (hitBrick) break;

          const alpha = Math.max(0.2, 1 - distTraveled / maxDist);
          ctx.fillStyle = `rgba(255, 76, 41, ${alpha})`;
          ctx.beginPath();
          ctx.arc(currX, currY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // --- ALWAYS-VISIBLE BALL LAUNCHER & RETURN ANCHORS ---
      const sx = startXRef.current;
      const sy = startYRef.current;

      if (gameState === "aiming") {
        // Bright Pulsing Launcher Ball at bottom
        const pulse = Math.sin(Date.now() / 180) * 1.5;
        ctx.strokeStyle = "#FF4C29";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 8.5 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // Ball Count Badge above launcher
        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`x${totalBallsRef.current}`, sx, sy - 14);
      } else if (gameState === "shooting") {
        // Active Launcher Base Indicator (Always Visible so user knows origin)
        ctx.fillStyle = "rgba(255, 76, 41, 0.4)";
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Catch / Landing Base (Visible as soon as first ball lands)
        if (hasFirstBallLandedRef.current) {
          const nx = nextStartXRef.current;
          ctx.strokeStyle = "#10B981";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(nx, FLOOR_Y - 8, 8, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(nx, FLOOR_Y - 8, 6, 0, Math.PI * 2);
          ctx.fill();

          // Count of returned balls
          ctx.fillStyle = "#10B981";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`x${landedCountRef.current}`, nx, FLOOR_Y - 20);
        }
      }

      // Draw Active Flying Balls with Neon Glow
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
  }, [gameState, spawnRow, recallAllBalls]);

  // Update Aim Angle from pointer
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

    let angle = Math.atan2(dy, dx);
    if (dy > 0) {
      // Slingshot inverted drag
      angle = Math.atan2(-dy, -dx);
    }

    // Restrict aim to upward half-plane
    if (angle > -0.15) angle = -0.15;
    if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
    aimAngleRef.current = angle;
  };

  // Pointer Handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameState === "shooting") {
      // Tapping during flight instantly recalls all remaining balls!
      recallAllBalls();
      return;
    }
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

  // Keyboard controls for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "shooting") {
        if (e.key === " " || e.key === "Enter" || e.key === "r") {
          recallAllBalls();
        }
      } else if (gameState === "aiming") {
        if (e.key === "ArrowLeft" || e.key === "a") {
          aimAngleRef.current = Math.max(-Math.PI + 0.15, aimAngleRef.current - 0.08);
        } else if (e.key === "ArrowRight" || e.key === "d") {
          aimAngleRef.current = Math.min(-0.15, aimAngleRef.current + 0.08);
        } else if (e.key === " " || e.key === "Enter") {
          shoot();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, shoot, recallAllBalls]);

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
    particlesRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    totalBallsRef.current = 20;
    startXRef.current = W / 2;
    startYRef.current = FLOOR_Y - 8;
    setLevel(1);
    setScore(0);
    setTotalBalls(20);
    setEarnedReward(null);
    setLimitNotice(null);
    setGameState("aiming");
    spawnRow(1);
    spawnRow(2);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-between p-3 select-none font-sans">
      {/* Header Bar */}
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

        <div className="flex items-center gap-2.5">
          {gameState === "shooting" ? (
            <button
              onClick={recallAllBalls}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black border border-amber-300 shadow-[2px_2px_0px_0px_#000] active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Instantly recall all balls"
            >
              ⚡ Fast Recall
            </button>
          ) : (
            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block">Score</span>
              <span className="font-mono text-emerald-400 font-black text-lg">+{score}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="w-full max-w-md bg-neutral-950 border-2 border-neutral-800 rounded-3xl shadow-2xl flex flex-col items-center my-2 relative overflow-hidden">
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

        {/* Dynamic In-Game Guidance */}
        {gameState === "aiming" && (
          <div className="absolute top-14 left-0 right-0 pointer-events-none flex justify-center">
            <div className="bg-black/85 backdrop-blur-md border border-neutral-700 text-neutral-200 text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-fade-in">
              👆 Drag to aim • Release to shoot
            </div>
          </div>
        )}

        {gameState === "shooting" && (
          <div className="absolute bottom-16 left-0 right-0 pointer-events-none flex justify-center">
            <div className="bg-black/75 backdrop-blur-sm text-neutral-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Tap screen to fast-recall ⚡
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center text-white z-40 rounded-3xl animate-in fade-in">
            <span className="text-5xl mb-2">💥</span>
            <h2 className="font-serif text-2xl font-black text-[#FF4C29] mb-1">WALL BREACHED!</h2>
            <p className="text-xs text-neutral-400 mb-4">Bricks reached the baseline</p>

            <div className="bg-neutral-900 border border-neutral-800 w-full p-4 rounded-2xl mb-3 shadow-md">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Blocks Smashed</span>
              <h3 className="font-serif text-3xl font-black text-[#FF4C29]">{score}</h3>
              <p className="text-xs font-bold text-emerald-400 mt-1">+{score * 10} Cafe Points earned</p>
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
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition cursor-pointer"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </main>

      {/* Footer Navigation / Instructions */}
      <footer className="text-center text-[11px] font-medium text-neutral-400 pb-1">
        Drag to aim bank shots • Tap during flight to fast-forward ⚡
      </footer>
    </div>
  );
}
