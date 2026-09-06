"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

// Dimensions
const W = 340;
const H = 520;
const FLOOR_HEIGHT = 140;
const GRAVITY = 0.42;
const BOUNCE_IMPULSE = -9.2;
const CYLINDER_RADIUS = 95;
const CYLINDER_Y_RADIUS = 30; // 3D elliptical perspective ratio
const BALL_RADIUS = 10;
const BALL_SCREEN_Y = 190; // Ball stays pinned visually around here, camera scrolls

interface Segment {
  startAngle: number; // 0 to 2*PI
  endAngle: number;
  type: "safe" | "hazard";
}

interface Platform {
  id: number;
  worldY: number;
  segments: Segment[]; // Gaps are simply missing angle ranges
  shattered: boolean;
  splatters: { angle: number; color: string; size: number }[];
}

interface Particle {
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

// Generate platform with safe sectors, hazard sector, and gap
function generatePlatform(index: number): Platform {
  const worldY = index * FLOOR_HEIGHT;
  const segments: Segment[] = [];

  // Gap size between 60 deg (PI/3) and 100 deg
  const gapSize = Math.max(0.9, 1.6 - index * 0.02);
  const gapStart = Math.random() * Math.PI * 2;
  const gapEnd = (gapStart + gapSize) % (Math.PI * 2);

  // Available span for platforms is (2*PI - gapSize)
  const platformSpan = Math.PI * 2 - gapSize;
  const numHazards = index < 3 ? 0 : index < 7 ? 1 : 2;

  if (numHazards === 0) {
    // Single safe segment covering the non-gap area
    segments.push({
      startAngle: (gapStart + gapSize) % (Math.PI * 2),
      endAngle: gapStart,
      type: "safe",
    });
  } else {
    // Distribute safe and hazard sectors across the span
    const hazardSpan = 0.45 + Math.min(0.35, index * 0.02);
    // Position hazard partway into the span
    const hazardOffset = gapSize + 0.3 + Math.random() * (platformSpan - hazardSpan - 0.6);
    const hStart = (gapStart + hazardOffset) % (Math.PI * 2);
    const hEnd = (gapStart + hazardOffset + hazardSpan) % (Math.PI * 2);

    // Safe 1: from gap end to hazard start
    segments.push({
      startAngle: (gapStart + gapSize) % (Math.PI * 2),
      endAngle: hStart,
      type: "safe",
    });
    // Hazard
    segments.push({
      startAngle: hStart,
      endAngle: hEnd,
      type: "hazard",
    });
    // Safe 2: from hazard end to gap start
    segments.push({
      startAngle: hEnd,
      endAngle: gapStart,
      type: "safe",
    });
  }

  return {
    id: index,
    worldY,
    segments,
    shattered: false,
    splatters: [],
  };
}

export default function HelixDropGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [floorsPassed, setFloorsPassed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isDestroyer, setIsDestroyer] = useState(false);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Mutable Game State
  const ballYRef = useRef(0);
  const ballVyRef = useRef(0);
  const rotationRef = useRef(0);
  const rotationVelRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const platformsRef = useRef<Platform[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextPlatformIndexRef = useRef(1);
  const highestPassedFloorRef = useRef(0);

  // Initialize Game
  const initGame = useCallback(() => {
    ballYRef.current = 0;
    ballVyRef.current = 0;
    rotationRef.current = 0;
    rotationVelRef.current = 0;
    scoreRef.current = 0;
    streakRef.current = 0;
    highestPassedFloorRef.current = 0;
    particlesRef.current = [];
    floatingTextsRef.current = [];

    // Seed first 15 floors
    const initialPlatforms: Platform[] = [];
    // Floor 0: Safe starter pad with a generous 100-degree gap at the side/back!
    // Front angle is PI/2 (1.57). Gap is from 2.2 to 3.9 rad so front starts safe.
    const starterGapStart = Math.PI * 0.72;
    const starterGapSize = 1.75; // ~100 degrees wide
    initialPlatforms.push({
      id: 0,
      worldY: 0,
      segments: [
        {
          startAngle: (starterGapStart + starterGapSize) % (Math.PI * 2),
          endAngle: starterGapStart,
          type: "safe",
        },
      ],
      shattered: false,
      splatters: [],
    });

    for (let i = 1; i <= 14; i++) {
      initialPlatforms.push(generatePlatform(i));
    }
    platformsRef.current = initialPlatforms;
    nextPlatformIndexRef.current = 15;

    setScore(0);
    setFloorsPassed(0);
    setStreak(0);
    setIsDestroyer(false);
    setGameState("playing");
    setEarnedReward(null);
    setLimitNotice(null);
  }, []);

  // Spawn Shatter Particles
  const spawnShatter = (cx: number, cy: number, color: string) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: 3 + Math.random() * 5,
        life: 0,
        maxLife: 25 + Math.random() * 15,
      });
    }
  };

  // Add floating text
  const addFloatingText = (text: string, x: number, y: number, color = "#F59E0B") => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      opacity: 1,
      vy: -1.8,
    });
  };

  // Check angle containment in [start, end]
  const isAngleInSector = (angle: number, start: number, end: number) => {
    const twoPi = Math.PI * 2;
    const a = (angle % twoPi + twoPi) % twoPi;
    const s = (start % twoPi + twoPi) % twoPi;
    const e = (end % twoPi + twoPi) % twoPi;

    if (s < e) {
      return a >= s && a <= e;
    } else {
      // Wraps around 0
      return a >= s || a <= e;
    }
  };

  // Touch / Drag Handlers
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = clientX;
    ArcadeAudio.init();
    if (gameState === "idle") {
      initGame();
    }
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - lastMouseXRef.current;
    lastMouseXRef.current = clientX;
    // Rotate cylinder with snappy responsiveness
    rotationRef.current += deltaX * 0.022;
    rotationVelRef.current = deltaX * 0.018;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Global release listener so drag never gets stuck if mouse/finger leaves canvas
  useEffect(() => {
    const handleGlobalUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      // Update Physics if playing
      if (gameState === "playing") {
        // Inertia rotation damping
        if (!isDraggingRef.current) {
          rotationRef.current += rotationVelRef.current;
          rotationVelRef.current *= 0.92;
        }

        // Ball gravity
        ballVyRef.current += GRAVITY;
        const prevBallY = ballYRef.current;
        ballYRef.current += ballVyRef.current;

        // Destroyer mode active if streak >= 3
        const destroyer = streakRef.current >= 3;
        setIsDestroyer(destroyer);

        // Particle trail when in destroyer mode
        if (destroyer) {
          particlesRef.current.push({
            x: W / 2 + (Math.random() - 0.5) * 12,
            y: BALL_SCREEN_Y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2 - Math.random() * 2,
            color: Math.random() > 0.5 ? "#FF4C29" : "#F59E0B",
            size: 4 + Math.random() * 4,
            life: 0,
            maxLife: 18,
          });
        }

        // Check platform collisions
        // The ball is positioned horizontally at the FRONT of the cylinder:
        // In our 3D ellipse projection, the front-most angle is PI / 2.
        // Therefore, the angle relative to the cylinder's coordinate system is:
        const FRONT_ANGLE = Math.PI / 2;
        const relativeAngle = FRONT_ANGLE - rotationRef.current;

        for (const platform of platformsRef.current) {
          if (platform.shattered) continue;

          // Check if ball crossed the platform top during this frame
          const crossed = prevBallY <= platform.worldY && ballYRef.current >= platform.worldY;

          if (crossed && ballVyRef.current > 0) {
            // Check what is under the ball
            let hitSegment: Segment | null = null;
            for (const seg of platform.segments) {
              if (isAngleInSector(relativeAngle, seg.startAngle, seg.endAngle)) {
                hitSegment = seg;
                break;
              }
            }

            if (!hitSegment) {
              // FELL THROUGH GAP!
              streakRef.current += 1;
              const currentStreak = streakRef.current;
              setStreak(currentStreak);

              const gained = currentStreak * 2;
              scoreRef.current += gained;
              setScore(scoreRef.current);
              setFloorsPassed(platform.id);
              highestPassedFloorRef.current = Math.max(highestPassedFloorRef.current, platform.id);

              ArcadeAudio.playScore(currentStreak);

              addFloatingText(
                currentStreak >= 3 ? `🔥 x${currentStreak} MEGA!` : `+${gained}`,
                W / 2 + 25,
                BALL_SCREEN_Y - 15,
                currentStreak >= 3 ? "#FF4C29" : "#10B981"
              );

              // Don't bounce, continue falling!
            } else if (hitSegment.type === "hazard") {
              if (destroyer) {
                // SMASH THROUGH HAZARD!
                platform.shattered = true;
                spawnShatter(W / 2, BALL_SCREEN_Y, "#EF4444");
                ArcadeAudio.playBonus();
                scoreRef.current += 15;
                setScore(scoreRef.current);
                addFloatingText("SMASH! +15", W / 2, BALL_SCREEN_Y - 20, "#EF4444");
                // Reset streak after breaking
                streakRef.current = 0;
                setStreak(0);
                ballVyRef.current = BOUNCE_IMPULSE * 0.7; // slight bounce
              } else {
                // CRASH! GAME OVER
                ArcadeAudio.playCrash();
                setGameState("gameover");
                spawnShatter(W / 2, BALL_SCREEN_Y, "#FF4C29");

                const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila") : "Downtown Tacos & Tequila";
                submitGameSessionAction({
                  gameSlug: "helix-drop",
                  score: scoreRef.current,
                  storeName: targetStore,
                  duration: Math.max(10, Math.floor(floorsPassed * 4)),
                })
                  .then((res) => {
                    if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
                    if (res?.success && res?.rewardEarned && res?.claimCode) {
                      setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
                    }
                  })
                  .catch((e) => console.error("Session submit failed", e));
                break;
              }
            } else {
              // SAFE PLATFORM HIT
              if (destroyer) {
                // SMASH THROUGH SAFE PLATFORM
                platform.shattered = true;
                spawnShatter(W / 2, BALL_SCREEN_Y, "#06B6D4");
                ArcadeAudio.playBonus();
                scoreRef.current += 10;
                setScore(scoreRef.current);
                addFloatingText("SHATTER! +10", W / 2, BALL_SCREEN_Y - 20, "#06B6D4");
                streakRef.current = 0;
                setStreak(0);
                ballVyRef.current = BOUNCE_IMPULSE * 0.7;
              } else {
                // BOUNCE!
                ballYRef.current = platform.worldY;
                ballVyRef.current = BOUNCE_IMPULSE;
                streakRef.current = 0;
                setStreak(0);
                ArcadeAudio.playJump();

                // Add paint splatter to platform
                platform.splatters.push({
                  angle: relativeAngle,
                  color: "#06B6D4",
                  size: 6 + Math.random() * 6,
                });
                if (platform.splatters.length > 5) platform.splatters.shift();
              }
            }
          }
        }

        // Spawn new platforms dynamically as camera scrolls
        const lowestVisibleY = ballYRef.current + H;
        const lastPlatform = platformsRef.current[platformsRef.current.length - 1];
        if (lastPlatform && lastPlatform.worldY < lowestVisibleY + 300) {
          platformsRef.current.push(generatePlatform(nextPlatformIndexRef.current++));
        }

        // Clean up platforms far above camera
        if (platformsRef.current.length > 30) {
          platformsRef.current = platformsRef.current.filter(
            (p) => p.worldY > ballYRef.current - H * 1.5
          );
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#0B0F19");
      bgGrad.addColorStop(1, "#05070B");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Central Helix Pole
      const poleGrad = ctx.createLinearGradient(W / 2 - 18, 0, W / 2 + 18, 0);
      poleGrad.addColorStop(0, "#1F2937");
      poleGrad.addColorStop(0.5, "#4B5563");
      poleGrad.addColorStop(1, "#111827");
      ctx.fillStyle = poleGrad;
      ctx.fillRect(W / 2 - 16, 0, 32, H);

      // Neon core line inside pole
      ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();

      // Camera Offset: Camera aligns so ball is always at BALL_SCREEN_Y
      const cameraY = ballYRef.current - BALL_SCREEN_Y;

      // Draw Platforms (back to front or sorted by worldY)
      for (const platform of platformsRef.current) {
        const screenY = platform.worldY - cameraY;

        // Skip if outside viewport
        if (screenY < -50 || screenY > H + 50 || platform.shattered) continue;

        const cx = W / 2;
        const cy = screenY;
        const rx = CYLINDER_RADIUS;
        const ry = CYLINDER_Y_RADIUS;

        // Draw sectors
        for (const seg of platform.segments) {
          // Visual start & end angles rotated by cylinder rotation
          const vStart = seg.startAngle + rotationRef.current;
          const vEnd = seg.endAngle + rotationRef.current;

          // Render 3D disc segment using elliptical arcs
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, vStart, vEnd, false);
          ctx.lineTo(cx, cy);
          ctx.closePath();

          if (seg.type === "safe") {
            const segGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, rx);
            segGrad.addColorStop(0, "#0891B2");
            segGrad.addColorStop(1, "#0284C7");
            ctx.fillStyle = segGrad;
            ctx.strokeStyle = "#38BDF8";
            ctx.lineWidth = 2;
          } else {
            // Hazard sector
            const segGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, rx);
            segGrad.addColorStop(0, "#DC2626");
            segGrad.addColorStop(1, "#991B1B");
            ctx.fillStyle = segGrad;
            ctx.strokeStyle = "#F87171";
            ctx.lineWidth = 2;
          }

          ctx.fill();
          ctx.stroke();

          // 3D Rim / Thickness below the segment
          ctx.beginPath();
          ctx.ellipse(cx, cy + 8, rx, ry, 0, vStart, vEnd, false);
          ctx.strokeStyle = seg.type === "safe" ? "rgba(14, 116, 144, 0.6)" : "rgba(153, 27, 27, 0.6)";
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw paint splatters on this platform
        for (const splat of platform.splatters) {
          const vAngle = splat.angle + rotationRef.current;
          // Splat position on ellipse
          const sx = cx + Math.cos(vAngle) * (rx * 0.7);
          const sy = cy + Math.sin(vAngle) * (ry * 0.7);

          ctx.beginPath();
          ctx.ellipse(sx, sy, splat.size, splat.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fillStyle = splat.color;
          ctx.fill();
        }
      }

      // Draw Ball at (W/2, BALL_SCREEN_Y + 12) - sitting visibly on front platform rim
      const bx = W / 2;
      const by = BALL_SCREEN_Y + 12;

      // Ball shadow on front platform rim
      ctx.beginPath();
      ctx.ellipse(bx, by + 12, 10, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fill();

      // Ball Destroyer Fire Aura
      if (streakRef.current >= 3) {
        ctx.beginPath();
        ctx.arc(bx, by, BALL_RADIUS + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 76, 41, 0.35)";
        ctx.fill();
      }

      // Ball Body
      const ballGrad = ctx.createRadialGradient(
        bx - 3,
        by - 3,
        2,
        bx,
        by,
        BALL_RADIUS
      );
      if (streakRef.current >= 3) {
        ballGrad.addColorStop(0, "#FFFBEB");
        ballGrad.addColorStop(0.4, "#F59E0B");
        ballGrad.addColorStop(1, "#DC2626");
      } else {
        ballGrad.addColorStop(0, "#E0F2FE");
        ballGrad.addColorStop(0.3, "#38BDF8");
        ballGrad.addColorStop(1, "#0284C7");
      }

      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.strokeStyle = streakRef.current >= 3 ? "#FBBF24" : "#BAE6FD";
      ctx.lineWidth = 1.5;
      ctx.stroke();

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

        ctx.font = "bold 15px sans-serif";
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
        ctx.fillStyle = "rgba(11, 15, 25, 0.75)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HELIX DROP", W / 2, H / 2 - 30);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "14px sans-serif";
        ctx.fillText("Drag left/right to rotate tower", W / 2, H / 2 + 5);
        ctx.fillText("Pass gaps • Dodge red hazards", W / 2, H / 2 + 28);

        ctx.fillStyle = "#F59E0B";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("Drop 3+ floors for DESTROYER mode!", W / 2, H / 2 + 55);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("👉 TAP OR DRAG TO START", W / 2, H / 2 + 100);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, initGame]);

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        rotationRef.current -= 0.09;
        ArcadeAudio.init();
        if (gameState === "idle") initGame();
      } else if (e.key === "ArrowRight" || e.key === "d") {
        rotationRef.current += 0.09;
        ArcadeAudio.init();
        if (gameState === "idle") initGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, initGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-3 select-none">
      {/* Header Bar */}
      <div className="w-[340px] flex justify-between items-center mb-2 px-1">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Helix Drop
          </span>
          <div className="text-2xl font-black text-cyan-400 tracking-tight">
            {score}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide animate-pulse ${
                streak >= 3
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30"
                  : "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
              }`}
            >
              {streak >= 3 ? "🔥 DESTROYER" : `COMBO x${streak}`}
            </div>
          )}

          <div className="text-right">
            <span className="text-[11px] text-neutral-500 block font-medium">
              FLOORS
            </span>
            <span className="text-sm font-bold text-neutral-200">
              {floorsPassed}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          onTouchEnd={handlePointerUp}
          className="cursor-grab active:cursor-grabbing block touch-none"
        />

        {/* Dynamic Start Swipe Guidance */}
        {gameState === "playing" && floorsPassed === 0 && (
          <div className="absolute top-20 left-0 right-0 pointer-events-none flex justify-center animate-bounce">
            <div className="bg-black/90 backdrop-blur-md border border-cyan-500/50 text-cyan-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-cyan-500/25 flex items-center gap-1.5">
              <span>👈</span>
              <span>Swipe left / right to align gap</span>
              <span>👉</span>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl mb-3 border border-red-500/40">
              💥
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              HAZARD CRASH!
            </h2>
            <p className="text-neutral-400 text-xs mb-4">
              Watch out for red spiked sectors unless in Destroyer mode!
            </p>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 w-full mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-neutral-400">Score</span>
                <span className="text-xl font-black text-cyan-400">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Floors Descended</span>
                <span className="text-sm font-bold text-neutral-200">{floorsPassed}</span>
              </div>
            </div>

            {/* Optional Reward Box if venue rewards are configured */}
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
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition active:scale-[0.98]"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className="w-[340px] mt-3 flex items-center justify-between text-neutral-500 text-[11px] px-2 font-medium">
        <span>👈 Swipe left / right to rotate 👉</span>
        <span>Space / Tap restart</span>
      </div>
    </div>
  );
}
