"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

const W = 340;
const H = 520;
const GRAVITY = 0.38;
const JUMP_VELOCITY = -10.2;
const SPRING_VELOCITY = -16.5;
const PLAYER_W = 28;
const PLAYER_H = 32;

type PlatformType = "normal" | "moving" | "spring" | "fragile";

interface Platform {
  id: number;
  x: number;
  y: number; // World Y (lower Y = higher in sky)
  w: number;
  h: number;
  type: PlatformType;
  vx?: number;
  broken?: boolean;
  hasStar?: boolean;
}

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
}

export default function SkyHopperGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [heightMeters, setHeightMeters] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Mutable Game Physics Refs
  const playerXRef = useRef(W / 2);
  const playerYRef = useRef(H - 120); // World Y
  const playerVxRef = useRef(0);
  const playerVyRef = useRef(0);
  const facingRightRef = useRef(true);
  const isRocketRef = useRef(false);
  const rocketTimerRef = useRef(0);

  const cameraYRef = useRef(0); // World Y offset
  const highestYRef = useRef(H - 120);
  const scoreRef = useRef(0);
  const starsRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<StarParticle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextPlatIdRef = useRef(1);
  const highestPlatYRef = useRef(H);

  // Spawn Platform helper
  const spawnPlatform = (y: number): Platform => {
    const id = nextPlatIdRef.current++;
    const w = 55 + Math.random() * 20;
    const x = Math.random() * (W - w);

    // Platform type probability based on altitude
    const rand = Math.random();
    let type: PlatformType = "normal";
    let vx = 0;

    if (rand < 0.22) {
      type = "moving";
      vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.2);
    } else if (rand < 0.38) {
      type = "spring";
    } else if (rand < 0.52 && y < H - 500) {
      type = "fragile";
    }

    const hasStar = type !== "fragile" && Math.random() < 0.25;

    return {
      id,
      x,
      y,
      w,
      h: 12,
      type,
      vx,
      broken: false,
      hasStar,
    };
  };

  // Initialize Game
  const initGame = useCallback(() => {
    playerXRef.current = W / 2;
    playerYRef.current = H - 120;
    playerVxRef.current = 0;
    playerVyRef.current = JUMP_VELOCITY;
    facingRightRef.current = true;
    isRocketRef.current = false;
    rocketTimerRef.current = 0;

    cameraYRef.current = 0;
    highestYRef.current = H - 120;
    scoreRef.current = 0;
    starsRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];
    nextPlatIdRef.current = 1;

    // Seed initial platforms
    const initialPlats: Platform[] = [];
    // Base starter platform directly under player
    initialPlats.push({
      id: 0,
      x: W / 2 - 40,
      y: H - 80,
      w: 80,
      h: 12,
      type: "normal",
      broken: false,
      hasStar: false,
    });

    let currY = H - 150;
    while (currY > -600) {
      initialPlats.push(spawnPlatform(currY));
      currY -= 55 + Math.random() * 35;
    }
    highestPlatYRef.current = currY;
    platformsRef.current = initialPlats;

    setScore(0);
    setHeightMeters(0);
    setStarsCollected(0);
    setGameState("playing");
    setEarnedReward(null);
    setLimitNotice(null);
  }, []);

  // Spawn Burst Particles
  const spawnBurst = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      });
    }
  };

  const addFloatingText = (text: string, x: number, y: number, color = "#F59E0B") => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      opacity: 1,
      vy: -1.6,
    });
  };

  // Touch / Pointer controls
  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    const targetX = (clientX - rect.left) * scale;
    // Steer player smoothly toward touch/mouse target
    const diff = targetX - playerXRef.current;
    playerVxRef.current = Math.max(-7, Math.min(7, diff * 0.22));
    if (Math.abs(diff) > 2) {
      facingRightRef.current = diff > 0;
    }
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      // --- UPDATE PHYSICS ---
      if (gameState === "playing") {
        // Horizontal Movement & screen wrapping
        playerXRef.current += playerVxRef.current;
        playerVxRef.current *= 0.88; // Horizontal friction damping

        if (playerXRef.current < -PLAYER_W / 2) {
          playerXRef.current = W + PLAYER_W / 2;
        } else if (playerXRef.current > W + PLAYER_W / 2) {
          playerXRef.current = -PLAYER_W / 2;
        }

        // Rocket Boost Mode
        if (isRocketRef.current) {
          rocketTimerRef.current--;
          playerVyRef.current = -12;
          // Spawn rocket thruster trail
          particlesRef.current.push({
            x: playerXRef.current + (Math.random() - 0.5) * 8,
            y: playerYRef.current - cameraYRef.current + PLAYER_H / 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 3 + Math.random() * 3,
            color: Math.random() > 0.5 ? "#F59E0B" : "#FF4C29",
            size: 4 + Math.random() * 3,
            life: 0,
            maxLife: 16,
          });

          if (rocketTimerRef.current <= 0) {
            isRocketRef.current = false;
          }
        } else {
          // Normal Gravity
          playerVyRef.current += GRAVITY;
        }

        playerYRef.current += playerVyRef.current;

        // Camera smoothly follows player upward
        const targetCameraY = playerYRef.current - H * 0.55;
        if (targetCameraY < cameraYRef.current) {
          cameraYRef.current = targetCameraY;
        }

        // Score tracking by altitude reached
        if (playerYRef.current < highestYRef.current) {
          const delta = highestYRef.current - playerYRef.current;
          highestYRef.current = playerYRef.current;
          scoreRef.current += Math.floor(delta * 0.6);
          setScore(scoreRef.current);
          setHeightMeters(Math.floor((H - 120 - highestYRef.current) / 10));
        }

        // Platform Collision (only when falling downward)
        if (playerVyRef.current > 0 && !isRocketRef.current) {
          const px = playerXRef.current;
          const py = playerYRef.current;

          for (const plat of platformsRef.current) {
            if (plat.broken) continue;

            // Character feet bounding box
            const feetY = py + PLAYER_H / 2;
            const prevFeetY = feetY - playerVyRef.current;

            if (
              feetY >= plat.y &&
              prevFeetY <= plat.y + 12 &&
              px + PLAYER_W * 0.4 >= plat.x &&
              px - PLAYER_W * 0.4 <= plat.x + plat.w
            ) {
              if (plat.type === "fragile") {
                // Break platform!
                plat.broken = true;
                spawnBurst(plat.x + plat.w / 2, plat.y - cameraYRef.current, "#EF4444", 14);
                ArcadeAudio.playCrash();
                // No bounce, player falls through
              } else if (plat.type === "spring") {
                // MEGA BOUNCE
                playerVyRef.current = SPRING_VELOCITY;
                ArcadeAudio.playBonus();
                spawnBurst(plat.x + plat.w / 2, plat.y - cameraYRef.current, "#F59E0B", 18);
                addFloatingText("SPRING! 🚀", px, plat.y - cameraYRef.current - 20, "#F59E0B");
              } else {
                // Normal bounce
                playerVyRef.current = JUMP_VELOCITY;
                ArcadeAudio.playJump();
                spawnBurst(px, plat.y - cameraYRef.current, "#10B981", 8);
              }
              break;
            }
          }
        }

        // Check Star Pickups
        for (const plat of platformsRef.current) {
          if (plat.hasStar) {
            const starX = plat.x + plat.w / 2;
            const starY = plat.y - 18;
            const dist = Math.hypot(playerXRef.current - starX, playerYRef.current - starY);

            if (dist < 26) {
              plat.hasStar = false;
              starsRef.current += 1;
              setStarsCollected(starsRef.current);
              scoreRef.current += 75;
              setScore(scoreRef.current);
              ArcadeAudio.playScore(starsRef.current % 5 + 1);
              spawnBurst(starX, starY - cameraYRef.current, "#FBBF24", 16);
              addFloatingText("+75 ⭐", starX, starY - cameraYRef.current - 10, "#FBBF24");

              // 10% chance star gives temporary Rocket boost!
              if (Math.random() < 0.12 && !isRocketRef.current) {
                isRocketRef.current = true;
                rocketTimerRef.current = 110; // ~2 seconds of thrust
                ArcadeAudio.playBonus();
                addFloatingText("HYPER THRUST!", playerXRef.current, starY - cameraYRef.current - 35, "#FF4C29");
              }
            }
          }
        }

        // Move moving platforms
        for (const plat of platformsRef.current) {
          if (plat.type === "moving" && plat.vx) {
            plat.x += plat.vx;
            if (plat.x < 0 || plat.x + plat.w > W) {
              plat.vx = -plat.vx;
            }
          }
        }

        // Generate platforms upward dynamically
        while (highestPlatYRef.current > cameraYRef.current - 200) {
          const nextY = highestPlatYRef.current - (55 + Math.random() * 40);
          platformsRef.current.push(spawnPlatform(nextY));
          highestPlatYRef.current = nextY;
        }

        // Prune platforms below screen
        const bottomEdge = cameraYRef.current + H + 40;
        platformsRef.current = platformsRef.current.filter((p) => p.y < bottomEdge);

        // Fall into abyss Check (Game Over)
        if (playerYRef.current > cameraYRef.current + H + 40) {
          ArcadeAudio.playCrash();
          setGameState("gameover");

          const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "") : "";
          submitGameSessionAction({
            gameSlug: "sky-hopper",
            score: scoreRef.current,
            storeName: targetStore,
            duration: Math.max(10, Math.floor(heightMeters * 1.5)),
          })
            .then((res) => {
              if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
              if (res?.success && res?.rewardEarned && res?.claimCode) {
                setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
              }
            })
            .catch((e) => console.error("Session submit failed", e));
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, W, H);

      // Dynamic Sky Gradient based on altitude
      const skyProgress = Math.min(1, Math.max(0, -cameraYRef.current / 4000));
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      // Gradual shift from dark cyan/slate to cosmic violet/black
      if (skyProgress < 0.5) {
        skyGrad.addColorStop(0, "#091E2C");
        skyGrad.addColorStop(1, "#030A11");
      } else {
        skyGrad.addColorStop(0, "#180D2B");
        skyGrad.addColorStop(1, "#070311");
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Background stars / cosmos dust
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 67) % W);
        const sy = ((i * 97 - cameraYRef.current * 0.2) % H + H) % H;
        ctx.fillRect(sx, sy, (i % 3 === 0 ? 2 : 1.2), (i % 3 === 0 ? 2 : 1.2));
      }

      // Draw Platforms
      for (const plat of platformsRef.current) {
        if (plat.broken) continue;
        const screenY = plat.y - cameraYRef.current;
        if (screenY < -20 || screenY > H + 20) continue;

        // Platform Body
        ctx.beginPath();
        ctx.roundRect(plat.x, screenY, plat.w, plat.h, 6);

        if (plat.type === "normal") {
          ctx.fillStyle = "#10B981";
          ctx.fill();
          ctx.strokeStyle = "#34D399";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (plat.type === "moving") {
          ctx.fillStyle = "#06B6D4";
          ctx.fill();
          ctx.strokeStyle = "#67E8F9";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (plat.type === "spring") {
          ctx.fillStyle = "#F59E0B";
          ctx.fill();
          ctx.strokeStyle = "#FCD34D";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw spring pad on top
          const springX = plat.x + plat.w / 2 - 10;
          ctx.fillStyle = "#EF4444";
          ctx.beginPath();
          ctx.roundRect(springX, screenY - 5, 20, 5, 3);
          ctx.fill();
        } else if (plat.type === "fragile") {
          ctx.fillStyle = "#78350F";
          ctx.fill();
          ctx.strokeStyle = "#B45309";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Crack line
          ctx.strokeStyle = "#451A03";
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.w * 0.4, screenY);
          ctx.lineTo(plat.x + plat.w * 0.6, screenY + plat.h);
          ctx.stroke();
        }

        // Draw Star Collectible
        if (plat.hasStar) {
          const starX = plat.x + plat.w / 2;
          const starY = screenY - 14;

          ctx.save();
          ctx.translate(starX, starY);
          ctx.fillStyle = "#FBBF24";
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#FFF";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("★", 0, 3);
          ctx.restore();
        }
      }

      // Draw Player Character
      const px = playerXRef.current;
      const py = playerYRef.current - cameraYRef.current;

      ctx.save();
      ctx.translate(px, py);

      // Facing orientation
      if (!facingRightRef.current) {
        ctx.scale(-1, 1);
      }

      // Squash and stretch based on vertical velocity
      const stretchY = Math.max(0.75, Math.min(1.3, 1 - playerVyRef.current * 0.025));
      const squashX = 1 / stretchY;
      ctx.scale(squashX, stretchY);

      // Hopper Body (Cute Neon Blob/Robot)
      const bodyGrad = ctx.createRadialGradient(-3, -4, 3, 0, 0, PLAYER_W / 2);
      if (isRocketRef.current) {
        bodyGrad.addColorStop(0, "#FEF3C7");
        bodyGrad.addColorStop(0.5, "#F59E0B");
        bodyGrad.addColorStop(1, "#DC2626");
      } else {
        bodyGrad.addColorStop(0, "#A7F3D0");
        bodyGrad.addColorStop(0.4, "#10B981");
        bodyGrad.addColorStop(1, "#047857");
      }

      ctx.beginPath();
      ctx.roundRect(-PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H, 12);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.strokeStyle = isRocketRef.current ? "#FCD34D" : "#6EE7B7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cute Eyes
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(4, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(11, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils looking forward
      ctx.fillStyle = "#064E3B";
      ctx.beginPath();
      ctx.arc(5.5, -4, 2, 0, Math.PI * 2);
      ctx.arc(12.5, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Cheek blush
      ctx.fillStyle = "rgba(251, 113, 133, 0.6)";
      ctx.beginPath();
      ctx.arc(3, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Update & Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * alpha), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update & Render Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy;
        ft.opacity -= 0.025;

        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.opacity);
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        if (ft.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Start Screen Overlay
      if (gameState === "idle") {
        ctx.fillStyle = "rgba(10, 15, 26, 0.8)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#34D399";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SKY HOPPER", W / 2, H / 2 - 35);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "14px sans-serif";
        ctx.fillText("Drag or tilt to steer left & right", W / 2, H / 2 + 5);
        ctx.fillText("Bounce on platforms to climb!", W / 2, H / 2 + 28);

        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("🟡 Springs = High Leap • ⭐ Collect Stars", W / 2, H / 2 + 55);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("👉 TAP TO START", W / 2, H / 2 + 100);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // Continuous Keyboard controls for desktop
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        keysRef.current.left = true;
        facingRightRef.current = false;
        ArcadeAudio.init();
        if (gameState === "idle") initGame();
      } else if (e.key === "ArrowRight" || e.key === "d") {
        keysRef.current.right = true;
        facingRightRef.current = true;
        ArcadeAudio.init();
        if (gameState === "idle") initGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        keysRef.current.left = false;
      } else if (e.key === "ArrowRight" || e.key === "d") {
        keysRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, initGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-3 select-none">
      {/* Header Bar */}
      <div className="w-[340px] flex justify-between items-center mb-2 px-1">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Sky Hopper
          </span>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {score}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-amber-300">
            <span>⭐</span>
            <span>{starsCollected}</span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-neutral-500 block font-medium">
              ALTITUDE
            </span>
            <span className="text-sm font-bold text-neutral-200">
              {heightMeters}m
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseDown={(e) => {
            ArcadeAudio.init();
            if (gameState === "idle") initGame();
            handlePointerMove(e.clientX);
          }}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchStart={(e) => {
            ArcadeAudio.init();
            if (gameState === "idle") initGame();
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          className="cursor-pointer block touch-none"
        />

        {/* Game Over Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl mb-3 border border-emerald-500/40">
              🦘
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              NICE CLIMB!
            </h2>
            <p className="text-neutral-400 text-xs mb-4">
              You reached a stellar height before descending.
            </p>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 w-full mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-400">Final Score</span>
                <span className="text-xl font-black text-emerald-400">{score}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-400">Peak Altitude</span>
                <span className="text-sm font-bold text-neutral-200">{heightMeters} meters</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Stars Collected</span>
                <span className="text-sm font-bold text-amber-300">⭐ {starsCollected}</span>
              </div>
            </div>

            {/* Optional Reward Box */}
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
                initGame();
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="w-[340px] mt-3 flex items-center justify-between text-neutral-500 text-[11px] px-2 font-medium">
        <span>👈 Drag left / right to steer 👉</span>
        <span>A / D or Arrow Keys</span>
      </div>
    </div>
  );
}
