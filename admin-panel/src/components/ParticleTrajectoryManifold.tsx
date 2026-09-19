"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface MilestoneEvent {
  id: number;
  label: string;
  tag: string;
  t: number; // 0 to 1 position along trajectory
  desc: string;
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
  title?: string;
  subtitle?: string;
}

export default function ParticleTrajectoryManifold({
  className = "",
  height = 560,
  particleCount = 5200,
  showControls = true,
  showHud = true,
  autoRotateSpeed = 0.0035,
  title = "AI Behavioral Manifold & Latent Trajectory",
  subtitle = "Real-time 3D state-space mapping of player sessions against baseline distributions.",
}: ParticleTrajectoryManifoldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction & Animation State
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(1.0);
  const [fps, setFps] = useState(60);

  // Rotation & Camera References (avoiding React state re-renders inside 60FPS loop)
  const rotationRef = useRef({
    x: 0.28,
    y: -0.45,
    targetX: 0.28,
    targetY: -0.45,
    zoom: 1.05,
    targetZoom: 1.05,
  });

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // ─── Parametric Curve & Milestone Definitions ───────────────────────
  // Spline control points for the central manifold spine
  const spinePoints = useRef<[number, number, number][]>([
    [-460, 60, -90],
    [-340, 180, 70],
    [-170, 210, 130],
    [0, 140, 60],
    [160, 40, -40],
    [320, -50, -110],
    [480, -110, 40],
  ]).current;

  // Control points for the Red Trajectory Curve
  const trajectoryPoints = useRef<[number, number, number][]>([
    [-290, 130, 40],
    [-180, 175, 110],
    [-40, 170, 75],
    [90, 135, 10],
    [220, 65, -60],
    [340, -20, -90],
    [430, -85, -20],
  ]).current;

  // Milestone nodes along the red trajectory
  const milestones: MilestoneEvent[] = [
    {
      id: 1,
      label: "Baseline Initialization",
      tag: "NOMINAL",
      t: 0.05,
      desc: "Standard session startup; inputs conform to expected human reaction distribution.",
      x: -280,
      y: 135,
      z: 45,
    },
    {
      id: 2,
      label: "Velocity Shift Detected",
      tag: "MONITOR",
      t: 0.32,
      desc: "Input frequency spikes; model begins tracing boundary of benign manifold.",
      x: -70,
      y: 172,
      z: 85,
    },
    {
      id: 3,
      label: "State Divergence / Exploit",
      tag: "ANOMALY",
      t: 0.65,
      desc: "Agent/client attempts illegal state injection; trajectory departs benign cluster.",
      x: 200,
      y: 75,
      z: -50,
    },
    {
      id: 4,
      label: "Containment & Auto-Cap",
      tag: "CONTAINED",
      t: 0.94,
      desc: "Anti-cheat physics filter intercepts score, truncates anomaly, and logs audit hash.",
      x: 415,
      y: -80,
      z: -25,
    },
  ];

  // Helper: Cubic Catmull-Rom Spline Interpolation for 3D coordinates
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
      baseX: number;
      baseY: number;
      baseZ: number;
      size: number;
      baseAlpha: number;
      alpha: number;
      phase: number;
      speed: number;
      color: string;
    }[]
  >([]);

  useEffect(() => {
    const list = [];
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const [sx, sy, sz] = getSplinePoint(spinePoints, t);

      // Tangent vector along spine
      const nextT = Math.min(1, t + 0.005);
      const [nx, ny, nz] = getSplinePoint(spinePoints, nextT);
      const tx = nx - sx;
      const ty = ny - sy;
      const tz = nz - sz;
      const tLen = Math.hypot(tx, ty, tz) || 1;
      const [ux, uy, uz] = [tx / tLen, ty / tLen, tz / tLen];

      // Arbitrary up vector
      const [vx, vy, vz] = [0, 1, 0];
      // Normal = Up x Tangent
      let normX = vy * uz - vz * uy;
      let normY = vz * ux - vx * uz;
      let normZ = vx * uy - vy * ux;
      const nLen = Math.hypot(normX, normY, normZ) || 1;
      normX /= nLen;
      normY /= nLen;
      normZ /= nLen;

      // Binormal = Tangent x Normal
      const binX = uy * normZ - uz * normY;
      const binY = uz * normX - ux * normZ;
      const binZ = ux * normY - uy * normX;

      // Apply twist angle along the ribbon length (Mobius ribbon effect)
      const twistAngle = t * Math.PI * 2.8;
      const cosTwist = Math.cos(twistAngle);
      const sinTwist = Math.sin(twistAngle);

      const rotNormX = normX * cosTwist + binX * sinTwist;
      const rotNormY = normY * cosTwist + binY * sinTwist;
      const rotNormZ = normZ * cosTwist + binZ * sinTwist;

      const rotBinX = -normX * sinTwist + binX * cosTwist;
      const rotBinY = -normY * sinTwist + binY * cosTwist;
      const rotBinZ = -normZ * sinTwist + binZ * cosTwist;

      // Ribbon width and thickness with Gaussian distribution
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.max(0.0001, Math.random());
      const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Width profile narrows in middle, widens at ends
      const widthScale = 45 + 50 * Math.sin(t * Math.PI) + (t > 0.65 ? (t - 0.65) * 110 : 0);
      const thickScale = 16 + 18 * Math.sin(t * Math.PI);

      const offsetW = gaussian * widthScale * (Math.random() - 0.5) * 2;
      const offsetH = (Math.random() - 0.5) * thickScale * 2;

      const px = sx + rotNormX * offsetW + rotBinX * offsetH;
      const py = sy + rotNormY * offsetW + rotBinY * offsetH;
      const pz = sz + rotNormZ * offsetW + rotBinZ * offsetH;

      // 1.5% anomalous red particles inside the cluster
      const isRedAnomaly = Math.random() < 0.018;
      const baseAlpha = isRedAnomaly ? 0.85 : 0.2 + Math.random() * 0.75;
      const size = isRedAnomaly ? 1.6 + Math.random() * 1.6 : 0.65 + Math.random() * 1.5;

      list.push({
        x: px,
        y: py,
        z: pz,
        baseX: px,
        baseY: py,
        baseZ: pz,
        size,
        baseAlpha,
        alpha: baseAlpha,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        color: isRedAnomaly ? "#FF2A55" : "#FFFFFF",
      });
    }

    particlesRef.current = list;
  }, [particleCount, getSplinePoint, spinePoints]);

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

    // Pulse & glow timeline along trajectory
    let pulseT = 0;

    const render = (now: number) => {
      // FPS measurement
      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - fpsTimer)));
        frameCount = 0;
        fpsTimer = now;
      }

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Responsive canvas size adjustment
      const width = canvas.parentElement?.clientWidth || 800;
      const currentHeight = typeof height === "number" ? height : 560;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (canvas.width !== width * dpr || canvas.height !== currentHeight * dpr) {
        canvas.width = width * dpr;
        canvas.height = currentHeight * dpr;
      }

      // Smooth camera interpolation (inertial damping)
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

      // Clear Canvas to Pitch Black Obsidian
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, currentHeight);

      // Subtle atmospheric radial gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        currentHeight / 2,
        20,
        width / 2,
        currentHeight / 2,
        Math.max(width, currentHeight) * 0.75
      );
      bgGrad.addColorStop(0, "rgba(25, 25, 28, 0.45)");
      bgGrad.addColorStop(0.5, "rgba(8, 8, 10, 0.95)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 1.0)");
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

        // Camera distance offset
        const camDist = 950;
        const depth = z2 + camDist;

        if (depth <= 10) return null;

        const scale = fov / depth;
        return {
          sx: centerX + x1 * scale,
          sy: centerY - y2 * scale, // inverted Y for screen space
          scale,
          depth,
        };
      };

      // ─── 1. Render Background Particles (Manifold Point Cloud) ────────
      const particles = particlesRef.current;
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

        // Depth cueing: particles further away are dimmer and smaller
        const depthFactor = Math.max(0.1, Math.min(1.4, (1200 - proj.depth) / 800));
        const finalAlpha = Math.min(1, Math.max(0.05, p.baseAlpha * depthFactor));
        const finalSize = Math.max(0.4, p.size * proj.scale * 1.2);

        renderedPoints.push({
          sx: proj.sx,
          sy: proj.sy,
          depth: proj.depth,
          size: finalSize,
          color: p.color,
          alpha: finalAlpha,
        });
      }

      // Depth sort so closer particles draw on top
      renderedPoints.sort((a, b) => b.depth - a.depth);

      for (let i = 0; i < renderedPoints.length; i++) {
        const pt = renderedPoints[i];
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, pt.size, 0, Math.PI * 2);
        ctx.fillStyle =
          pt.color === "#FFFFFF"
            ? `rgba(255, 255, 255, ${pt.alpha})`
            : `rgba(255, 42, 85, ${pt.alpha})`;
        ctx.fill();
      }

      // ─── 2. Render Continuous Glowing Red Trajectory ───────────────────
      const trajectorySteps = 160;
      const trajProjected: { sx: number; sy: number; t: number; depth: number }[] = [];

      // Max progress for replay animation
      const activeProgress = isReplaying ? replayProgress : 1.0;
      const maxSteps = Math.floor(trajectorySteps * activeProgress);

      for (let s = 0; s <= maxSteps; s++) {
        const t = s / trajectorySteps;
        const [tx, ty, tz] = getSplinePoint(trajectoryPoints, t);
        const proj = project(tx, ty, tz);
        if (proj) {
          trajProjected.push({ sx: proj.sx, sy: proj.sy, t, depth: proj.depth });
        }
      }

      if (trajProjected.length > 1) {
        // Outer Glow Pass
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(trajProjected[0].sx, trajProjected[0].sy);
        for (let i = 1; i < trajProjected.length; i++) {
          ctx.lineTo(trajProjected[i].sx, trajProjected[i].sy);
        }
        ctx.shadowColor = "#FF1E56";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(225, 29, 72, 0.4)";
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Inner Core Pass
        ctx.beginPath();
        ctx.moveTo(trajProjected[0].sx, trajProjected[0].sy);
        for (let i = 1; i < trajProjected.length; i++) {
          ctx.lineTo(trajProjected[i].sx, trajProjected[i].sy);
        }
        ctx.shadowBlur = 6;
        ctx.strokeStyle = "rgba(255, 60, 100, 0.95)";
        ctx.lineWidth = 2.0;
        ctx.stroke();
        ctx.restore();

        // Traveling Light Pulse along trajectory
        pulseT = (pulseT + delta * 0.42) % 1.0;
        if (pulseT <= activeProgress) {
          const pulseIdx = Math.floor(pulseT * trajectorySteps);
          if (trajProjected[pulseIdx]) {
            const pulsePt = trajProjected[pulseIdx];
            ctx.save();
            ctx.beginPath();
            ctx.arc(pulsePt.sx, pulsePt.sy, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowColor = "#FF1E56";
            ctx.shadowBlur = 18;
            ctx.fill();

            // Expanding ripple wave
            ctx.beginPath();
            ctx.arc(pulsePt.sx, pulsePt.sy, 9.0, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 60, 100, 0.6)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // ─── 3. Render Anomaly / Milestone Nodes ─────────────────────────
      milestones.forEach((m) => {
        if (m.t > activeProgress) return;
        const proj = project(m.x, m.y, m.z);
        if (!proj) return;

        const isSelected = activeMilestone?.id === m.id;

        ctx.save();
        // Outer pulsing target ring
        const ringPulse = 1 + Math.sin(now * 0.006 + m.id) * 0.25;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, (isSelected ? 9 : 6) * ringPulse, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? "#FFFFFF" : "rgba(255, 42, 85, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node center
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, isSelected ? 4.5 : 3.0, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#FFFFFF" : "#FF2A55";
        ctx.shadowColor = "#FF2A55";
        ctx.shadowBlur = isSelected ? 16 : 8;
        ctx.fill();

        // Node Pin Label Tag
        ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)";
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
    trajectoryPoints,
  ]);

  // ─── Replay Timeline Handler ─────────────────────────────────────────
  useEffect(() => {
    if (!isReplaying) return;
    let animId: number;
    let start: number | null = null;
    const duration = 4200; // 4.2 seconds to trace full path

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

  // Touch Handlers for Mobile Orbit
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
    rotationRef.current.targetX = 0.28;
    rotationRef.current.targetY = -0.45;
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
      className={`relative w-full overflow-hidden bg-black text-white rounded-3xl border-3 border-black shadow-[8px_8px_0px_0px_#000] select-none ${className}`}
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

      {/* Top Left HUD: Title, Description & Model Metrics */}
      {showHud && (
        <div className="absolute top-5 left-5 max-w-sm pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60 backdrop-blur-md">
              BEHAVIORAL TRAJECTORY RADAR
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            {title}
          </h3>
          <p className="text-xs font-semibold text-white/60 mt-1 line-clamp-2 drop-shadow">
            {subtitle}
          </p>

          <div className="flex items-center gap-3 mt-3 font-mono text-[10px] text-white/50">
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
              P: {particleCount.toLocaleString()} pts
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
              {fps} FPS
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Live Stream
            </span>
          </div>
        </div>
      )}

      {/* Top Right Controls & Toggles */}
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
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-red-600/80 hover:bg-red-600 text-white border border-red-400 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
            title="Replay trajectory anomaly from t=0"
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

      {/* Bottom Timeline Milestones Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Active Milestone Card Drawer */}
        {activeMilestone && (
          <div className="bg-black/80 border border-red-500/50 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-black uppercase text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                  {activeMilestone.tag}
                </span>
                <span className="font-bold text-xs text-white">
                  {activeMilestone.label}
                </span>
              </div>
              <p className="text-[11px] text-white/70 mt-0.5 max-w-xl">
                {activeMilestone.desc}
              </p>
            </div>
            <button
              onClick={() => setActiveMilestone(null)}
              className="text-white/40 hover:text-white p-1 text-xs ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Milestone Quick Select Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 mr-1 hidden sm:inline">
              Trajectory Telemetry:
            </span>
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMilestone(activeMilestone?.id === m.id ? null : m)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 ${
                  activeMilestone?.id === m.id
                    ? "bg-red-600 text-white border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                    : "bg-black/60 text-white/60 border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="font-mono text-[10px] text-white/40 hidden md:block shrink-0">
            Drag to Rotate • Scroll to Zoom
          </div>
        </div>
      </div>
    </div>
  );
}
