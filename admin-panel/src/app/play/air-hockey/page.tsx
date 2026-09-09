"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

const W = 340;
const H = 540;
const PADDLE_R = 24;
const PUCK_R = 14;
const GOAL_WIDTH = 110;
const MAX_SCORE = 5;
const FRICTION = 0.994;
const MAX_PUCK_SPEED = 15;
const CORNER_SIZE = 42;

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

export default function AirHockeyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [winner, setWinner] = useState<"p1" | "p2" | null>(null);
  const [vsBot, setVsBot] = useState(false);
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  // Physics Refs
  const p1Ref = useRef({ x: W / 2, y: H - 80, vx: 0, vy: 0, prevX: W / 2, prevY: H - 80 });
  const p2Ref = useRef({ x: W / 2, y: 80, vx: 0, vy: 0, prevX: W / 2, prevY: 80 });
  const puckRef = useRef({ x: W / 2, y: H / 2, vx: 0, vy: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const scoreP1Ref = useRef(0);
  const scoreP2Ref = useRef(0);
  const matchDurationRef = useRef(0);
  const lastHitTimeRef = useRef(0);
  const stuckWatchdogRef = useRef({ x: W / 2, y: H / 2, frames: 0 });
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Touch tracking map: identifier -> "p1" | "p2"
  const touchMapRef = useRef<Map<number, "p1" | "p2">>(new Map());

  // Reset Puck to center
  const resetPuck = (toward: "p1" | "p2") => {
    puckRef.current.x = W / 2;
    puckRef.current.y = H / 2;
    const angle = (Math.random() - 0.5) * 0.8;
    const speed = 4;
    puckRef.current.vx = Math.sin(angle) * speed;
    puckRef.current.vy = toward === "p1" ? speed : -speed;
  };

  // Start New Match
  const initGame = useCallback((playWithBot = false) => {
    setVsBot(playWithBot);
    scoreP1Ref.current = 0;
    scoreP2Ref.current = 0;
    setScoreP1(0);
    setScoreP2(0);
    setWinner(null);
    setEarnedReward(null);
    setLimitNotice(null);
    matchDurationRef.current = Date.now();

    p1Ref.current = { x: W / 2, y: H - 80, vx: 0, vy: 0, prevX: W / 2, prevY: H - 80 };
    p2Ref.current = { x: W / 2, y: 80, vx: 0, vy: 0, prevX: W / 2, prevY: 80 };
    resetPuck(Math.random() > 0.5 ? "p1" : "p2");

    setGameState("playing");
  }, []);

  // Spawn Burst Particles
  const spawnBurst = (x: number, y: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
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

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
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
        touchMapRef.current.set(t.identifier, "p1");
        p1Ref.current.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, cx));
        p1Ref.current.y = Math.max(H / 2 + PADDLE_R + 5, Math.min(H - PADDLE_R - 10, cy));
      } else if (!vsBot) {
        touchMapRef.current.set(t.identifier, "p2");
        p2Ref.current.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, cx));
        p2Ref.current.y = Math.max(PADDLE_R + 10, Math.min(H / 2 - PADDLE_R - 5, cy));
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const assigned = touchMapRef.current.get(t.identifier);
      const cx = (t.clientX - rect.left) * scaleX;
      const cy = (t.clientY - rect.top) * scaleY;

      if (assigned === "p1") {
        const p1 = p1Ref.current;
        p1.prevX = p1.x;
        p1.prevY = p1.y;
        p1.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, cx));
        p1.y = Math.max(H / 2 + PADDLE_R + 5, Math.min(H - PADDLE_R - 10, cy));
        p1.vx = p1.x - p1.prevX;
        p1.vy = p1.y - p1.prevY;
      } else if (assigned === "p2" && !vsBot) {
        const p2 = p2Ref.current;
        p2.prevX = p2.x;
        p2.prevY = p2.y;
        p2.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, cx));
        p2.y = Math.max(PADDLE_R + 10, Math.min(H / 2 - PADDLE_R - 5, cy));
        p2.vx = p2.x - p2.prevX;
        p2.vy = p2.y - p2.prevY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      touchMapRef.current.delete(e.changedTouches[i].identifier);
    }
  };

  // Keyboard steering for single player / desktop testing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "Space" && gameState === "idle") {
        initGame(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameState, initGame]);

  // Mouse fallback for single player / desktop testing
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if (cy > H / 2) {
      const p1 = p1Ref.current;
      p1.prevX = p1.x;
      p1.prevY = p1.y;
      p1.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, cx));
      p1.y = Math.max(H / 2 + PADDLE_R + 5, Math.min(H - PADDLE_R - 10, cy));
      p1.vx = p1.x - p1.prevX;
      p1.vy = p1.y - p1.prevY;
    }
  };

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      // --- UPDATE PHYSICS ---
      if (gameState === "playing") {
        const puck = puckRef.current;
        const p1 = p1Ref.current;
        const p2 = p2Ref.current;

        // Keyboard Controls for Player 1
        const keys = keysRef.current;
        let kx = 0;
        let ky = 0;
        if (keys["ArrowLeft"] || keys["KeyA"]) kx -= 1;
        if (keys["ArrowRight"] || keys["KeyD"]) kx += 1;
        if (keys["ArrowUp"] || keys["KeyW"]) ky -= 1;
        if (keys["ArrowDown"] || keys["KeyS"]) ky += 1;
        if (kx !== 0 || ky !== 0) {
          const moveSpeed = 6.5;
          p1.prevX = p1.x;
          p1.prevY = p1.y;
          p1.x = Math.max(PADDLE_R + 10, Math.min(W - PADDLE_R - 10, p1.x + kx * moveSpeed));
          p1.y = Math.max(H / 2 + PADDLE_R + 5, Math.min(H - PADDLE_R - 10, p1.y + ky * moveSpeed));
          p1.vx = p1.x - p1.prevX;
          p1.vy = p1.y - p1.prevY;
        }

        // Bot AI if in vsBot mode
        if (vsBot) {
          let targetX = W / 2;
          let targetY = 75;

          if (puck.y > H / 2) {
            // DEFENSIVE STANCE: Puck is in Player 1's court
            // Guard the net smoothly tracking puck X, staying within goal post range
            targetX = Math.max(W / 2 - 65, Math.min(W / 2 + 65, puck.x));
            targetY = 75;
          } else {
            // Puck is in Bot's court
            if (puck.y < p2.y + 12 || puck.y < 80) {
              // BEHIND BOT OR DEEP IN BACK WALL/CORNER!
              // NEVER push up into the wall or corner!
              // Swing to open side and drop lower toward center to let corner/wall deflect it:
              if (puck.x > W / 2) {
                targetX = Math.max(PADDLE_R + 25, puck.x - 70);
              } else {
                targetX = Math.min(W - PADDLE_R - 25, puck.x + 70);
              }
              targetY = 115;
            } else {
              // STRIKE ZONE: Puck is in front of bot
              targetX = puck.x + (puck.x > W / 2 ? -10 : 10);
              targetY = Math.min(H / 2 - PADDLE_R - 8, puck.y - PADDLE_R - 6);
            }
          }

          p2.prevX = p2.x;
          p2.prevY = p2.y;
          p2.vx = (targetX - p2.x) * 0.14;
          p2.vy = (targetY - p2.y) * 0.14;
          p2.x += p2.vx;
          p2.y += p2.vy;

          // Strict boundary clamping for Bot paddle
          p2.x = Math.max(PADDLE_R + 15, Math.min(W - PADDLE_R - 15, p2.x));
          p2.y = Math.max(PADDLE_R + 25, Math.min(H / 2 - PADDLE_R - 10, p2.y));
        }

        // Apply Puck Velocity & Friction
        puck.x += puck.vx;
        puck.y += puck.vy;
        puck.vx *= FRICTION;
        puck.vy *= FRICTION;

        // Clamp puck max speed
        const speed = Math.hypot(puck.vx, puck.vy);
        if (speed > MAX_PUCK_SPEED) {
          puck.vx = (puck.vx / speed) * MAX_PUCK_SPEED;
          puck.vy = (puck.vy / speed) * MAX_PUCK_SPEED;
        }

        // Prevent dead puck stranded on center line unreachable by paddles
        if (Math.abs(puck.y - H / 2) < 35 && speed < 0.6) {
          puck.vy = puck.y <= H / 2 ? 2.2 : -2.2;
        }

        // Anti-Stall / Anti-Freeze Watchdog (Never allows puck to remain pinned anywhere)
        const sw = stuckWatchdogRef.current;
        if (Math.hypot(puck.x - sw.x, puck.y - sw.y) < 15) {
          sw.frames++;
          if (sw.frames > 40) {
            // Eject toward center!
            const toCenterX = W / 2 - puck.x;
            const toCenterY = H / 2 - puck.y;
            const dist = Math.hypot(toCenterX, toCenterY) || 1;
            puck.vx = (toCenterX / dist) * 7;
            puck.vy = (toCenterY / dist) * 7;
            sw.frames = 0;
            p2.x = W / 2;
            p2.y = 80;
            ArcadeAudio.playBonus();
            spawnBurst(puck.x, puck.y, "#F59E0B", 12);
          }
        } else {
          sw.x = puck.x;
          sw.y = puck.y;
          sw.frames = 0;
        }

        // 45° Corner Chamfer Bouncers (Prevents corner trapping)
        // Top-Left Corner (15, 15)
        if (puck.x < 15 + CORNER_SIZE && puck.y < 15 + CORNER_SIZE) {
          const cornerDist = (puck.x - 15) + (puck.y - 15);
          if (cornerDist < CORNER_SIZE) {
            puck.vx = Math.abs(puck.vx) * 0.95 + 2.8;
            puck.vy = Math.abs(puck.vy) * 0.95 + 2.8;
            puck.x = 15 + CORNER_SIZE / 2 + 2;
            puck.y = 15 + CORNER_SIZE / 2 + 2;
            ArcadeAudio.playDrop();
          }
        }
        // Top-Right Corner (W - 15, 15)
        if (puck.x > W - 15 - CORNER_SIZE && puck.y < 15 + CORNER_SIZE) {
          const cornerDist = (W - 15 - puck.x) + (puck.y - 15);
          if (cornerDist < CORNER_SIZE) {
            puck.vx = -(Math.abs(puck.vx) * 0.95 + 2.8);
            puck.vy = Math.abs(puck.vy) * 0.95 + 2.8;
            puck.x = W - 15 - CORNER_SIZE / 2 - 2;
            puck.y = 15 + CORNER_SIZE / 2 + 2;
            ArcadeAudio.playDrop();
          }
        }
        // Bottom-Left Corner (15, H - 15)
        if (puck.x < 15 + CORNER_SIZE && puck.y > H - 15 - CORNER_SIZE) {
          const cornerDist = (puck.x - 15) + (H - 15 - puck.y);
          if (cornerDist < CORNER_SIZE) {
            puck.vx = Math.abs(puck.vx) * 0.95 + 2.8;
            puck.vy = -(Math.abs(puck.vy) * 0.95 + 2.8);
            puck.x = 15 + CORNER_SIZE / 2 + 2;
            puck.y = H - 15 - CORNER_SIZE / 2 - 2;
            ArcadeAudio.playDrop();
          }
        }
        // Bottom-Right Corner (W - 15, H - 15)
        if (puck.x > W - 15 - CORNER_SIZE && puck.y > H - 15 - CORNER_SIZE) {
          const cornerDist = (W - 15 - puck.x) + (H - 15 - puck.y);
          if (cornerDist < CORNER_SIZE) {
            puck.vx = -(Math.abs(puck.vx) * 0.95 + 2.8);
            puck.vy = -(Math.abs(puck.vy) * 0.95 + 2.8);
            puck.x = W - 15 - CORNER_SIZE / 2 - 2;
            puck.y = H - 15 - CORNER_SIZE / 2 - 2;
            ArcadeAudio.playDrop();
          }
        }

        // Left & Right Wall Collision
        if (puck.x - PUCK_R <= 15) {
          puck.x = 15 + PUCK_R;
          puck.vx = Math.abs(puck.vx) * 0.95;
          ArcadeAudio.playDrop();
        } else if (puck.x + PUCK_R >= W - 15) {
          puck.x = W - 15 - PUCK_R;
          puck.vx = -Math.abs(puck.vx) * 0.95;
          ArcadeAudio.playDrop();
        }

        // Top Wall Collision (Check Goal)
        const goalLeft = W / 2 - GOAL_WIDTH / 2;
        const goalRight = W / 2 + GOAL_WIDTH / 2;

        if (puck.y - PUCK_R <= 15) {
          if (puck.x >= goalLeft && puck.x <= goalRight) {
            // GOAL FOR PLAYER 1!
            scoreP1Ref.current += 1;
            const newScore = scoreP1Ref.current;
            setScoreP1(newScore);
            ArcadeAudio.playScore(newScore);
            spawnBurst(puck.x, 25, "#38BDF8", 30);

            if (newScore >= MAX_SCORE) {
              setWinner("p1");
              setGameState("gameover");
              ArcadeAudio.playPerfect(5);

              const elapsedSec = Math.max(10, Math.floor((Date.now() - matchDurationRef.current) / 1000));
              const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "") : "";
              submitGameSessionAction({
                gameSlug: "air-hockey",
                score: newScore,
                storeName: targetStore,
                duration: elapsedSec,
              }).then((res) => {
                if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
                if (res?.success && res?.rewardEarned && res?.claimCode) {
                  setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
                }
              });
            } else {
              resetPuck("p2");
            }
          } else {
            puck.y = 15 + PUCK_R;
            puck.vy = Math.abs(puck.vy) * 0.95;
            ArcadeAudio.playDrop();
          }
        }

        // Bottom Wall Collision (Check Goal)
        if (puck.y + PUCK_R >= H - 15) {
          if (puck.x >= goalLeft && puck.x <= goalRight) {
            // GOAL FOR PLAYER 2!
            scoreP2Ref.current += 1;
            const newScore = scoreP2Ref.current;
            setScoreP2(newScore);
            ArcadeAudio.playScore(newScore);
            spawnBurst(puck.x, H - 25, "#F43F5E", 30);

            if (newScore >= MAX_SCORE) {
              setWinner("p2");
              setGameState("gameover");
              ArcadeAudio.playPerfect(5);

              const elapsedSec = Math.max(10, Math.floor((Date.now() - matchDurationRef.current) / 1000));
              const targetStore = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "") : "";
              submitGameSessionAction({
                gameSlug: "air-hockey",
                score: newScore,
                storeName: targetStore,
                duration: elapsedSec,
              }).then((res) => {
                if (res?.limitReached) setLimitNotice(res.error || "Daily limit reached.");
                if (res?.success && res?.rewardEarned && res?.claimCode) {
                  setEarnedReward({ rewardName: res.rewardEarned.rewardName, claimCode: res.claimCode });
                }
              });
            } else {
              resetPuck("p1");
            }
          } else {
            puck.y = H - 15 - PUCK_R;
            puck.vy = -Math.abs(puck.vy) * 0.95;
            ArcadeAudio.playDrop();
          }
        }

        // Paddle Collision Helper
        const checkPaddleHit = (p: typeof p1Ref.current, isP1: boolean) => {
          const dx = puck.x - p.x;
          const dy = puck.y - p.y;
          const dist = Math.hypot(dx, dy);
          const minDist = PADDLE_R + PUCK_R;

          if (dist < minDist) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);

            // Separate overlapping circles
            puck.x = p.x + nx * minDist;
            puck.y = p.y + ny * minDist;

            // Transfer paddle momentum + impulse
            const baseImpulse = 8.5;
            puck.vx = nx * baseImpulse + (p.vx || 0) * 0.55;
            puck.vy = ny * baseImpulse + (p.vy || 0) * 0.55;

            // ANTI-PINCH: If near top wall and hit by bot (P2), NEVER push upward into the wall!
            if (!isP1 && puck.y <= 65) {
              puck.vy = Math.max(Math.abs(puck.vy), 5.5);
              puck.y = Math.max(puck.y, 15 + PUCK_R + 2);
            }
            // ANTI-PINCH: If near bottom wall and hit by P1, NEVER push downward into bottom wall!
            if (isP1 && puck.y >= H - 65) {
              puck.vy = -Math.max(Math.abs(puck.vy), 5.5);
              puck.y = Math.min(puck.y, H - 15 - PUCK_R - 2);
            }
            // ANTI-PINCH: If near side walls, ensure impulse points inward
            if (puck.x <= 40) {
              puck.vx = Math.max(Math.abs(puck.vx), 4.5);
              puck.x = Math.max(puck.x, 15 + PUCK_R + 2);
            } else if (puck.x >= W - 40) {
              puck.vx = -Math.max(Math.abs(puck.vx), 4.5);
              puck.x = Math.min(puck.x, W - 15 - PUCK_R - 2);
            }

            // Rate-limit audio and burst particles so they don't fire 60 times/sec if grazing
            const now = Date.now();
            if (now - lastHitTimeRef.current > 100) {
              lastHitTimeRef.current = now;
              ArcadeAudio.playTap();
              spawnBurst(puck.x, puck.y, isP1 ? "#38BDF8" : "#F43F5E", 10);
            }
          }
        };

        checkPaddleHit(p1, true);
        checkPaddleHit(p2, false);
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, W, H);

      // Rink Floor Gradient
      const rinkGrad = ctx.createLinearGradient(0, 0, 0, H);
      rinkGrad.addColorStop(0, "#08101E");
      rinkGrad.addColorStop(0.5, "#0F172A");
      rinkGrad.addColorStop(1, "#1E0B1A");
      ctx.fillStyle = rinkGrad;
      ctx.fillRect(0, 0, W, H);

      // Neon Outer Border
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, W - 30, H - 30);

      // 45° Angled Corner Chamfers (Neon Bumpers)
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(15, 15 + CORNER_SIZE); ctx.lineTo(15 + CORNER_SIZE, 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 15 - CORNER_SIZE, 15); ctx.lineTo(W - 15, 15 + CORNER_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, H - 15 - CORNER_SIZE); ctx.lineTo(15 + CORNER_SIZE, H - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 15 - CORNER_SIZE, H - 15); ctx.lineTo(W - 15, H - 15 - CORNER_SIZE); ctx.stroke();

      // Center Divider Line
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(15, H / 2);
      ctx.lineTo(W - 15, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center Faceoff Circle
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top Goal (Player 2)
      const goalLeft = W / 2 - GOAL_WIDTH / 2;
      ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
      ctx.fillRect(goalLeft, 5, GOAL_WIDTH, 14);
      ctx.strokeStyle = "#F43F5E";
      ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, 5, GOAL_WIDTH, 14);

      // Bottom Goal (Player 1)
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.fillRect(goalLeft, H - 19, GOAL_WIDTH, 14);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 3;
      ctx.strokeRect(goalLeft, H - 19, GOAL_WIDTH, 14);

      // Mirrored Scores in Court
      // Player 2 Score (Rotated 180° for opponent across table)
      ctx.save();
      ctx.translate(W / 2, H / 4);
      ctx.rotate(Math.PI);
      ctx.font = "black 52px sans-serif";
      ctx.fillStyle = "rgba(244, 63, 94, 0.35)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${scoreP2}`, 0, 0);

      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "rgba(244, 63, 94, 0.6)";
      ctx.fillText(vsBot ? "BARISTA BOT" : "PLAYER 2", 0, 36);
      ctx.restore();

      // Player 1 Score (Standard orientation)
      ctx.save();
      ctx.translate(W / 2, (3 * H) / 4);
      ctx.font = "black 52px sans-serif";
      ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${scoreP1}`, 0, 0);

      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
      ctx.fillText("PLAYER 1", 0, 36);
      ctx.restore();

      // Render Player 2 Paddle (Neon Rose)
      const p2 = p2Ref.current;
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#BE123C";
      ctx.fill();
      ctx.strokeStyle = "#FB7185";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p2.x, p2.y, PADDLE_R * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF1F2";
      ctx.fill();

      // Render Player 1 Paddle (Neon Cyan)
      const p1 = p1Ref.current;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, PADDLE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#0369A1";
      ctx.fill();
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, PADDLE_R * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#F0F9FF";
      ctx.fill();

      // Render Puck (Neon Golden Disc with glow)
      const puck = puckRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, PUCK_R + 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(puck.x, puck.y, PUCK_R, 0, Math.PI * 2);
      ctx.fillStyle = "#F59E0B";
      ctx.fill();
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        const alpha = 1 - pt.life / pt.maxLife;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, pt.size * alpha), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Start Screen Overlay
      if (gameState === "idle") {
        ctx.fillStyle = "rgba(10, 15, 26, 0.85)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#38BDF8";
        ctx.font = "black 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("NEON AIR HOCKEY", W / 2, H / 2 - 40);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "13px sans-serif";
        ctx.fillText("Place phone flat on table between you", W / 2, H / 2 - 10);
        ctx.fillText("First to 5 goals wins the match!", W / 2, H / 2 + 12);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, vsBot, initGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-2 select-none">
      {/* Header Bar */}
      <div className="w-[340px] flex justify-between items-center mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🏒</span>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
            Air Hockey 2P
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
            TABLETOP 2P
          </span>
        </div>
      </div>

      {/* Canvas Rink */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          className="cursor-pointer block touch-none"
        />

        {/* Start Game Mode Modal */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl mb-3 border border-blue-500/40">
              🏒
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              AIR HOCKEY 2P
            </h2>
            <p className="text-neutral-400 text-xs mb-6 max-w-[240px]">
              Lay phone flat on the table. Each person controls their side!
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-[240px]">
              <button
                onClick={() => {
                  ArcadeAudio.init();
                  initGame(false);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-500/30 active:scale-98 transition"
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

            {winner === "p1" ? (
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
                  <span className="text-2xl font-black text-white">{scoreP1}</span>
                </div>
                <span className="text-neutral-500 font-bold text-sm">VS</span>
                <div className="text-center">
                  <span className="text-[11px] text-rose-400 font-bold block">
                    {vsBot ? "BOT" : "P2 (RED)"}
                  </span>
                  <span className="text-2xl font-black text-white">{scoreP2}</span>
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
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition active:scale-[0.98]"
            >
              Play Rematch
            </button>
          </div>
        )}
      </div>

      {/* Tabletop Play Guide */}
      <div className="w-[340px] mt-2 flex items-center justify-between text-neutral-500 text-[11px] px-2 font-medium">
        <span>📱 Flat on table or ⌨️ WASD/Arrows</span>
        <span>Drag paddle or keys to hit puck</span>
      </div>
    </div>
  );
}
