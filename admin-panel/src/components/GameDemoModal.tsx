"use client";

import React, { useState, useEffect, useRef } from "react";

interface GameDemoModalProps {
  engineId: string | null;
  onClose: () => void;
}

export default function GameDemoModal({ engineId, onClose }: GameDemoModalProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [reward, setReward] = useState<string>("");

  // Spin Wheel State
  const [rotation, setRotation] = useState(0);

  // Slot Machine State
  const [reels, setReels] = useState(["🍒", "🍋", "7️⃣"]);

  // Mystery Box State
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  // Precision Tap State
  const [needlePos, setNeedlePos] = useState(0);
  const [needleDir, setNeedleDir] = useState(1);
  const animRef = useRef<number | null>(null);

  // Scratchcard Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isMouseDownRef = useRef(false);

  // Plinko Ball Position State
  const [plinkoBallPos, setPlinkoBallPos] = useState<{ x: number; y: number } | null>(null);

  // Reset when engineId changes
  useEffect(() => {
    resetGame();
  }, [engineId]);

  const resetGame = () => {
    setGameState("idle");
    setReward("");
    setRotation(0);
    setReels(["🍒", "🍋", "7️⃣"]);
    setSelectedBox(null);
    setScratchPercent(0);
    setPlinkoBallPos(null);
    initScratchCanvas();
  };

  // Precision needle animation loop
  useEffect(() => {
    if (engineId === "precision-tap" && gameState === "idle") {
      const animateNeedle = () => {
        setNeedlePos((prev) => {
          let next = prev + needleDir * 2.5;
          if (next >= 100) {
            setNeedleDir(-1);
            next = 100;
          } else if (next <= 0) {
            setNeedleDir(1);
            next = 0;
          }
          return next;
        });
        animRef.current = requestAnimationFrame(animateNeedle);
      };
      animRef.current = requestAnimationFrame(animateNeedle);
      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    }
  }, [engineId, gameState, needleDir]);

  // Scratchcard canvas initialization
  const initScratchCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 280;
      canvas.height = 180;

      // Draw shiny gold foil coating
      const grad = ctx.createLinearGradient(0, 0, 280, 180);
      grad.addColorStop(0, "#E6C665");
      grad.addColorStop(0.5, "#D4AF37");
      grad.addColorStop(1, "#997A15");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText("✨ CLICK & SCRATCH ME ✨", canvas.width / 2, canvas.height / 2);
    }
  };

  useEffect(() => {
    if (engineId === "scratch-card") {
      initScratchCanvas();
    }
  }, [engineId]);

  if (!engineId) return null;

  // Game 1: Spin Wheel Handler
  const handleSpinWheel = () => {
    if (gameState === "playing") return;
    setGameState("playing");
    const extraRotations = 5 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + extraRotations + randomAngle;
    setRotation(totalRotation);

    setTimeout(() => {
      setGameState("won");
      setReward("FREE BOBA TEA 🧋");
    }, 4000);
  };

  // Game 2: Slot Machine Handler
  const handleSpinSlots = () => {
    if (gameState === "playing") return;
    setGameState("playing");
    const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣", "🎁"];

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setReels(["💎", "💎", "💎"]);
        setGameState("won");
        setReward("JACKPOT: 50% OFF MEAL 🍔");
      }
    }, 100);
  };

  // Game 3: Scratchcard Handlers
  const scratchAtPoint = (x: number, y: number) => {
    if (!canvasRef.current || gameState === "won") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    setScratchPercent((prev) => {
      const next = Math.min(100, prev + 6);
      if (next >= 50) {
        setGameState("won");
        setReward("FREE DESSERT VOUCHER 🍰");
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) scratchAtPoint(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) scratchAtPoint(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      scratchAtPoint(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    }
  };

  // Game 4: Plinko Chip Drop Handler
  const handlePlinkoDrop = () => {
    if (gameState === "playing") return;
    setGameState("playing");

    let yPos = 10;
    let xPos = 50;
    const interval = setInterval(() => {
      yPos += 15;
      xPos += (Math.random() - 0.5) * 12;
      setPlinkoBallPos({ x: Math.max(10, Math.min(90, xPos)), y: yPos });

      if (yPos >= 160) {
        clearInterval(interval);
        setGameState("won");
        setReward("BUY 1 GET 1 FREE PIZZA 🍕");
      }
    }, 120);
  };

  // Game 5: Mystery Box Handler
  const handleOpenBox = (index: number) => {
    if (gameState === "playing" || gameState === "won") return;
    setSelectedBox(index);
    setGameState("playing");
    setTimeout(() => {
      setGameState("won");
      setReward("15% OFF ALL DRINKS ☕");
    }, 1000);
  };

  // Game 6: Precision Tap Handler
  const handleStopNeedle = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setGameState("playing");

    if (needlePos >= 40 && needlePos <= 60) {
      setReward("PERFECT TIMING! 25% OFF 🎯");
    } else {
      setReward("NICE TRY! 10% OFF VOUCHER 🎟️");
    }
    setGameState("won");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111111] text-white border-4 border-black rounded-3xl p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_#FF4C29] relative flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4 border-b-2 border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="font-mono text-xs font-bold text-white/80">INTERACTIVE GAME ENGINE</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mobile Screen Mockup */}
        <div className="w-full bg-[#F6F3EB] text-black rounded-2xl border-4 border-black p-4 min-h-[440px] flex flex-col justify-between relative overflow-hidden shadow-inner">
          {/* Top Store Badge */}
          <div className="text-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full border border-black shadow-[2px_2px_0px_0px_#FF4C29]">
              Brew & Bites Cafe
            </span>
          </div>

          {/* ENGINE 1: SPIN WHEEL */}
          {engineId === "wheel-2" && (
            <div className="flex flex-col items-center my-auto">
              <div className="relative w-56 h-56 flex items-center justify-center">
                {/* Pointer */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-3xl drop-shadow-md text-red-600">
                  ▼
                </div>
                {/* Visual Wheel with Segments */}
                <div
                  className="w-full h-full rounded-full border-4 border-black transition-transform duration-[4000ms] ease-out shadow-lg flex items-center justify-center relative overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(#FF4C29 0deg 60deg, #332FD0 60deg 120deg, #10B981 120deg 180deg, #F59E0B 180deg 240deg, #8B5CF6 240deg 300deg, #EC4899 300deg 360deg)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase pointer-events-none">
                    <span className="absolute top-4">FREE BOBA</span>
                    <span className="absolute right-4 rotate-90">10% OFF</span>
                    <span className="absolute bottom-4">JACKPOT</span>
                    <span className="absolute left-4 -rotate-90">2-FOR-1</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-black flex items-center justify-center font-black text-xs z-10 shadow-md">
                    SPIN
                  </div>
                </div>
              </div>

              {gameState !== "won" && (
                <button
                  onClick={handleSpinWheel}
                  disabled={gameState === "playing"}
                  className="mt-6 w-full py-3 bg-[#FF4C29] text-white rounded-xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  {gameState === "playing" ? "SPINNING WHEEL..." : "TAP TO SPIN 🎡"}
                </button>
              )}
            </div>
          )}

          {/* ENGINE 2: SCRATCHCARD */}
          {engineId === "scratch-card" && (
            <div className="flex flex-col items-center my-auto relative w-full">
              <div className="relative w-[270px] h-[170px] rounded-2xl border-4 border-black overflow-hidden bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex flex-col items-center justify-center text-center p-4 shadow-md">
                <span className="text-4xl mb-1">🍰</span>
                <h4 className="font-black text-lg text-black">FREE DESSERT</h4>
                <p className="text-[10px] font-bold text-black/70">Show to server at checkout</p>

                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchMove={handleTouchMove}
                  className="absolute inset-0 cursor-crosshair touch-none select-none"
                />
              </div>
              <p className="text-[10px] font-bold text-black/50 mt-2">Rub with finger or click & drag mouse</p>
            </div>
          )}

          {/* ENGINE 3: NEON SLOTS */}
          {engineId === "neon-slots" && (
            <div className="flex flex-col items-center my-auto w-full">
              <div className="bg-[#111] p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] w-full flex justify-around items-center">
                {reels.map((symbol, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-20 bg-white rounded-xl border-2 border-black flex items-center justify-center text-4xl shadow-inner animate-pulse"
                  >
                    {symbol}
                  </div>
                ))}
              </div>

              {gameState !== "won" && (
                <button
                  onClick={handleSpinSlots}
                  disabled={gameState === "playing"}
                  className="mt-6 w-full py-3 bg-[#FF4C29] text-white rounded-xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  {gameState === "playing" ? "SPINNING REELS..." : "SPIN REELS 🎰"}
                </button>
              )}
            </div>
          )}

          {/* ENGINE 4: PLINKO DROP */}
          {engineId === "plinko-drop" && (
            <div className="flex flex-col items-center my-auto w-full">
              <div className="w-full bg-slate-900 rounded-2xl border-4 border-black p-4 flex flex-col items-center relative h-[210px] overflow-hidden">
                {/* Pegs */}
                <div className="grid grid-cols-5 gap-7 my-3">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 bg-amber-400 rounded-full border border-black shadow-sm"></div>
                  ))}
                </div>

                {/* Animated Ball */}
                {plinkoBallPos && (
                  <div
                    className="w-6 h-6 bg-[#FF4C29] rounded-full border-2 border-black absolute shadow-[0_0_12px_#ff4c29] transition-all duration-100"
                    style={{ left: `${plinkoBallPos.x}%`, top: `${plinkoBallPos.y}px` }}
                  ></div>
                )}

                {/* Prize Buckets at Bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-black/80 flex justify-between border-t-2 border-amber-400 text-[9px] font-black text-white text-center p-1">
                  <div className="flex-1 border-r border-white/20">10% OFF</div>
                  <div className="flex-1 border-r border-white/20 text-emerald-400">FREE PIZZA</div>
                  <div className="flex-1">20% OFF</div>
                </div>
              </div>

              {gameState !== "won" && (
                <button
                  onClick={handlePlinkoDrop}
                  disabled={gameState === "playing"}
                  className="mt-4 w-full py-3 bg-[#FF4C29] text-white rounded-xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  {gameState === "playing" ? "CHIP DROPPING..." : "DROP CHIP ⚪"}
                </button>
              )}
            </div>
          )}

          {/* ENGINE 5: MYSTERY BOBA */}
          {engineId === "mystery-box" && (
            <div className="flex flex-col items-center my-auto w-full">
              <p className="text-xs font-bold text-black/60 mb-4">Tap 1 Mystery Cup to Crack Open:</p>
              <div className="flex justify-around w-full">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenBox(idx)}
                    className={`text-5xl transition-all p-2 rounded-2xl ${
                      selectedBox === idx ? "scale-125 animate-bounce bg-amber-200 border-2 border-black shadow-md" : "hover:scale-110"
                    }`}
                  >
                    🧋
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ENGINE 6: PRECISION TAP */}
          {engineId === "precision-tap" && (
            <div className="flex flex-col items-center my-auto w-full">
              <div className="w-full bg-white p-4 rounded-2xl border-4 border-black relative">
                <div className="text-xs font-black uppercase text-center mb-2">TARGET ZONE (GREEN)</div>
                {/* Track */}
                <div className="w-full h-8 bg-black/10 rounded-full border-2 border-black relative overflow-hidden">
                  <div className="absolute left-[40%] w-[20%] h-full bg-emerald-400 border-x-2 border-black"></div>
                  {/* Moving Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-red-600 border-x border-black transition-all shadow-[0_0_8px_red]"
                    style={{ left: `${needlePos}%` }}
                  ></div>
                </div>
              </div>

              {gameState !== "won" && (
                <button
                  onClick={handleStopNeedle}
                  className="mt-6 w-full py-3 bg-[#FF4C29] text-white rounded-xl font-black text-sm border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  STOP NEEDLE 🎯
                </button>
              )}
            </div>
          )}

          {/* REWARD OVERLAY FOR ALL GAMES */}
          {gameState === "won" && (
            <div className="mt-4 bg-emerald-400 border-4 border-black rounded-2xl p-4 text-center shadow-[4px_4px_0px_0px_#000] flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/70 bg-white/50 px-2 py-0.5 rounded border border-black/20">
                🎉 WINNER REWARD UNLOCKED
              </span>
              <h3 className="font-serif text-lg font-black text-black">{reward}</h3>
              <p className="text-[10px] font-bold text-black/70 font-mono">CODE: FORSTORE-2026</p>
              
              <button
                onClick={resetGame}
                className="mt-1 px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg border border-black shadow-[2px_2px_0px_0px_#000] hover:bg-white hover:text-black transition-all"
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
