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
const BRICK_H = 28;
const BRICK_PAD = 4;
const BRICK_W = (W - (COLS + 1) * BRICK_PAD) / COLS;
const BALL_SPEED = 9.5;

export default function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [totalBalls, setTotalBalls] = useState(25);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"aiming" | "shooting" | "gameover">("aiming");
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const aimAngleRef = useRef<number>(-Math.PI / 2);
  const isAimingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(W / 2);
  const startYRef = useRef<number>(H - 30);
  const nextStartXRef = useRef<number>(W / 2);
  const ballsReturnedRef = useRef<number>(0);
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
      const y = 60;

      if (rand < 0.55) {
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
      } else if (rand < 0.7) {
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

  // Shoot balls in sequence
  const shoot = useCallback(() => {
    if (gameState !== "aiming") return;
    setGameState("shooting");
    ballsReturnedRef.current = 0;
    ballsRef.current = [];

    const angle = aimAngleRef.current;
    const vx = Math.cos(angle) * BALL_SPEED;
    const vy = Math.sin(angle) * BALL_SPEED;

    const count = totalBallsRef.current;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        ballsRef.current.push({
          x: startXRef.current,
          y: startYRef.current,
          vx,
          vy,
          active: true,
        });
        if (i % 4 === 0) ArcadeAudio.playTap();
      }, i * 38);
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
      // --- Update Physics ---
      const balls = ballsRef.current;
      const bricks = bricksRef.current;
      const powerUps = powerUpsRef.current;

      let allDone = gameState === "shooting" && balls.length >= totalBallsRef.current;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (!b.active) continue;
        allDone = false;

        b.x += b.vx;
        b.y += b.vy;

        // Wall collisions
        if (b.x - 4 <= 8) {
          b.x = 12;
          b.vx = Math.abs(b.vx);
        } else if (b.x + 4 >= W - 8) {
          b.x = W - 12;
          b.vx = -Math.abs(b.vx);
        }

        if (b.y - 4 <= 45) {
          b.y = 49;
          b.vy = Math.abs(b.vy);
        }

        // Bottom floor
        if (b.y + 4 >= H - 15) {
          b.active = false;
          ballsReturnedRef.current++;
          if (ballsReturnedRef.current === 1) {
            nextStartXRef.current = b.x;
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
            // Collision side detection
            const prevX = b.x - b.vx;
            const prevY = b.y - b.vy;

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

        // Power-up collisions
        for (let k = 0; k < powerUps.length; k++) {
          const p = powerUps[k];
          if (!p.collected && Math.hypot(b.x - p.x, b.y - p.y) < 12) {
            p.collected = true;
            totalBallsRef.current += 1;
            setTotalBalls(totalBallsRef.current);
            ArcadeAudio.playScore();
          }
        }
      }

      // Check if turn finished
      if (gameState === "shooting" && ballsReturnedRef.current >= totalBallsRef.current && allDone) {
        startXRef.current = nextStartXRef.current;
        ballsRef.current = [];

        // Check loss condition (bricks reaching bottom)
        let lost = false;
        for (const br of bricks) {
          if (br.y + br.h >= H - 55) {
            lost = true;
            break;
          }
        }

        if (lost) {
          setGameState("gameover");
          ArcadeAudio.playCrash();

          const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila") : "Downtown Tacos & Tequila";
          submitGameSessionAction({
            gameSlug: "brick-breaker",
            score: scoreRef.current,
            storeName: targetStore,
            duration: levelRef.current * 15,
          }).then((res) => {
            if (res.limitReached) setLimitNotice(res.error || "Daily limit reached.");
            if (res.success && res.rewardEarned && res.claimCode) {
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

      // --- Draw Canvas ---
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, W, H);

      // Border walls
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 45, W - 16, H - 60);

      // Floor line
      ctx.strokeStyle = "#FF4C29";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, H - 55);
      ctx.lineTo(W - 8, H - 55);
      ctx.stroke();

      // Draw Power-ups (+1 orbs)
      for (const p of powerUps) {
        if (p.collected) continue;
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#FFF";
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
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(br.hp), br.x + br.w / 2, br.y + br.h / 2);
      }

      // Aiming line
      if (gameState === "aiming") {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(255, 76, 41, 0.75)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startXRef.current, startYRef.current);
        ctx.lineTo(
          startXRef.current + Math.cos(aimAngleRef.current) * 120,
          startYRef.current + Math.sin(aimAngleRef.current) * 120
        );
        ctx.stroke();
        ctx.restore();

        // Launcher Base Indicator
        ctx.fillStyle = "#FF4C29";
        ctx.beginPath();
        ctx.arc(startXRef.current, startYRef.current, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Active Balls
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

  // Pointer Aim & Release
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== "aiming") return;
    isAimingRef.current = true;
    updateAimAngle(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAimingRef.current) updateAimAngle(e);
  };

  const handlePointerUp = () => {
    if (isAimingRef.current) {
      isAimingRef.current = false;
      shoot();
    }
  };

  const updateAimAngle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = (e.clientX - rect.left) * (W / rect.width);
    const clientY = (e.clientY - rect.top) * (H / rect.height);

    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;
    let angle = Math.atan2(dy, dx);

    // Lock aiming upward only
    if (angle > -0.15) angle = -0.15;
    if (angle < -Math.PI + 0.15) angle = -Math.PI + 0.15;
    aimAngleRef.current = angle;
  };

  const resetGame = () => {
    bricksRef.current = [];
    powerUpsRef.current = [];
    ballsRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    totalBallsRef.current = 25;
    startXRef.current = W / 2;
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
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col items-center justify-between p-3 select-none">
      {/* Header */}
      <header className="w-full max-w-md bg-[#1A1A1A] p-3.5 rounded-2xl border-2 border-[#333] shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧱</span>
          <div>
            <h1 className="font-serif font-black text-base leading-tight">Swipe Breaker</h1>
            <p className="text-[9px] font-bold text-[#FF4C29] tracking-widest uppercase">
              Wave {level} • {totalBalls} Balls
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-bold text-white/40 uppercase block">Score</span>
          <span className="font-mono text-emerald-400 font-black text-lg">{score}</span>
        </div>
      </header>

      {/* Canvas */}
      <main className="w-full max-w-md bg-black border-3 border-[#333] rounded-3xl shadow-[6px_6px_0px_0px_#000] flex flex-col items-center my-3 relative overflow-hidden">
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center text-white z-40 rounded-3xl">
            <span className="text-6xl mb-2">💥</span>
            <h2 className="font-serif text-3xl font-black text-[#FF4C29] mb-1">WALL BREACHED!</h2>
            <p className="text-xs text-white/50 mb-4">Bricks reached the floor</p>

            <div className="bg-[#1C1C1C] text-white w-full p-4 rounded-2xl border-2 border-[#333] mb-3 shadow-[3px_3px_0px_0px_#FF4C29]">
              <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Blocks Smashed</span>
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
                <a href={`/claim/${earnedReward.claimCode}`} className="block text-[10px] font-black underline">
                  SHOW TO STAFF AT COUNTER 📱
                </a>
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

      <footer className="text-center text-xs font-bold text-white/40 pb-1">
        Drag back to aim trajectory • Release to launch balls
      </footer>
    </div>
  );
}
