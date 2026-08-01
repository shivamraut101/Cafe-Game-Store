"use client";

import React, { useEffect, useRef, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────
const W = 340;
const H = 560;
const TRAY_W = 72;
const TRAY_H = 16;
const TRAY_Y = H - 70;
const GROUND_H = 35;

const INITIAL_SPAWN_INTERVAL = 55;
const MIN_SPAWN_INTERVAL = 18;
const INITIAL_FALL_SPEED = 2.2;
const MAX_FALL_SPEED = 5.5;

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  size: number;
  emoji: string;
  type: "good" | "bad" | "bonus";
  points: number;
  rotation: number;
  vRot: number;
  caught: boolean;
  missed: boolean;
}

interface CatchParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string; r: number; emoji?: string;
}

const GOOD_ITEMS = [
  { emoji: "☕", points: 10, size: 28 },
  { emoji: "🥐", points: 15, size: 26 },
  { emoji: "🍩", points: 12, size: 26 },
  { emoji: "🧁", points: 20, size: 28 },
  { emoji: "🍰", points: 25, size: 30 },
  { emoji: "🍪", points: 8, size: 22 },
  { emoji: "🧋", points: 18, size: 28 },
  { emoji: "🥞", points: 22, size: 28 },
];

const BAD_ITEMS = [
  { emoji: "💣", points: -30, size: 26 },
  { emoji: "🔥", points: -25, size: 24 },
];

const BONUS_ITEMS = [
  { emoji: "⭐", points: 50, size: 30 },
  { emoji: "💎", points: 75, size: 28 },
];

export default function BaristaCatchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<"idle" | "playing" | "dead">("idle");
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const ptsRef = useRef(0);
  const waitRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const [, forceRender] = React.useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const trayRef = useRef({ x: W / 2, targetX: W / 2 });
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<CatchParticle[]>([]);
  const fRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const flashRef = useRef(0);
  const flashColorRef = useRef("#FFF");
  const shakeRef = useRef(0);
  const cooldownRef = useRef(0);
  const scorePopRef = useRef<{ text: string; x: number; y: number; life: number; color: string }[]>([]);
  const isDraggingRef = useRef(false);

  const getSpawnInterval = () => Math.max(MIN_SPAWN_INTERVAL, INITIAL_SPAWN_INTERVAL - scoreRef.current * 0.3);
  const getFallSpeed = () => Math.min(MAX_FALL_SPEED, INITIAL_FALL_SPEED + scoreRef.current * 0.008);

  // ─── Audio ──────────────────────────────────────────────
  const snd = useCallback((t: "catch" | "bonus" | "miss" | "bomb" | "die") => {
    try {
      const C = window.AudioContext || (window as any).webkitAudioContext;
      if (!C) return;
      const c = new C(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      if (t === "catch") {
        o.type = "sine"; o.frequency.setValueAtTime(520, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(780, c.currentTime + 0.08);
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.08);
        o.start(); o.stop(c.currentTime + 0.08);
      } else if (t === "bonus") {
        o.type = "sine"; o.frequency.setValueAtTime(660, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(1320, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.25, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      } else if (t === "miss") {
        o.type = "triangle"; o.frequency.setValueAtTime(250, c.currentTime);
        o.frequency.linearRampToValueAtTime(120, c.currentTime + 0.15);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
        o.start(); o.stop(c.currentTime + 0.15);
      } else if (t === "bomb") {
        o.type = "sawtooth"; o.frequency.setValueAtTime(150, c.currentTime);
        o.frequency.linearRampToValueAtTime(50, c.currentTime + 0.3);
        g.gain.setValueAtTime(0.35, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
        o.start(); o.stop(c.currentTime + 0.3);
      } else {
        o.type = "square"; o.frequency.setValueAtTime(200, c.currentTime);
        o.frequency.linearRampToValueAtTime(30, c.currentTime + 0.5);
        g.gain.setValueAtTime(0.4, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
        o.start(); o.stop(c.currentTime + 0.5);
      }
    } catch { /* */ }
  }, []);

  const burst = useCallback((x: number, y: number, color: string, n: number, emoji?: string) => {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const s = 2 + Math.random() * 4;
      particlesRef.current.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
        life: 0, max: 25 + Math.random() * 15, color, r: 2 + Math.random() * 3,
        emoji: i === 0 ? emoji : undefined,
      });
    }
  }, []);

  const addScorePop = useCallback((text: string, x: number, y: number, color: string) => {
    scorePopRef.current.push({ text, x, y, life: 40, color });
  }, []);

  // Wait timer
  useEffect(() => {
    const t = setInterval(() => { waitRef.current++; rerender(); }, 1000);
    return () => clearInterval(t);
  }, [rerender]);

  // ─── Touch/Mouse Input ──────────────────────────────────
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const getX = (e: PointerEvent): number => {
      const rect = el.getBoundingClientRect();
      const scaleX = W / rect.width;
      return (e.clientX - rect.left) * scaleX;
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      if (stateRef.current === "idle") {
        // Start game
        scoreRef.current = 0; livesRef.current = 3; comboRef.current = 0; maxComboRef.current = 0;
        itemsRef.current = []; particlesRef.current = []; scorePopRef.current = [];
        fRef.current = 0; spawnTimerRef.current = 0; flashRef.current = 0; shakeRef.current = 0;
        trayRef.current = { x: W / 2, targetX: W / 2 };
        stateRef.current = "playing"; rerender();
        return;
      }
      if (stateRef.current === "dead") {
        if (cooldownRef.current > 0) return;
        scoreRef.current = 0; livesRef.current = 3; comboRef.current = 0; maxComboRef.current = 0;
        itemsRef.current = []; particlesRef.current = []; scorePopRef.current = [];
        fRef.current = 0; spawnTimerRef.current = 0; flashRef.current = 0; shakeRef.current = 0;
        trayRef.current = { x: W / 2, targetX: W / 2 };
        stateRef.current = "playing"; rerender();
        return;
      }
      isDraggingRef.current = true;
      trayRef.current.targetX = Math.max(TRAY_W / 2, Math.min(W - TRAY_W / 2, getX(e)));
    };

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      if (isDraggingRef.current && stateRef.current === "playing") {
        trayRef.current.targetX = Math.max(TRAY_W / 2, Math.min(W - TRAY_W / 2, getX(e)));
      }
    };

    const onUp = () => { isDraggingRef.current = false; };

    el.addEventListener("pointerdown", onDown, { passive: false });
    el.addEventListener("pointermove", onMove, { passive: false });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    el.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointerleave", onUp);
    };
  }, [rerender]);

  // ─── Drawing ────────────────────────────────────────────
  const drawBg = (ctx: CanvasRenderingContext2D, f: number) => {
    // Cafe interior gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2D1810");
    g.addColorStop(0.3, "#3E2723");
    g.addColorStop(0.6, "#4E342E");
    g.addColorStop(1, "#5D4037");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Brick wall pattern (subtle)
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let row = 0; row < H / 20; row++) {
      const offset = row % 2 === 0 ? 0 : 20;
      for (let col = -1; col < W / 40 + 1; col++) {
        ctx.fillRect(col * 40 + offset, row * 20, 38, 18);
      }
    }

    // Warm ambient glow from top center (like a cafe lamp)
    const lamp = ctx.createRadialGradient(W / 2, -20, 10, W / 2, 80, 250);
    lamp.addColorStop(0, "rgba(255,200,100,0.2)");
    lamp.addColorStop(0.5, "rgba(255,180,80,0.08)");
    lamp.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, W, 300);

    // Hanging string lights
    ctx.strokeStyle = "rgba(255,200,100,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const lx = 30 + i * 58;
      const ly = 20 + Math.sin(f * 0.02 + i) * 3;
      // String
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      // Bulb glow
      const bg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 20);
      bg.addColorStop(0, "rgba(255,200,100,0.25)");
      bg.addColorStop(1, "rgba(255,200,100,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(lx, ly, 20, 0, Math.PI * 2); ctx.fill();
      // Bulb
      ctx.fillStyle = `rgba(255,220,140,${0.6 + Math.sin(f * 0.05 + i * 1.3) * 0.2})`;
      ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
    }
  };

  const drawCounter = (ctx: CanvasRenderingContext2D) => {
    const cy = H - GROUND_H;
    // Counter body
    const cg = ctx.createLinearGradient(0, cy, 0, H);
    cg.addColorStop(0, "#6B4226");
    cg.addColorStop(0.3, "#5D3A1A");
    cg.addColorStop(1, "#3E2723");
    ctx.fillStyle = cg;
    ctx.fillRect(0, cy, W, GROUND_H);

    // Counter top surface
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(0, cy, W, 4);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, cy, W, 2);

    // Wood grain lines
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    for (let y = cy + 8; y < H; y += 7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + Math.sin(y * 0.1) * 2);
      ctx.stroke();
    }
  };

  const drawTray = (ctx: CanvasRenderingContext2D, x: number, f: number) => {
    // Tray shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(x, TRAY_Y + TRAY_H + 4, TRAY_W / 2 + 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tray body (silver/metallic)
    const tg = ctx.createLinearGradient(x - TRAY_W / 2, TRAY_Y, x + TRAY_W / 2, TRAY_Y);
    tg.addColorStop(0, "#C0C0C0");
    tg.addColorStop(0.3, "#E8E8E8");
    tg.addColorStop(0.5, "#F5F5F5");
    tg.addColorStop(0.7, "#E8E8E8");
    tg.addColorStop(1, "#B0B0B0");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.roundRect(x - TRAY_W / 2, TRAY_Y, TRAY_W, TRAY_H, 4);
    ctx.fill();
    ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
    ctx.stroke();

    // Tray rim highlight
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x - TRAY_W / 2 + 4, TRAY_Y + 2, TRAY_W - 8, 3);

    // Tray edges (raised sides)
    ctx.fillStyle = "#AAA";
    ctx.fillRect(x - TRAY_W / 2 - 3, TRAY_Y + 2, 6, TRAY_H - 4);
    ctx.fillRect(x + TRAY_W / 2 - 3, TRAY_Y + 2, 6, TRAY_H - 4);

    // Napkin on tray
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.roundRect(x - 8, TRAY_Y + 3, 16, TRAY_H - 6, 2);
    ctx.fill();
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: FallingItem) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);

    // Glow for bonus items
    if (item.type === "bonus") {
      const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, item.size + 8);
      bg.addColorStop(0, "rgba(255,215,0,0.35)");
      bg.addColorStop(1, "rgba(255,215,0,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, 0, item.size + 8, 0, Math.PI * 2); ctx.fill();
    }

    // Warning glow for bad items
    if (item.type === "bad") {
      const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, item.size + 6);
      bg.addColorStop(0, "rgba(255,60,40,0.25)");
      bg.addColorStop(1, "rgba(255,60,40,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, 0, item.size + 6, 0, Math.PI * 2); ctx.fill();
    }

    // Emoji
    ctx.font = `${item.size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.emoji, 0, 2);

    ctx.restore();
  };

  const drawLives = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("LIVES", 12, 22);
    for (let i = 0; i < 3; i++) {
      ctx.font = "18px sans-serif";
      ctx.globalAlpha = i < livesRef.current ? 1 : 0.2;
      ctx.fillText("❤️", 12 + i * 24, 44);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const drawCombo = (ctx: CanvasRenderingContext2D) => {
    if (comboRef.current >= 3) {
      ctx.save();
      ctx.font = "900 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      const cText = `🔥 x${comboRef.current} COMBO!`;
      ctx.strokeText(cText, W / 2, H - GROUND_H - 18);
      ctx.fillText(cText, W / 2, H - GROUND_H - 18);
      ctx.restore();
    }
  };

  // ─── Main Loop ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const loop = () => {
      fRef.current++;
      const f = fRef.current;
      const tray = trayRef.current;
      const items = itemsRef.current;
      const state = stateRef.current;

      // Smooth tray movement
      tray.x += (tray.targetX - tray.x) * 0.18;

      // Shake offset
      let shakeX = 0, shakeY = 0;
      if (shakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * shakeRef.current * 2;
        shakeY = (Math.random() - 0.5) * shakeRef.current * 2;
        shakeRef.current = Math.max(0, shakeRef.current - 0.3);
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.clearRect(-5, -5, W + 10, H + 10);
      drawBg(ctx, f);

      if (state === "playing") {
        // ─── Spawn items ─────────────────────────────
        spawnTimerRef.current++;
        if (spawnTimerRef.current >= getSpawnInterval()) {
          spawnTimerRef.current = 0;
          const roll = Math.random();
          let item: { emoji: string; points: number; size: number };
          let type: "good" | "bad" | "bonus";

          if (roll < 0.08 && scoreRef.current > 50) {
            // Bonus (rare, after score 50)
            item = BONUS_ITEMS[Math.floor(Math.random() * BONUS_ITEMS.length)];
            type = "bonus";
          } else if (roll < 0.22) {
            // Bad item
            item = BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];
            type = "bad";
          } else {
            // Good item
            item = GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
            type = "good";
          }

          const speed = getFallSpeed() + (Math.random() - 0.5) * 0.8;
          items.push({
            x: 30 + Math.random() * (W - 60),
            y: -30,
            vy: speed,
            size: item.size,
            emoji: item.emoji,
            type,
            points: item.points,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.08,
            caught: false,
            missed: false,
          });
        }

        // ─── Update & check items ────────────────────
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy;
          it.rotation += it.vRot;

          // Catch detection
          if (!it.caught && !it.missed) {
            const catchZoneY = TRAY_Y - 5;
            if (it.y + it.size / 2 >= catchZoneY && it.y - it.size / 2 <= catchZoneY + TRAY_H + 10) {
              if (Math.abs(it.x - tray.x) < TRAY_W / 2 + it.size / 3) {
                it.caught = true;

                if (it.type === "good" || it.type === "bonus") {
                  const comboMultiplier = Math.min(3, 1 + comboRef.current * 0.2);
                  const pts = Math.round(it.points * comboMultiplier);
                  scoreRef.current += pts;
                  comboRef.current++;
                  if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;

                  addScorePop(`+${pts}`, it.x, catchZoneY - 10, it.type === "bonus" ? "#FFD700" : "#4ADE80");
                  burst(it.x, catchZoneY, it.type === "bonus" ? "#FFD700" : "#4ADE80", 8, it.emoji);
                  snd(it.type === "bonus" ? "bonus" : "catch");
                  if (window.navigator?.vibrate) window.navigator.vibrate(15);
                } else {
                  // Bad item caught
                  comboRef.current = 0;
                  livesRef.current--;
                  scoreRef.current = Math.max(0, scoreRef.current + it.points);
                  addScorePop(`${it.points}`, it.x, catchZoneY - 10, "#FF4C29");
                  burst(it.x, catchZoneY, "#FF4C29", 12);
                  snd("bomb");
                  shakeRef.current = 6;
                  flashRef.current = 0.6;
                  flashColorRef.current = "rgba(255,60,40,";
                  if (window.navigator?.vibrate) window.navigator.vibrate([80, 40, 120]);

                  if (livesRef.current <= 0) {
                    stateRef.current = "dead";
                    cooldownRef.current = 50;
                    snd("die");
                    shakeRef.current = 10;
                    flashRef.current = 1;
                    if (scoreRef.current > bestRef.current) bestRef.current = scoreRef.current;
                    ptsRef.current += scoreRef.current;
                    rerender();
                  }
                }
                rerender();
                items.splice(i, 1);
                continue;
              }
            }
          }

          // Missed (fell past counter)
          if (it.y > H - GROUND_H + 10 && !it.caught) {
            if (it.type === "good" || it.type === "bonus") {
              comboRef.current = 0;
              snd("miss");
              // Splat effect
              burst(it.x, H - GROUND_H, "rgba(255,255,255,0.4)", 4);
              addScorePop("MISS", it.x, H - GROUND_H - 20, "rgba(255,255,255,0.5)");
            }
            items.splice(i, 1);
            continue;
          }
        }
      }

      // Dead state
      if (state === "dead" && cooldownRef.current > 0) {
        cooldownRef.current--;
        if (cooldownRef.current <= 0) rerender();
      }

      // ─── Render ────────────────────────────────────
      // Items
      items.forEach((it) => drawItem(ctx, it));

      // Counter
      drawCounter(ctx);

      // Tray
      if (state === "playing" || state === "dead") {
        drawTray(ctx, tray.x, f);
      }

      // Particles
      const pts = particlesRef.current;
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life++;
        const a = Math.max(0, 1 - p.life / p.max);
        ctx.globalAlpha = a;
        if (p.emoji && p.life < 10) {
          ctx.font = `${14 * a + 6}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill();
        }
        if (p.life >= p.max) pts.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // Score pop-ups
      const pops = scorePopRef.current;
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.y -= 1.2;
        p.life--;
        const a = Math.max(0, p.life / 40);
        ctx.globalAlpha = a;
        ctx.font = `900 ${16 + (40 - p.life) * 0.3}px sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 3;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        if (p.life <= 0) pops.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // Flash
      if (flashRef.current > 0) {
        ctx.fillStyle = `${flashColorRef.current}${flashRef.current * 0.4})`;
        ctx.fillRect(-5, -5, W + 10, H + 10);
        flashRef.current = Math.max(0, flashRef.current - 0.04);
      }

      // HUD
      if (state === "playing") {
        drawLives(ctx);
        drawCombo(ctx);

        // Score
        ctx.save();
        ctx.font = "900 38px 'Arial Black', sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillText(String(scoreRef.current), W - 10, 44);
        ctx.strokeStyle = "#5D3A1A";
        ctx.lineWidth = 4;
        ctx.strokeText(String(scoreRef.current), W - 12, 42);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(String(scoreRef.current), W - 12, 42);
        ctx.restore();
      }

      // Idle guide text
      if (state === "idle") {
        // Floating tray demo
        const demoX = W / 2 + Math.sin(f * 0.03) * 60;
        drawTray(ctx, demoX, f);

        // Falling demo items
        const di = [
          { emoji: "☕", x: W * 0.3, y: (f * 1.5 + 100) % (H + 50) - 30, rot: f * 0.02 },
          { emoji: "🍩", x: W * 0.6, y: (f * 1.8 + 250) % (H + 50) - 30, rot: -f * 0.03 },
          { emoji: "🧁", x: W * 0.8, y: (f * 1.3 + 400) % (H + 50) - 30, rot: f * 0.015 },
        ];
        di.forEach((d) => {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.font = "26px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(d.emoji, 0, 0);
          ctx.restore();
        });

        // Drag instruction
        ctx.save();
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        const tapY = H / 2 + 80 + Math.sin(f * 0.05) * 5;
        ctx.fillText("👆 DRAG TO CATCH • TAP TO START", W / 2, tapY);
        ctx.restore();
      }

      ctx.restore(); // Undo shake translate

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
    <div className="min-h-screen bg-[#2D1810] flex flex-col items-center justify-between p-3 select-none">
      {/* Header */}
      <header className="w-full max-w-md bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-white p-3.5 rounded-2xl border-2 border-[#444] shadow-[4px_4px_0px_0px_#F59E0B] flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <div>
              <h1 className="font-serif font-black text-base leading-tight">Barista Catch</h1>
              <p className="text-[9px] font-bold text-[#F59E0B] tracking-widest uppercase">
                Wait: <span className="font-mono text-white/90">{fmt(waitRef.current)}</span>
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
        className="w-full max-w-md bg-[#3E2723] border-3 border-[#5D4037] rounded-3xl shadow-[6px_6px_0px_0px_#000] flex flex-col items-center my-3 relative overflow-hidden cursor-pointer"
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
            <span className="text-6xl mb-3">💔</span>
            <h2 className="font-serif text-3xl font-black text-[#F59E0B] mb-1">ORDER DROPPED!</h2>
            <p className="text-xs text-white/50 mb-4">Too many bombs on the tray</p>

            <div className="bg-white text-black w-full p-4 rounded-2xl border-2 border-black mb-3 shadow-[3px_3px_0px_0px_#F59E0B]">
              <span className="text-[9px] font-black uppercase text-black/35 tracking-widest">Final Score</span>
              <h3 className="font-serif text-4xl font-black text-[#F59E0B] leading-tight">{scoreRef.current}</h3>
              <div className="flex justify-between mt-2 text-[11px] font-bold">
                <span className="text-emerald-600">Best combo: x{maxComboRef.current}</span>
                <span className="text-black/35">Best: {bestRef.current}</span>
              </div>
            </div>

            <div className="w-full py-3.5 bg-emerald-400 text-black rounded-2xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] text-center">
              TAP TO PLAY AGAIN 🔄
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-[10px] font-bold text-white/25 pb-1">
        Drag to catch cafe items • Avoid bombs 💣
      </footer>
    </div>
  );
}
