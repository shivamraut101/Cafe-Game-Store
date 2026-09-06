"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { submitGameSessionAction } from "../../actions/gameActions";
import { ArcadeAudio } from "@/lib/audioEngine";

// ─── Tuned Constants ─────────────────────────────────────
const W = 340;
const H = 520;
const GRAVITY = 0.32;
const JUMP_VEL = -6.0;
const MAX_FALL = 7;
const BIRD_W = 42;
const BIRD_H = 36;
const BIRD_X = 80;

const PIPE_W = 56;
const GAP_START = 165;
const GAP_MIN = 125;
const SPD_START = 1.6;
const SPD_MAX = 3.5;
const PIPE_DIST = 210;
const HIT_SHRINK = 8;
const GROUND_H = 40;

const PALETTES = [
  { body: "#6B4226", cap: "#3E2723", hi: "#A1887F" },
  { body: "#E91E63", cap: "#AD1457", hi: "#F48FB1" },
  { body: "#00897B", cap: "#004D40", hi: "#80CBC4" },
  { body: "#7E57C2", cap: "#4527A0", hi: "#B39DDB" },
  { body: "#FF8F00", cap: "#E65100", hi: "#FFCC80" },
];

interface Pipe { x: number; gapY: number; scored: boolean; ci: number; }
interface Pt { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number; }

export default function FlappyBaristaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<"idle" | "playing" | "dead">("idle");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const ptsRef = useRef(0);
  const waitRef = useRef(0);
  const [, forceRender] = React.useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const [earnedReward, setEarnedReward] = useState<{ rewardName: string; claimCode: string } | null>(null);
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

  const birdRef = useRef({ y: H / 2 - 40, vy: 0, rot: 0, tRot: 0, flapFrame: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Pt[]>([]);
  const fRef = useRef(0);
  const flashRef = useRef(0);
  const distRef = useRef(0);
  const cooldownRef = useRef(0);
  const scoreFlashRef = useRef(0);

  const gap = () => {
    const startGap = isChallenger ? 138 : GAP_START;
    const minGap = isChallenger ? 112 : GAP_MIN;
    return Math.max(minGap, startGap - scoreRef.current * 2.4);
  };
  const spd = () => {
    const startSpd = isChallenger ? 2.1 : SPD_START;
    const maxSpd = isChallenger ? 4.0 : SPD_MAX;
    return Math.min(maxSpd, startSpd + scoreRef.current * (isChallenger ? 0.11 : 0.07));
  };

  // ─── High-Performance Audio ────────────────────────────
  const snd = useCallback((t: "flap" | "score" | "die") => {
    if (t === "flap") ArcadeAudio.playJump();
    else if (t === "score") ArcadeAudio.playScore();
    else ArcadeAudio.playCrash();
  }, []);

  const burst = useCallback((x: number, y: number, color: string, n: number) => {
    if (particlesRef.current.length > 35) {
      particlesRef.current.splice(0, particlesRef.current.length - 20);
    }
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const s = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1,
        life: 0, max: 22 + Math.random() * 18, color, r: 2 + Math.random() * 3,
      });
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => { waitRef.current++; rerender(); }, 1000);
    return () => clearInterval(t);
  }, [rerender]);

  // ─── Input ──────────────────────────────────────────────
  const handleInput = useCallback((e: Event) => {
    e.preventDefault(); e.stopPropagation();
    const s = stateRef.current;
    if (s === "idle") {
      setEarnedReward(null);
      setLimitNotice(null);
      birdRef.current = { y: H / 2 - 40, vy: 0, rot: 0, tRot: 0, flapFrame: 0 };
      pipesRef.current = []; particlesRef.current = [];
      scoreRef.current = 0; fRef.current = 0; distRef.current = 0; flashRef.current = 0;
      stateRef.current = "playing"; rerender();
      birdRef.current.vy = JUMP_VEL;
      birdRef.current.flapFrame = 12;
      snd("flap"); return;
    }
    if (s === "dead") {
      if (cooldownRef.current > 0) return;
      setEarnedReward(null);
      setLimitNotice(null);
      birdRef.current = { y: H / 2 - 40, vy: 0, rot: 0, tRot: 0, flapFrame: 0 };
      pipesRef.current = []; particlesRef.current = [];
      scoreRef.current = 0; fRef.current = 0; distRef.current = 0; flashRef.current = 0;
      stateRef.current = "playing"; rerender();
      birdRef.current.vy = JUMP_VEL;
      birdRef.current.flapFrame = 12;
      snd("flap"); return;
    }
    if (s === "playing") {
      birdRef.current.vy = JUMP_VEL;
      birdRef.current.tRot = -0.45;
      birdRef.current.flapFrame = 12;
      snd("flap");
      burst(BIRD_X - 10, birdRef.current.y + 14, "rgba(255,255,255,0.5)", 3);
      if (window.navigator?.vibrate) window.navigator.vibrate(10);
    }
  }, [snd, burst, rerender]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const h = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, input, [role='button']")) return;
      handleInput(e);
    };
    el.addEventListener("pointerdown", h, { passive: false });
    el.addEventListener("contextmenu", (e) => e.preventDefault());

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        handleInput(e);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      el.removeEventListener("pointerdown", h);
      window.removeEventListener("keydown", handleKey);
    };
  }, [handleInput]);

  // ─── Drawing ────────────────────────────────────────────
  const drawSky = (ctx: CanvasRenderingContext2D, f: number) => {
    // Rich warm gradient sky
    const g = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    g.addColorStop(0, "#E0F2FE"); // light blue top
    g.addColorStop(0.35, "#FEF3C7"); // warm cream
    g.addColorStop(0.7, "#FDE68A"); // golden
    g.addColorStop(1, "#F59E0B"); // deep amber horizon
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Sun glow
    const sunX = W - 60;
    const sunY = 65;
    const sg = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
    sg.addColorStop(0, "rgba(255,250,220,0.9)");
    sg.addColorStop(0.4, "rgba(255,230,150,0.3)");
    sg.addColorStop(1, "rgba(255,200,50,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
    // Sun disc
    ctx.fillStyle = "#FFF8DC";
    ctx.beginPath(); ctx.arc(sunX, sunY, 18, 0, Math.PI * 2); ctx.fill();

    // Parallax clouds - layer 1 (far, slow)
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    const c1 = (f * 0.15) % (W + 150);
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 160 + c1) % (W + 150)) - 75;
      const cy = 50 + i * 45;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 25, cy - 6, 28, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 18, cy + 3, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parallax clouds - layer 2 (close, faster)
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    const c2 = (f * 0.35) % (W + 120);
    for (let i = 0; i < 2; i++) {
      const cx = ((i * 200 + c2 + 80) % (W + 120)) - 60;
      const cy = 130 + i * 80;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 32, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 20, cy - 4, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant cafe skyline silhouettes
    ctx.fillStyle = "rgba(120,80,40,0.08)";
    const bOff = (f * 0.3) % (W + 250);
    for (let i = 0; i < 7; i++) {
      const bx = ((i * 70 + bOff) % (W + 250)) - 125;
      const bh = 50 + Math.sin(i * 2.3) * 25;
      ctx.fillRect(bx, H - GROUND_H - bh, 45, bh);
      // Roof triangle
      ctx.beginPath();
      ctx.moveTo(bx - 4, H - GROUND_H - bh);
      ctx.lineTo(bx + 22, H - GROUND_H - bh - 14);
      ctx.lineTo(bx + 49, H - GROUND_H - bh);
      ctx.fill();
    }
  };

  const drawGround = (ctx: CanvasRenderingContext2D, f: number, moving: boolean) => {
    const gy = H - GROUND_H;
    const off = moving ? (f * spd()) % 40 : 0;

    // Earth body
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, "#6B4226");
    gg.addColorStop(1, "#3E2723");
    ctx.fillStyle = gg;
    ctx.fillRect(0, gy, W, GROUND_H);

    // Dirt stripes
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let x = -off; x < W + 40; x += 40) {
      ctx.fillRect(x, gy + 8, 20, GROUND_H);
    }

    // Top soil edge with highlights
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(0, gy, W, 4);
    ctx.fillStyle = "#4E342E";
    ctx.fillRect(0, gy + 4, W, 2);

    // Grass tufts
    for (let x = -off * 0.8; x < W + 14; x += 10) {
      const h = 6 + Math.sin(x * 0.5) * 2;
      ctx.fillStyle = "#22C55E";
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + 2, gy - h);
      ctx.lineTo(x + 5, gy);
      ctx.fill();
      // Darker tuft next to it
      ctx.fillStyle = "#16A34A";
      ctx.beginPath();
      ctx.moveTo(x + 4, gy);
      ctx.lineTo(x + 6, gy - h + 2);
      ctx.lineTo(x + 8, gy);
      ctx.fill();
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, p: Pipe) => {
    const pal = PALETTES[p.ci % PALETTES.length];
    const g = gap();
    const topH = p.gapY - g / 2;
    const botY = p.gapY + g / 2;

    // --- Top Pipe ---
    // Body gradient
    const tg = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
    tg.addColorStop(0, pal.hi); tg.addColorStop(0.25, pal.body);
    tg.addColorStop(0.85, pal.body); tg.addColorStop(1, pal.cap);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.roundRect(p.x + 6, -5, PIPE_W - 12, topH + 1, [0, 0, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight strip
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(p.x + 10, 0, 6, topH - 6);

    // Cap with 3D feel
    ctx.fillStyle = pal.cap;
    ctx.beginPath();
    ctx.roundRect(p.x - 2, topH - 10, PIPE_W + 4, 18, [0, 0, 6, 6]);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    // Cap highlight
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(p.x + 2, topH - 8, PIPE_W - 4, 5);

    // Decorative band
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(p.x + 6, topH - 30, PIPE_W - 12, 8);

    // --- Bottom Pipe ---
    const bg = ctx.createLinearGradient(p.x, botY, p.x + PIPE_W, botY);
    bg.addColorStop(0, pal.hi); bg.addColorStop(0.25, pal.body);
    bg.addColorStop(0.85, pal.body); bg.addColorStop(1, pal.cap);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(p.x + 6, botY + 10, PIPE_W - 12, H - GROUND_H - botY, [4, 4, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 2; ctx.stroke();

    // Highlight strip
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(p.x + 10, botY + 14, 6, H - GROUND_H - botY - 14);

    // Cap
    ctx.fillStyle = pal.cap;
    ctx.beginPath();
    ctx.roundRect(p.x - 2, botY - 2, PIPE_W + 4, 18, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(p.x + 2, botY + 1, PIPE_W - 4, 5);

    // Decorative band
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(p.x + 6, botY + 26, PIPE_W - 12, 8);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, f: number, flapFrame: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Drop shadow on ground (only if close)
    const distToGround = H - GROUND_H - y;
    if (distToGround < 200) {
      const shadowAlpha = Math.max(0, 0.15 * (1 - distToGround / 200));
      ctx.save();
      ctx.rotate(-rot); // Undo rotation for shadow
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(0, distToGround - 5, BIRD_W * 0.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // === COFFEE CUP ===
    const hw = BIRD_W / 2;
    const hh = BIRD_H / 2;

    // Wings (flap animation)
    const wingAngle = flapFrame > 0 ? Math.sin(flapFrame * 0.8) * 0.5 : Math.sin(f * 0.1) * 0.15;
    ctx.fillStyle = "#E0E0E0";
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1.5;
    // Left wing
    ctx.save();
    ctx.translate(-hw + 2, -2);
    ctx.rotate(-0.3 - wingAngle);
    ctx.beginPath();
    ctx.ellipse(-10, 0, 12, 5, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.translate(hw - 6, -2);
    ctx.rotate(0.3 + wingAngle);
    ctx.beginPath();
    ctx.ellipse(10, 0, 12, 5, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Cup body (white ceramic)
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-hw + 3, -hh + 2);
    ctx.lineTo(hw - 3, -hh + 2);
    ctx.lineTo(hw - 7, hh - 2);
    ctx.lineTo(-hw + 7, hh - 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Cup inner rim
    ctx.fillStyle = "#F5F5F5";
    ctx.beginPath();
    ctx.ellipse(0, -hh + 5, hw - 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#CCC";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Coffee liquid
    ctx.fillStyle = "#5D3A1A";
    ctx.beginPath();
    ctx.ellipse(0, -hh + 7, hw - 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Latte art swirl
    ctx.strokeStyle = "#C8A882";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -hh + 7, 4, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-2, -hh + 7, 2, 0, Math.PI * 2);
    ctx.stroke();

    // Cup ceramic shine
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 10);
    ctx.lineTo(-hw + 9, -hh + 10);
    ctx.lineTo(-hw + 11, hh - 6);
    ctx.lineTo(-hw + 8, hh - 6);
    ctx.closePath();
    ctx.fill();

    // Handle (right side)
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hw - 4, 2, 8, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hw - 4, 0, 8, -Math.PI * 0.3, Math.PI * 0.15);
    ctx.stroke();

    // Saucer (small plate under cup)
    ctx.fillStyle = "#E8E8E8";
    ctx.strokeStyle = "#AAA";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, hh, hw - 2, 5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Steam wisps (animated, only when not diving)
    if (rot < 0.3) {
      ctx.strokeStyle = "rgba(200,200,200,0.5)";
      ctx.lineWidth = 1.5;
      const sp = f * 0.1;
      for (let i = 0; i < 3; i++) {
        const sx = -8 + i * 8;
        const sy = -hh - 1;
        const amp = 4 + Math.sin(sp + i) * 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(
          sx + Math.sin(sp + i * 1.5) * amp, sy - 10,
          sx - Math.sin(sp + i * 1.5 + 1) * amp, sy - 18,
          sx + Math.sin(sp + i * 2) * 2, sy - 24
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // ─── Game Loop ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const loop = () => {
      fRef.current++;
      const f = fRef.current;
      const bird = birdRef.current;
      const pipes = pipesRef.current;
      const state = stateRef.current;
      const speed = spd();

      ctx.clearRect(0, 0, W, H);
      drawSky(ctx, f);

      // ─── Playing ───────────────────────────────────
      if (state === "playing") {
        bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
        bird.y += bird.vy;
        if (bird.flapFrame > 0) bird.flapFrame--;

        // Smooth rotation
        bird.tRot = bird.vy < -1 ? -0.4 : Math.min(Math.PI / 3, bird.vy * 0.08);
        bird.rot += (bird.tRot - bird.rot) * 0.1;

        // Pipe spawning
        distRef.current += speed;
        if (distRef.current >= PIPE_DIST) {
          distRef.current -= PIPE_DIST;
          const g = gap();
          const minY = 70 + g / 2;
          const maxY = H - GROUND_H - 70 - g / 2;
          let gapY = minY + Math.random() * (maxY - minY);
          if (pipes.length > 0) {
            const prev = pipes[pipes.length - 1].gapY;
            const maxD = 110;
            gapY = Math.max(minY, Math.min(maxY, prev + (gapY - prev) * 0.55));
            gapY = Math.max(prev - maxD, Math.min(prev + maxD, gapY));
          }
          pipes.push({ x: W + 10, gapY, scored: false, ci: Math.floor(Math.random() * PALETTES.length) });
        }

        // Move pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
          pipes[i].x -= speed;
          if (!pipes[i].scored && pipes[i].x + PIPE_W < BIRD_X - BIRD_W / 2) {
            pipes[i].scored = true;
            scoreRef.current++;
            scoreFlashRef.current = 20;
            snd("score");
            burst(BIRD_X, bird.y - 20, "#FDE68A", 8);
            burst(BIRD_X + 10, bird.y - 15, "#34D399", 6);
            rerender();
          }
          if (pipes[i].x < -PIPE_W - 20) pipes.splice(i, 1);
        }

        // Collision
        const bT = bird.y - BIRD_H / 2 + HIT_SHRINK;
        const bB = bird.y + BIRD_H / 2 - HIT_SHRINK;
        const bL = BIRD_X - BIRD_W / 2 + HIT_SHRINK;
        const bR = BIRD_X + BIRD_W / 2 - HIT_SHRINK;
        let dead = false;

        if (bB >= H - GROUND_H) { bird.y = H - GROUND_H - BIRD_H / 2 + HIT_SHRINK; dead = true; }
        if (bT <= 0) { bird.y = BIRD_H / 2 - HIT_SHRINK; bird.vy = 1; }

        if (!dead) {
          const g = gap();
          for (const pipe of pipes) {
            if (bR > pipe.x + 6 && bL < pipe.x + PIPE_W - 6) {
              if (bT < pipe.gapY - g / 2 || bB > pipe.gapY + g / 2) { dead = true; break; }
            }
          }
        }

        if (dead) {
          stateRef.current = "dead";
          cooldownRef.current = 50;
          snd("die"); flashRef.current = 1.0;
          burst(BIRD_X, bird.y, "#FF4C29", 18);
          burst(BIRD_X, bird.y, "#FFF", 10);
          if (window.navigator?.vibrate) window.navigator.vibrate([120, 60, 180]);
          const fs = scoreRef.current;
          if (fs > bestRef.current) bestRef.current = fs;
          ptsRef.current += fs * 15;
          rerender();

          // Submit session & check for reward vouchers via Server Action
          const targetStoreName = typeof window !== "undefined" ? (sessionStorage.getItem("selectedStore") || "Downtown Tacos & Tequila") : "Downtown Tacos & Tequila";
          const elapsedSec = Math.max(2, Math.round(fRef.current / 60));
          submitGameSessionAction({ gameSlug: "flappy-barista", score: fs, storeName: targetStoreName, duration: elapsedSec }).then((res) => {
            if (res.limitReached) {
              setLimitNotice(res.error || "Daily limit reached for this game.");
            }
            if (res.success && res.rewardEarned && res.claimCode) {
              setEarnedReward({
                rewardName: res.rewardEarned.rewardName,
                claimCode: res.claimCode,
              });
            }
          });
        }
      }

      // Dead - bird tumbles to ground
      if (state === "dead") {
        bird.vy = Math.min(bird.vy + GRAVITY * 1.5, 10);
        bird.y = Math.min(bird.y + bird.vy, H - GROUND_H - BIRD_H / 2);
        bird.rot = Math.min(bird.rot + 0.06, Math.PI / 2);
        if (cooldownRef.current > 0) cooldownRef.current--;
      }

      // ─── Render ────────────────────────────────────
      pipes.forEach((p) => drawPipe(ctx, p));
      drawGround(ctx, f, state === "playing");

      // Bird
      if (state === "idle") {
        const iy = H / 2 - 50 + Math.sin(f * 0.035) * 14;
        drawBird(ctx, BIRD_X, iy, Math.sin(f * 0.035) * 0.08, f, 0);
      } else {
        drawBird(ctx, BIRD_X, bird.y, bird.rot, f, bird.flapFrame);
      }

      // Particles
      const pts = particlesRef.current;
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life++;
        const a = Math.max(0, 1 - p.life / p.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
        if (p.life >= p.max) pts.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // Death flash
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.6})`;
        ctx.fillRect(0, 0, W, H);
        flashRef.current = Math.max(0, flashRef.current - 0.045);
      }

      // Score flash
      if (scoreFlashRef.current > 0) scoreFlashRef.current--;

      // In-canvas score
      if (state === "playing") {
        const sc = String(scoreRef.current);
        ctx.save();
        const baseSize = 52;
        const pulseSize = scoreFlashRef.current > 0 ? baseSize + scoreFlashRef.current * 0.6 : baseSize;
        ctx.font = `900 ${pulseSize}px 'Arial Black', sans-serif`;
        ctx.textAlign = "center";
        // Multi-layer text for depth
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillText(sc, W / 2 + 2, 80);
        ctx.strokeStyle = "#5B3A29";
        ctx.lineWidth = 5;
        ctx.strokeText(sc, W / 2, 78);
        ctx.strokeStyle = "#1A1A1A";
        ctx.lineWidth = 3;
        ctx.strokeText(sc, W / 2, 78);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(sc, W / 2, 78);

        // Score flash glow
        if (scoreFlashRef.current > 10) {
          const glow = ctx.createRadialGradient(W / 2, 65, 5, W / 2, 65, 50);
          glow.addColorStop(0, `rgba(52,211,153,${(scoreFlashRef.current - 10) * 0.04})`);
          glow.addColorStop(1, "rgba(52,211,153,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(W / 2 - 50, 15, 100, 100);
        }
        ctx.restore();
      }

      // Idle instructions
      if (state === "idle") {
        ctx.save();
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        const tapY = H / 2 + 60 + Math.sin(f * 0.06) * 4;
        ctx.fillText("👆 TAP ANYWHERE TO START", W / 2, tapY);
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const state = stateRef.current;

  return (
    <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-between p-3 select-none">
      {/* Header */}
      <header className="w-full max-w-md bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-white p-3.5 rounded-2xl border-2 border-[#333] shadow-[4px_4px_0px_0px_#F59E0B] flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="font-serif font-black text-base leading-tight">Flappy Flight</h1>
              <p className="text-[9px] font-bold text-[#F59E0B] tracking-widest uppercase">
                Tap to Fly
              </p>
            </div>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <span className="text-[9px] font-bold text-white/40 uppercase block">Best</span>
            <span className="font-mono text-white/80 font-black text-sm">{bestRef.current}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <span className="text-[9px] font-bold text-white/40 uppercase block">Points</span>
            <span className="font-mono text-emerald-400 font-black text-sm">{ptsRef.current}</span>
          </div>
        </div>
      </header>

      {/* Game */}
      <main
        ref={mainRef}
        className="w-full max-w-md bg-white border-3 border-black rounded-3xl shadow-[6px_6px_0px_0px_#000] flex flex-col items-center my-3 relative overflow-hidden cursor-pointer"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block rounded-3xl"
          style={{ width: "100%", maxWidth: W, height: "auto", aspectRatio: `${W}/${H}`, touchAction: "none" }}
        />

        {/* Game Over */}
        {state === "dead" && cooldownRef.current <= 0 && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center text-white z-40 rounded-3xl pointer-events-none">
            <span className="text-6xl mb-3">💥</span>
            <h2 className="font-serif text-3xl font-black text-[#F59E0B] mb-1">CRASHED!</h2>
            <p className="text-xs text-white/50 mb-4">You hit an obstacle</p>

            <div className="bg-white text-black w-full p-4 rounded-2xl border-2 border-black mb-4 shadow-[3px_3px_0px_0px_#F59E0B]">
              <span className="text-[9px] font-black uppercase text-black/35 tracking-widest">Score</span>
              <h3 className="font-serif text-4xl font-black text-[#F59E0B] leading-tight">{scoreRef.current}</h3>
              <div className="flex justify-between mt-2 text-[11px] font-bold">
                <span className="text-emerald-600">+{scoreRef.current * 15} pts earned</span>
                <span className="text-black/35">Best: {bestRef.current}</span>
              </div>
            </div>

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

            {/* Daily Limit Notice */}
            {limitNotice && (
              <div className="bg-rose-500/20 border-2 border-rose-500 text-rose-300 px-3 py-2 rounded-xl text-xs font-bold mb-3 w-full">
                ⚠️ {limitNotice}
              </div>
            )}

            <div className="w-full py-3.5 bg-emerald-400 text-black rounded-2xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] text-center">
              TAP TO PLAY AGAIN 🔄
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-[10px] font-bold text-black/35 pb-1">
        Tap to flap • Don&apos;t spill the coffee ☕
      </footer>
    </div>
  );
}
