"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

export type ManifoldMode = "anticheat" | "retention";

interface MilestoneEvent {
  id: number;
  label: string;
  tag: string;
  t: number; // 0 to 1 position along trajectory
  desc: string;
  metric: string;
  x: number;
  y: number;
  z: number;
}

interface VenueAnchor {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  z: number;
}

interface ParticleTrajectoryManifoldProps {
  className?: string;
  height?: number | string;
  particleCount?: number;
  showControls?: boolean;
  showHud?: boolean;
  autoRotateSpeed?: number;
  initialMode?: ManifoldMode;
}

export default function ParticleTrajectoryManifold({
  className = "",
  height = 620,
  particleCount = 5200,
  showControls = true,
  showHud = true,
  autoRotateSpeed = 0.003,
  initialMode = "anticheat",
}: ParticleTrajectoryManifoldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Visualization Mode: Anti-Cheat (Fraud Defense) vs Retention Flywheel (LTV)
  const [mode, setMode] = useState<ManifoldMode>(initialMode);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(1.0);
  const [fps, setFps] = useState(60);

  // Rotation & Camera References (avoiding React state re-renders inside 60FPS loop)
  const rotationRef = useRef({
    x: 0.32,
    y: -0.5,
    targetX: 0.32,
    targetY: -0.5,
    zoom: 1.05,
    targetZoom: 1.05,
  });

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // ─── Venue 3D Spatial Anchors (Grounds the AI manifold in a real cafe) ───
  const venueAnchors: VenueAnchor[] = [
    { id: "tbl_04", name: "Table #04 QR", type: "Diner Table", x: -260, y: 110, z: 50 },
    { id: "bar_01", name: "Espresso Counter", type: "Bar POS", x: -60, y: 155, z: 90 },
    { id: "tbl_12", name: "Terrace Booth #12", type: "Outdoor Area", x: 140, y: 60, z: -30 },
    { id: "cnt_qr", name: "Takeaway Counter", type: "Checkout QR", x: 310, y: -40, z: -80 },
  ];

  // ─── Spline Point Definitions ───────────────────────────────────────────
  // Central benign manifold ribbon spine
  const spinePoints = useRef<[number, number, number][]>([
    [-460, 50, -90],
    [-340, 160, 60],
    [-170, 200, 120],
    [0, 135, 60],
    [160, 45, -40],
    [320, -40, -100],
    [480, -95, 30],
  ]).current;

  // Anti-Cheat Trajectory: Deviates sharply outward into anomalous state space
  const antiCheatPoints = useRef<[number, number, number][]>([
    [-290, 120, 45],
    [-170, 165, 110],
    [-30, 165, 80],
    [100, 140, 15],
    [230, 75, -55],
    [350, -10, -90],
    [450, -80, -15],
  ]).current;

  // Retention Flywheel Trajectory: Loops through table plays, time-lock barrier, and back to cafe repeat visit
  const retentionPoints = useRef<[number, number, number][]>([
    [-280, 115, 50],
    [-150, 185, 100],
    [10, 165, 45],
    [150, 95, -20],
    [260, 15, -70],
    [180, -60, 30],
    [-80, -20, 80],
    [-240, 100, 60],
  ]).current;

  // ─── Milestone Events for Each Mode ─────────────────────────────────────
  const antiCheatMilestones: MilestoneEvent[] = [
    {
      id: 1,
      label: "Table #04 QR Ingress",
      tag: "NOMINAL",
      t: 0.05,
      desc: "Customer session initiated from Table #04 standee. Touch reaction time 180ms; micro-jitter variance nominal.",
      metric: "Jitter: ±18ms · Reaction: 180ms",
      x: -280,
      y: 125,
      z: 50,
    },
    {
      id: 2,
      label: "Coffee Stack Acceleration",
      tag: "MONITOR",
      t: 0.32,
      desc: "Input frequency climbs rapidly from 4.2 to 45 taps/sec. Model monitors boundary of human biomechanical limits.",
      metric: "Velocity: 45 taps/s · Delta: High",
      x: -55,
      y: 168,
      z: 85,
    },
    {
      id: 3,
      label: "Autoclicker Macro Exploit",
      tag: "ANOMALY",
      t: 0.65,
      desc: "Mechanical precision detected (zero standard deviation between taps). Trajectory departs benign cafe manifold.",
      metric: "Confidence: 99.8% · Exploit: Script",
      x: 210,
      y: 85,
      z: -50,
    },
    {
      id: 4,
      label: "Voucher Shield Active",
      tag: "CONTAINED",
      t: 0.94,
      desc: "Score truncated and reward voucher suppressed. ₹0 discount given. Device fingerprint quarantined for 48h.",
      metric: "Saved: ₹150 Voucher · Cost to Cafe: ₹0",
      x: 430,
      y: -75,
      z: -20,
    },
  ];

  const retentionMilestones: MilestoneEvent[] = [
    {
      id: 101,
      label: "Visit 1: Table Dine & Play",
      tag: "DINE & PLAY",
      t: 0.06,
      desc: "Customer scans QR while waiting for coffee. Plays Coffee Stack Tower (22 fuel credits used from venue wallet).",
      metric: "Fuel: 22 credits (~₹2.4) · Wait: 6 min",
      x: -270,
      y: 120,
      z: 55,
    },
    {
      id: 102,
      label: "Score Unlocks Retention Voucher",
      tag: "QUALIFIED",
      t: 0.35,
      desc: "Player reaches Top 3 score on daily cafe leaderboard. Earns 'Next-Visit Flat ₹50 Off on ₹250+ Bill'.",
      metric: "Leaderboard: Rank #2 · Perk: ₹50 Off",
      x: 10,
      y: 165,
      z: 45,
    },
    {
      id: 103,
      label: "24-Hour Time-Lock Enforced",
      tag: "LOCKED 24H",
      t: 0.65,
      desc: "Voucher CANNOT be redeemed today on the current bill. Enforces a 7-day return window starting tomorrow.",
      metric: "Lock: 24h · Expiry: 7 Days · Min: ₹250",
      x: 240,
      y: 25,
      z: -65,
    },
    {
      id: 104,
      label: "Visit 2: Repeat Visit Realized",
      tag: "ROI REALIZED",
      t: 0.92,
      desc: "Customer returns 3 days later with friends to redeem ₹50 voucher. Generates a new ₹450 table ticket.",
      metric: "New Bill: ₹450 · Net Cafe Gain: +₹400",
      x: -220,
      y: 95,
      z: 65,
    },
  ];

  const activeMilestones = mode === "anticheat" ? antiCheatMilestones : retentionMilestones;
  const currentTrajectoryPoints = mode === "anticheat" ? antiCheatPoints : retentionPoints;

  // Catmull-Rom Spline Interpolator
  const getSplinePoint = useCallback(
    (points: [number, number, number][], t: number): [number, number, number] => {
      const p = (points.length - 1) * Math.max(0, Math.min(1, t));
      const i = Math.floor(p);
      const weight = p - i;

      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(points.length - 1, i + 1)];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const calc = (v0: number, v1: number, v2: number, v3: number, w: number) => {
        const w2 = w * w;
        const w3 = w2 * w;
        return (
          0.5 *
          (2 * v1 +
            (-v0 + v2) * w +
            (2 * v0 - 5 * v1 + 4 * v2 - v3) * w2 +
            (-v0 + 3 * v1 - 3 * v2 + v3) * w3)
        );
      };

      return [
        calc(p0[0], p1[0], p2[0], p3[0], weight),
        calc(p0[1], p1[1], p2[1], p3[1], weight),
        calc(p0[2], p1[2], p2[2], p3[2], weight),
      ];
    },
    []
  );

  // ─── Setup 3D Particle Cloud ─────────────────────────────────────────
  const particlesRef = useRef<
    {
      x: number;
      y: number;
      z: number;
      size: number;
      baseAlpha: number;
      phase: number;
      speed: number;
      color: string;
      isAnomalous?: boolean;
    }[]
  >([]);

  // Nodes for the dynamic constellation manifold mesh
  const meshIndicesRef = useRef<number[]>([]);

  useEffect(() => {
    const list = [];
    const isAntiCheatMode = mode === "anticheat";

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const [sx, sy, sz] = getSplinePoint(spinePoints, t);

      // Tangent vector
      const nextT = Math.min(1, t + 0.005);
      const [nx, ny, nz] = getSplinePoint(spinePoints, nextT);
      const tx = nx - sx;
      const ty = ny - sy;
      const tz = nz - sz;
      const tLen = Math.hypot(tx, ty, tz) || 1;
      const [ux, uy, uz] = [tx / tLen, ty / tLen, tz / tLen];

      // Normal and binormal with twist
      const [vx, vy, vz] = [0, 1, 0];
      let normX = vy * uz - vz * uy;
      let normY = vz * ux - vx * uz;
      let normZ = vx * uy - vy * ux;
      const nLen = Math.hypot(normX, normY, normZ) || 1;
      normX /= nLen;
      normY /= nLen;
      normZ /= nLen;

      const binX = uy * normZ - uz * normY;
      const binY = uz * normX - ux * normZ;
      const binZ = ux * normY - uy * normX;

      const twistAngle = t * Math.PI * 2.8;
      const cosTwist = Math.cos(twistAngle);
      const sinTwist = Math.sin(twistAngle);

      const rotNormX = normX * cosTwist + binX * sinTwist;
      const rotNormY = normY * cosTwist + binY * sinTwist;
      const rotNormZ = normZ * cosTwist + binZ * sinTwist;

      const rotBinX = -normX * sinTwist + binX * cosTwist;
      const rotBinY = -normY * sinTwist + binY * cosTwist;
      const rotBinZ = -normZ * sinTwist + binZ * cosTwist;

      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.max(0.0001, Math.random());
      const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const widthScale = 45 + 50 * Math.sin(t * Math.PI) + (t > 0.65 ? (t - 0.65) * 110 : 0);
      const thickScale = 16 + 18 * Math.sin(t * Math.PI);

      const offsetW = gaussian * widthScale * (Math.random() - 0.5) * 2;
      const offsetH = (Math.random() - 0.5) * thickScale * 2;

      const px = sx + rotNormX * offsetW + rotBinX * offsetH;
      const py = sy + rotNormY * offsetW + rotBinY * offsetH;
      const pz = sz + rotNormZ * offsetW + rotBinZ * offsetH;

      // Color scheme according to mode
      let color = "#FFFFFF";
      let isAnomalous = false;

      if (isAntiCheatMode) {
        // Red anomaly flecks
        if (Math.random() < 0.02) {
          color = "#FF2A55";
          isAnomalous = true;
        } else if (Math.random() < 0.15) {
          color = "#67E8F9"; // Cyan benign telemetry
        }
      } else {
        // Retention mode: Warm ambers, golds, and emerald repeat highlights
        const r = Math.random();
        if (r < 0.05) {
          color = "#10B981"; // Emerald repeaters
          isAnomalous = true;
        } else if (r < 0.35) {
          color = "#F59E0B"; // Warm amber
        } else if (r < 0.65) {
          color = "#FDE68A"; // Champagne
        }
      }

      const baseAlpha = isAnomalous ? 0.9 : 0.2 + Math.random() * 0.75;
      const size = isAnomalous ? 1.8 + Math.random() * 1.5 : 0.6 + Math.random() * 1.4;

      list.push({
        x: px,
        y: py,
        z: pz,
        size,
        baseAlpha,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        color,
        isAnomalous,
      });
    }

    particlesRef.current = list;

    // Pick 180 representative particle indices for constellation mesh lines
    const meshIndices: number[] = [];
    for (let i = 0; i < 180; i++) {
      meshIndices.push(Math.floor(Math.random() * list.length));
    }
    meshIndicesRef.current = meshIndices;
  }, [particleCount, getSplinePoint, spinePoints, mode]);

  // ─── Main Render Loop ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let pulseT = 0;

    const render = (now: number) => {
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const width = canvas.parentElement?.clientWidth || 800;
      const currentHeight = typeof height === "number" ? height : 620;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (canvas.width !== width * dpr || canvas.height !== currentHeight * dpr) {
        canvas.width = width * dpr;
        canvas.height = currentHeight * dpr;
      }

      const rot = rotationRef.current;
      if (isAutoRotating && !isDraggingRef.current) {
        rot.targetY += autoRotateSpeed;
      }

      rot.x += (rot.targetX - rot.x) * 0.1;
      rot.y += (rot.targetY - rot.y) * 0.1;
      rot.zoom += (rot.targetZoom - rot.zoom) * 0.1;

      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep obsidian cybernetic background
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, width, currentHeight);

      // Atmospheric radial gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        currentHeight / 2,
        20,
        width / 2,
        currentHeight / 2,
        Math.max(width, currentHeight) * 0.75
      );
      if (mode === "anticheat") {
        bgGrad.addColorStop(0, "rgba(22, 12, 16, 0.5)");
        bgGrad.addColorStop(0.5, "rgba(8, 9, 12, 0.95)");
        bgGrad.addColorStop(1, "rgba(5, 6, 8, 1.0)");
      } else {
        bgGrad.addColorStop(0, "rgba(10, 24, 18, 0.5)");
        bgGrad.addColorStop(0.5, "rgba(8, 12, 10, 0.95)");
        bgGrad.addColorStop(1, "rgba(5, 6, 8, 1.0)");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, currentHeight);

      const fov = 750 * rot.zoom;
      const centerX = width / 2;
      const centerY = currentHeight / 2;

      // 3D Projection Function
      const project = (px: number, py: number, pz: number) => {
        // Rotate Y (yaw)
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // Rotate X (pitch)
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        const camDist = 950;
        const depth = z2 + camDist;
        if (depth <= 10) return null;

        const scale = fov / depth;
        return {
          sx: centerX + x1 * scale,
          sy: centerY - y2 * scale,
          scale,
          depth,
        };
      };

      // ─── 0. Ground Perspective Radar Grid Plane ──────────────────────
      ctx.save();
      const gridY = -190;
      const gridRange = 600;
      const gridStep = 100;
      const gridColor =
        mode === "anticheat" ? "rgba(255, 42, 85, 0.08)" : "rgba(16, 185, 129, 0.08)";

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1.0;

      // Longitudinal lines (Z axis)
      for (let gx = -gridRange; gx <= gridRange; gx += gridStep) {
        const pStart = project(gx, gridY, -gridRange);
        const pEnd = project(gx, gridY, gridRange);
        if (pStart && pEnd) {
          ctx.beginPath();
          ctx.moveTo(pStart.sx, pStart.sy);
          ctx.lineTo(pEnd.sx, pEnd.sy);
          ctx.stroke();
        }
      }

      // Latitudinal lines (X axis)
      for (let gz = -gridRange; gz <= gridRange; gz += gridStep) {
        const pStart = project(-gridRange, gridY, gz);
        const pEnd = project(gridRange, gridY, gz);
        if (pStart && pEnd) {
          ctx.beginPath();
          ctx.moveTo(pStart.sx, pStart.sy);
          ctx.lineTo(pEnd.sx, pEnd.sy);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ─── 1. Render Manifold Constellation Web (Neural Mesh) ───────────
      const particles = particlesRef.current;
      const meshIndices = meshIndicesRef.current;
      if (meshIndices.length > 0) {
        ctx.save();
        ctx.lineWidth = 0.75;
        const lineColor =
          mode === "anticheat" ? "rgba(255, 255, 255, 0.07)" : "rgba(245, 158, 11, 0.08)";
        ctx.strokeStyle = lineColor;

        for (let i = 0; i < meshIndices.length; i++) {
          const p1 = particles[meshIndices[i]];
          if (!p1) continue;
          const proj1 = project(p1.x, p1.y, p1.z);
          if (!proj1) continue;

          for (let j = i + 1; j < Math.min(meshIndices.length, i + 6); j++) {
            const p2 = particles[meshIndices[j]];
            if (!p2) continue;
            const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2;
            if (distSq < 75 * 75) {
              const proj2 = project(p2.x, p2.y, p2.z);
              if (!proj2) continue;
              ctx.beginPath();
              ctx.moveTo(proj1.sx, proj1.sy);
              ctx.lineTo(proj2.sx, proj2.sy);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // ─── 2. Render Background Particles (State Manifold) ──────────────
      const renderedPoints: {
        sx: number;
        sy: number;
        depth: number;
        size: number;
        color: string;
        alpha: number;
      }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.speed;
        const hoverOffset = Math.sin(p.phase) * 1.5;

        const proj = project(p.x, p.y + hoverOffset, p.z);
        if (!proj) continue;

        const depthFactor = Math.max(0.1, Math.min(1.4, (1200 - proj.depth) / 800));
        const finalAlpha = Math.min(1, Math.max(0.04, p.baseAlpha * depthFactor));
        const finalSize = Math.max(0.4, p.size * proj.scale * 1.25);

        renderedPoints.push({
          sx: proj.sx,
          sy: proj.sy,
          depth: proj.depth,
          size: finalSize,
          color: p.color,
          alpha: finalAlpha,
        });
      }

      renderedPoints.sort((a, b) => b.depth - a.depth);

      for (let i = 0; i < renderedPoints.length; i++) {
        const pt = renderedPoints[i];
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // ─── 3. Render Continuous Glowing Trajectory Curve ────────────────
      const trajectorySteps = 160;
      const trajProjected: { sx: number; sy: number; t: number; depth: number }[] = [];

      const activeProgress = isReplaying ? replayProgress : 1.0;
      const maxSteps = Math.floor(trajectorySteps * activeProgress);

      for (let s = 0; s <= maxSteps; s++) {
        const t = s / trajectorySteps;
        const [tx, ty, tz] = getSplinePoint(currentTrajectoryPoints, t);
        const proj = project(tx, ty, tz);
        if (proj) {
          trajProjected.push({ sx: proj.sx, sy: proj.sy, t, depth: proj.depth });
        }
      }

      if (trajProjected.length > 1) {
        const isRed = mode === "anticheat";
        const primaryGlow = isRed ? "#FF1E56" : "#10B981";
        const primaryStroke = isRed ? "rgba(225, 29, 72, 0.5)" : "rgba(16, 185, 129, 0.5)";
        const coreStroke = isRed ? "rgba(255, 100, 130, 0.95)" : "rgba(110, 231, 183, 0.95)";

        // Outer Glow Pass
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(trajProjected[0].sx, trajProjected[0].sy);
        for (let i = 1; i < trajProjected.length; i++) {
          ctx.lineTo(trajProjected[i].sx, trajProjected[i].sy);
        }
        ctx.shadowColor = primaryGlow;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = primaryStroke;
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Inner Core Pass
        ctx.beginPath();
        ctx.moveTo(trajProjected[0].sx, trajProjected[0].sy);
        for (let i = 1; i < trajProjected.length; i++) {
          ctx.lineTo(trajProjected[i].sx, trajProjected[i].sy);
        }
        ctx.shadowBlur = 6;
        ctx.strokeStyle = coreStroke;
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.restore();

        // Traveling Light Pulse along trajectory
        pulseT = (pulseT + delta * 0.4) % 1.0;
        if (pulseT <= activeProgress) {
          const pulseIdx = Math.floor(pulseT * trajectorySteps);
          if (trajProjected[pulseIdx]) {
            const pulsePt = trajProjected[pulseIdx];
            ctx.save();
            ctx.beginPath();
            ctx.arc(pulsePt.sx, pulsePt.sy, 5.0, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = primaryGlow;
            ctx.shadowBlur = 20;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pulsePt.sx, pulsePt.sy, 11.0, 0, Math.PI * 2);
            ctx.strokeStyle = isRed ? "rgba(255, 60, 100, 0.7)" : "rgba(52, 211, 153, 0.7)";
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // ─── 4. Render Physical Cafe Venue Anchors (3D Pins) ─────────────
      venueAnchors.forEach((va) => {
        const proj = project(va.x, va.y, va.z);
        if (!proj) return;

        ctx.save();
        // Subtle vertical drop line to ground
        const groundProj = project(va.x, gridY, va.z);
        if (groundProj) {
          ctx.beginPath();
          ctx.moveTo(proj.sx, proj.sy);
          ctx.lineTo(groundProj.sx, groundProj.sy);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Diamond pin marker
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        const s = 4.0;
        ctx.moveTo(proj.sx, proj.sy - s);
        ctx.lineTo(proj.sx + s, proj.sy);
        ctx.lineTo(proj.sx, proj.sy + s);
        ctx.lineTo(proj.sx - s, proj.sy);
        ctx.closePath();
        ctx.fill();

        // Venue Tag Label
        ctx.font = "bold 9px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText(va.name, proj.sx + 8, proj.sy + 3);
        ctx.restore();
      });

      // ─── 5. Render Milestone / Telemetry Nodes ────────────────────────
      activeMilestones.forEach((m) => {
        if (m.t > activeProgress) return;
        const proj = project(m.x, m.y, m.z);
        if (!proj) return;

        const isSelected = activeMilestone?.id === m.id;
        const isRed = mode === "anticheat";
        const nodeColor = isRed ? "#FF2A55" : "#10B981";

        ctx.save();
        // Pulsing target ring
        const ringPulse = 1 + Math.sin(now * 0.006 + m.id) * 0.25;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, (isSelected ? 10 : 7) * ringPulse, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? "#FFFFFF" : nodeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node center
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, isSelected ? 5.0 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#FFFFFF" : nodeColor;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isSelected ? 18 : 10;
        ctx.fill();

        // Tag label
        ctx.font = "bold 9px ui-monospace, SFMono-Regular, monospace";
        ctx.fillStyle = isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.85)";
        ctx.fillText(`[${m.tag}]`, proj.sx + 10, proj.sy + 3);

        ctx.restore();
      });

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [
    isAutoRotating,
    autoRotateSpeed,
    height,
    activeMilestone,
    isReplaying,
    replayProgress,
    getSplinePoint,
    currentTrajectoryPoints,
    mode,
    activeMilestones,
  ]);

  // ─── Replay Timeline Handler ─────────────────────────────────────────
  useEffect(() => {
    if (!isReplaying) return;
    let animId: number;
    let start: number | null = null;
    const duration = 4000;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = Math.min(1.0, elapsed / duration);
      setReplayProgress(p);

      if (p < 1.0) {
        animId = requestAnimationFrame(step);
      } else {
        setIsReplaying(false);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isReplaying]);

  // ─── Mouse & Touch Interaction Handlers ──────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.targetY += dx * 0.0075;
    rotationRef.current.targetX = Math.max(
      -1.2,
      Math.min(1.2, rotationRef.current.targetX + dy * 0.0075)
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0012;
    rotationRef.current.targetZoom = Math.max(
      0.65,
      Math.min(2.2, rotationRef.current.targetZoom + zoomDelta)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    rotationRef.current.targetY += dx * 0.009;
    rotationRef.current.targetX = Math.max(
      -1.2,
      Math.min(1.2, rotationRef.current.targetX + dy * 0.009)
    );
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleResetView = () => {
    rotationRef.current.targetX = 0.32;
    rotationRef.current.targetY = -0.5;
    rotationRef.current.targetZoom = 1.05;
    setActiveMilestone(null);
  };

  const triggerReplay = () => {
    setReplayProgress(0.01);
    setIsReplaying(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-[#050608] text-white rounded-3xl border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none ${className}`}
      style={{ height }}
    >
      {/* 3D WebGL / Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left HUD: Mode Switcher & Real-time Venue Telemetry */}
      {showHud && (
        <div className="absolute top-5 left-5 max-w-sm sm:max-w-md pointer-events-none z-10 flex flex-col gap-2.5">
          {/* Interactive Mode Pills */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                setMode("anticheat");
                setActiveMilestone(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md ${
                mode === "anticheat"
                  ? "bg-red-950/90 text-red-300 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "bg-black/50 text-white/50 border-white/10 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              🛡️ Anti-Cheat Radar
            </button>

            <button
              onClick={() => {
                setMode("retention");
                setActiveMilestone(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md ${
                mode === "retention"
                  ? "bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-black/50 text-white/50 border-white/10 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              🔄 Retention Flywheel
            </button>
          </div>

          <div>
            <h3 className="font-serif text-lg sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              {mode === "anticheat"
                ? "Autonomous Anti-Cheat State Manifold"
                : "Customer Retention & Return Vector"}
            </h3>
            <p className="text-[11px] sm:text-xs font-semibold text-white/60 mt-1 line-clamp-2 drop-shadow">
              {mode === "anticheat"
                ? "Physical kinematics projection: Autoclickers, memory hacks, and spoofers diverge along the crimson vector and are neutralized before vouchers mint."
                : "Repeat visit dynamics: Legitimate diners play Coffee Stack Tower, lock in a 24h-delayed perk, and return to generate high-margin cafe bills."}
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-white/50 flex-wrap">
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
              P: {particleCount.toLocaleString()} pts
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
              {fps} FPS
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded border ${
                mode === "anticheat"
                  ? "text-red-400 bg-red-950/60 border-red-800/50"
                  : "text-emerald-400 bg-emerald-950/60 border-emerald-800/50"
              }`}
            >
              {mode === "anticheat" ? "● Threat Shield Active" : "● LTV Engine Sync"}
            </span>
          </div>
        </div>
      )}

      {/* Top Right Controls & Camera Toggles */}
      {showControls && (
        <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer backdrop-blur-md ${
              isAutoRotating
                ? "bg-white/15 text-white border-white/30 hover:bg-white/25"
                : "bg-black/60 text-white/40 border-white/10 hover:text-white"
            }`}
            title="Toggle 3D auto rotation"
          >
            {isAutoRotating ? "⏸ Orbit" : "▶ Orbit"}
          </button>

          <button
            onClick={triggerReplay}
            disabled={isReplaying}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-white border shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 ${
              mode === "anticheat"
                ? "bg-red-600/80 hover:bg-red-600 border-red-400"
                : "bg-emerald-600/80 hover:bg-emerald-600 border-emerald-400"
            }`}
            title="Replay trajectory sequence"
          >
            {isReplaying ? "⚡ Simulating..." : "🔁 Replay Vector"}
          </button>

          <button
            onClick={handleResetView}
            className="p-1.5 px-2.5 rounded-xl text-xs font-mono font-bold bg-black/60 text-white/60 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            title="Reset 3D camera"
          >
            ⟲
          </button>
        </div>
      )}

      {/* Bottom Timeline Milestones Bar & Telemetry Card */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Active Milestone Telemetry Drawer */}
        {activeMilestone && (
          <div
            className={`bg-[#0C0E14]/90 border backdrop-blur-xl p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl animate-fade-in ${
              mode === "anticheat" ? "border-red-500/50" : "border-emerald-500/50"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    mode === "anticheat"
                      ? "text-red-400 bg-red-950/80 border-red-800"
                      : "text-emerald-400 bg-emerald-950/80 border-emerald-800"
                  }`}
                >
                  {activeMilestone.tag}
                </span>
                <span className="font-bold text-xs sm:text-sm text-white">
                  {activeMilestone.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/70 mt-1 max-w-xl">
                {activeMilestone.desc}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <span className="font-mono text-[10px] text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                {activeMilestone.metric}
              </span>
              <button
                onClick={() => setActiveMilestone(null)}
                className="text-white/40 hover:text-white p-1 text-xs cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Milestone Quick Select Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 mr-1 hidden sm:inline">
              Telemetry Nodes:
            </span>
            {activeMilestones.map((m) => {
              const isSelected = activeMilestone?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMilestone(isSelected ? null : m)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 ${
                    isSelected
                      ? mode === "anticheat"
                        ? "bg-red-600 text-white border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                        : "bg-emerald-600 text-white border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      : "bg-black/60 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      mode === "anticheat" ? "bg-red-400" : "bg-emerald-400"
                    }`}
                  ></span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="font-mono text-[10px] text-white/40 hidden md:block shrink-0">
            Drag to Rotate • Scroll to Zoom
          </div>
        </div>
      </div>
    </div>
  );
}
