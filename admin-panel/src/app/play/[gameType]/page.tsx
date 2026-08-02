"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function CustomerGamePlayer() {
  const params = useParams();
  const rawGameType = Array.isArray(params?.gameType) ? params.gameType[0] : params?.gameType || "spin-wheel";
  const gameType = rawGameType.toLowerCase();

  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [reward, setReward] = useState<string>("");
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 min timer
  const [copied, setCopied] = useState<boolean>(false);
  const [redeemed, setRedeemed] = useState<boolean>(false);

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

  // Lucky Dice State
  const [diceValues, setDiceValues] = useState<number[]>([1, 1]);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // Rock Paper Scissors State
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null);

  // Countdown timer for claimed voucher
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "won" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Precision needle animation loop
  useEffect(() => {
    if ((gameType === "precision-tap" || gameType === "precision") && gameState === "idle") {
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
  }, [gameType, gameState, needleDir]);

  // Canvas Scratchcard setup
  useEffect(() => {
    if ((gameType === "scratchcard" || gameType === "scratch") && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 190;

      // Draw gold foil layer
      const grad = ctx.createLinearGradient(0, 0, 300, 190);
      grad.addColorStop(0, "#F59E0B");
      grad.addColorStop(0.5, "#D4AF37");
      grad.addColorStop(1, "#B45309");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎟️ SCRATCH TO REVEAL REWARD", canvas.width / 2, canvas.height / 2);
    }
  }, [gameType]);

  const triggerWin = (winReward: string) => {
    setGameState("won");
    setReward(winReward);
    const randomCode = `BREW-${Math.floor(1000 + Math.random() * 9000)}`;
    setVoucherCode(randomCode);

    // Haptic vibration
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100, 50, 200]);
    }
  };

  // Game 1: Spin Wheel Handler
  const handleSpinWheel = () => {
    if (gameState === "playing") return;
    setGameState("playing");
    const extraRotations = 6 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const totalRotation = rotation + extraRotations + randomAngle;
    setRotation(totalRotation);

    setTimeout(() => {
      triggerWin("FREE SPECIALTY BOBA 🧋");
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
      if (count > 22) {
        clearInterval(interval);
        setReels(["💎", "💎", "💎"]);
        triggerWin("JACKPOT: 50% OFF ENTIRE ORDER 🍔");
      }
    }, 100);
  };

  // Game 3: Scratchcard Handler
  const scratchAtPoint = (x: number, y: number) => {
    if (!canvasRef.current || gameState === "won") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    setScratchPercent((prev) => {
      const next = Math.min(100, prev + 6);
      if (next >= 50) {
        triggerWin("FREE FRESH PASTRY 🍰");
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

  // Game 4: Plinko Drop Handler
  const handlePlinkoDrop = () => {
    if (gameState === "playing") return;
    setGameState("playing");

    let yPos = 10;
    let xPos = 50;
    const interval = setInterval(() => {
      yPos += 15;
      xPos += (Math.random() - 0.5) * 14;
      setPlinkoBallPos({ x: Math.max(10, Math.min(90, xPos)), y: yPos });

      if (yPos >= 165) {
        clearInterval(interval);
        triggerWin("BUY 1 GET 1 FREE LATTE ☕");
      }
    }, 120);
  };

  // Game 5: Mystery Box Handler
  const handleOpenBox = (index: number) => {
    if (gameState === "playing" || gameState === "won") return;
    setSelectedBox(index);
    setGameState("playing");
    setTimeout(() => {
      triggerWin("20% OFF YOUR TOTAL BILL 💳");
    }, 1000);
  };

  // Game 6: Precision Tap Handler
  const handleStopNeedle = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setGameState("playing");

    if (needlePos >= 40 && needlePos <= 60) {
      triggerWin("BULLSEYE! 30% OFF ANY MEAL 🎯");
    } else {
      triggerWin("15% OFF YOUR NEXT VISIT 🎟️");
    }
  };

  // Game 7: Lucky Dice Handler
  const handleRollDice = () => {
    if (gameState === "playing" || isRolling) return;
    setIsRolling(true);
    setGameState("playing");

    let rollsLeft = 10;
    const interval = setInterval(() => {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      rollsLeft--;
      if (rollsLeft <= 0) {
        clearInterval(interval);
        const finalDice = [
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ];
        setDiceValues(finalDice);
        setIsRolling(false);
        const total = finalDice[0] + finalDice[1];
        if (finalDice[0] === finalDice[1]) {
          triggerWin(`DOUBLE ${finalDice[0]}! FREE PREMIUM SHAKE 🥤`);
        } else if (total >= 8) {
          triggerWin(`LUCKY TOTAL ${total}! 25% OFF YOUR BILL 🍔`);
        } else {
          triggerWin(`TOTAL ${total}! FREE EXTRA TOPPING 🍫`);
        }
      }
    }, 120);
  };

  // Game 8: Rock Paper Scissors Handler
  const handlePlayRPS = (choice: string) => {
    if (gameState === "playing" || gameState === "won") return;
    setUserChoice(choice);
    setGameState("playing");

    const choices = ["🪨", "📄", "✂️"];
    let count = 0;
    const interval = setInterval(() => {
      setOpponentChoice(choices[count % 3]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const oppFinal = choices[Math.floor(Math.random() * choices.length)];
        setOpponentChoice(oppFinal);
        
        let rewardName = "";
        if (choice === oppFinal) {
          rewardName = "DRAW BONUS: FREE COOKIE BITES 🍪";
        } else if (
          (choice === "🪨" && oppFinal === "✂️") ||
          (choice === "📄" && oppFinal === "🪨") ||
          (choice === "✂️" && oppFinal === "📄")
        ) {
          rewardName = "VICTORY: FREE LARGE DRINK UPGRADE 🥤";
        } else {
          rewardName = "PLAYED: 10% OFF ANY SANDWICH 🥪";
        }
        
        setTimeout(() => {
          triggerWin(rewardName);
        }, 800);
      }
    }, 100);
  };

  const copyToClipboard = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-between p-4 font-sans select-none">
      {/* Top Cafe Branding Bar */}
      <header className="w-full max-w-md bg-black text-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF4C29] rounded-xl border-2 border-white flex items-center justify-center text-xl font-bold">
            ☕
          </div>
          <div>
            <h1 className="font-serif font-black text-lg text-white">Brew & Bites Cafe</h1>
            <p className="text-[10px] font-bold text-[#FF4C29] tracking-widest uppercase">Table #4 • Spin & Redeem</p>
          </div>
        </div>
        <span className="bg-emerald-400 text-black px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-black animate-pulse">
          LIVE
        </span>
      </header>

      {/* Main Game Screen Card */}
      <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000000] flex flex-col items-center my-6 min-h-[460px] justify-between relative overflow-hidden">
        
        {/* GAME TYPE 1: SPIN WHEEL */}
        {(gameType === "spin-wheel" || gameType === "wheel") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Spin to Win!</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Spin the wheel to unlock today's cafe reward.</p>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl text-red-600 drop-shadow-md">
                ▼
              </div>
              <div
                className="w-full h-full rounded-full border-4 border-black transition-transform duration-[4000ms] ease-out shadow-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: `conic-gradient(#FF4C29 0deg 60deg, #332FD0 60deg 120deg, #10B981 120deg 180deg, #F59E0B 180deg 240deg, #8B5CF6 240deg 300deg, #EC4899 300deg 360deg)`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white uppercase pointer-events-none">
                  <span className="absolute top-5">FREE BOBA</span>
                  <span className="absolute right-5 rotate-90">10% OFF</span>
                  <span className="absolute bottom-5">JACKPOT</span>
                  <span className="absolute left-5 -rotate-90">2-FOR-1</span>
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
                className="mt-6 w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                {gameState === "playing" ? "SPINNING WHEEL..." : "SPIN NOW 🎡"}
              </button>
            )}
          </div>
        )}

        {/* GAME TYPE 2: SCRATCHCARD */}
        {(gameType === "scratchcard" || gameType === "scratch") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Instant Scratchcard</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Rub the gold surface to reveal your prize!</p>

            <div className="relative w-[300px] h-[190px] rounded-2xl border-4 border-black overflow-hidden bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex flex-col items-center justify-center text-center p-4 shadow-md">
              <span className="text-5xl mb-2">🍰</span>
              <h4 className="font-black text-xl text-black">FREE PASTRY</h4>
              <p className="text-xs font-bold text-black/70">Show code to server at checkout</p>

              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchMove={handleTouchMove}
                className="absolute inset-0 cursor-crosshair touch-none select-none"
              />
            </div>
            <p className="text-xs font-bold text-black/50 mt-4">Rub finger across card to scratch</p>
          </div>
        )}

        {/* GAME TYPE 3: NEON SLOTS */}
        {(gameType === "neon-slots" || gameType === "slots") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Vegas Slot Machine</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Hit 3 matching symbols to win big!</p>

            <div className="bg-[#111] p-5 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_#FF4C29] w-full flex justify-around items-center">
              {reels.map((symbol, idx) => (
                <div
                  key={idx}
                  className="w-20 h-24 bg-white rounded-2xl border-3 border-black flex items-center justify-center text-5xl shadow-inner animate-pulse"
                >
                  {symbol}
                </div>
              ))}
            </div>

            {gameState !== "won" && (
              <button
                onClick={handleSpinSlots}
                disabled={gameState === "playing"}
                className="mt-6 w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                {gameState === "playing" ? "SPINNING..." : "PULL LEVER 🎰"}
              </button>
            )}
          </div>
        )}

        {/* GAME TYPE 4: PLINKO */}
        {(gameType === "plinko" || gameType === "plinko-drop") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Plinko Peg Drop</h2>
            <p className="text-xs font-semibold text-black/60 mb-4">Drop the chip to score a reward slot!</p>

            <div className="w-full bg-slate-900 rounded-3xl border-4 border-black p-4 flex flex-col items-center relative h-[230px] overflow-hidden shadow-inner">
              <div className="grid grid-cols-5 gap-8 my-4">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-amber-400 rounded-full border border-black shadow-sm"></div>
                ))}
              </div>

              {plinkoBallPos && (
                <div
                  className="w-7 h-7 bg-[#FF4C29] rounded-full border-2 border-black absolute shadow-[0_0_15px_#ff4c29] transition-all duration-100"
                  style={{ left: `${plinkoBallPos.x}%`, top: `${plinkoBallPos.y}px` }}
                ></div>
              )}

              <div className="absolute bottom-0 inset-x-0 bg-black flex justify-between border-t-2 border-amber-400 text-[10px] font-black text-white text-center p-2">
                <div className="flex-1 border-r border-white/20">10% OFF</div>
                <div className="flex-1 border-r border-white/20 text-emerald-400">FREE LATTE</div>
                <div className="flex-1">20% OFF</div>
              </div>
            </div>

            {gameState !== "won" && (
              <button
                onClick={handlePlinkoDrop}
                disabled={gameState === "playing"}
                className="mt-6 w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                {gameState === "playing" ? "DROPPING CHIP..." : "DROP CHIP ⚪"}
              </button>
            )}
          </div>
        )}

        {/* GAME TYPE 5: MYSTERY BOBA */}
        {(gameType === "mystery-boba" || gameType === "mystery-box" || gameType === "boba") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Mystery Boba Cup</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Tap 1 cup to crack it open!</p>

            <div className="flex justify-around w-full py-4">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenBox(idx)}
                  className={`text-6xl transition-all p-3 rounded-2xl ${
                    selectedBox === idx ? "scale-125 animate-bounce bg-amber-200 border-3 border-black shadow-lg" : "hover:scale-110"
                  }`}
                >
                  🧋
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME TYPE 6: PRECISION TAP */}
        {(gameType === "precision-tap" || gameType === "precision") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Precision Meter</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Tap stop when the needle enters the green zone!</p>

            <div className="w-full bg-white p-5 rounded-2xl border-4 border-black relative">
              <div className="text-xs font-black uppercase text-center mb-2 text-black/60">TARGET ZONE (GREEN)</div>
              <div className="w-full h-10 bg-black/10 rounded-full border-3 border-black relative overflow-hidden">
                <div className="absolute left-[40%] w-[20%] h-full bg-emerald-400 border-x-3 border-black"></div>
                <div
                  className="absolute top-0 bottom-0 w-3 bg-red-600 border-x border-black transition-all shadow-[0_0_10px_red]"
                  style={{ left: `${needlePos}%` }}
                ></div>
              </div>
            </div>

            {gameState !== "won" && (
              <button
                onClick={handleStopNeedle}
                className="mt-6 w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                STOP NEEDLE 🎯
              </button>
            )}
          </div>
        )}

        {/* GAME TYPE 7: LUCKY DICE */}
        {(gameType === "lucky-dice" || gameType === "dice") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Lucky Dice Roll</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Roll doubles or high total to win top-tier rewards!</p>

            <div className="flex justify-center gap-6 my-4 w-full">
              {diceValues.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-20 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-5xl font-black shadow-[4px_4px_0px_0px_#FF4C29] transition-transform ${
                    isRolling ? "animate-bounce" : ""
                  }`}
                >
                  {val === 1 && "⚀"}
                  {val === 2 && "⚁"}
                  {val === 3 && "⚂"}
                  {val === 4 && "⚃"}
                  {val === 5 && "⚄"}
                  {val === 6 && "⚅"}
                </div>
              ))}
            </div>

            {gameState !== "won" && (
              <button
                onClick={handleRollDice}
                disabled={isRolling}
                className="mt-6 w-full py-4 bg-[#FF4C29] text-white rounded-2xl font-black text-base border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                {isRolling ? "ROLLING DICE..." : "ROLL DICE 🎲"}
              </button>
            )}
          </div>
        )}

        {/* GAME TYPE 8: ROCK PAPER SCISSORS */}
        {(gameType === "rock-paper-scissors" || gameType === "rps") && (
          <div className="flex flex-col items-center my-auto w-full">
            <h2 className="font-serif text-2xl font-black text-black mb-1">Rock Paper Scissors</h2>
            <p className="text-xs font-semibold text-black/60 mb-6">Choose your move to challenge the Barista Bot!</p>

            <div className="flex flex-col items-center gap-4 w-full bg-[#FBF9F4] p-4 rounded-2xl border-2 border-black/10">
              <div className="flex items-center justify-center gap-8 py-2">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-black/40 uppercase block">YOU</span>
                  <span className="text-4xl mt-1 block">{userChoice || "❓"}</span>
                </div>
                <span className="text-xl font-black text-black/20">VS</span>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-black/40 uppercase block">BOT</span>
                  <span className="text-4xl mt-1 block">{opponentChoice || "❓"}</span>
                </div>
              </div>
            </div>

            {gameState !== "won" && gameState !== "playing" && (
              <div className="grid grid-cols-3 gap-3 w-full mt-6">
                {(["🪨", "📄", "✂️"]).map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handlePlayRPS(choice)}
                    className="py-3 bg-white border-2 border-black rounded-xl text-2xl font-bold shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
            {gameState === "playing" && (
              <p className="text-xs font-black text-[#FF4C29] mt-6 animate-pulse uppercase tracking-wider">
                CHALLENGING THE BOT...
              </p>
            )}
          </div>
        )}

        {/* WINNER VOUCHER REDEMPTION CARD */}
        {gameState === "won" && (
          <div className="w-full bg-[#111111] text-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#10B981] flex flex-col items-center gap-3 animate-fade-in my-auto">
            <span className="bg-emerald-400 text-black px-3 py-1 rounded-full text-xs font-black uppercase border border-black shadow-[2px_2px_0px_0px_#000]">
              🎉 REWARD UNLOCKED!
            </span>
            <h3 className="font-serif text-2xl font-black text-white text-center">{reward}</h3>
            
            <div className="w-full bg-white text-black rounded-xl p-3 border-2 border-black flex justify-between items-center my-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-black/50 tracking-wider block">Redemption Code</span>
                <span className="font-mono text-xl font-black tracking-wider text-[#FF4C29]">{voucherCode}</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold border border-black hover:bg-black/80 transition-colors"
              >
                {copied ? "Copied! ✓" : "Copy Code"}
              </button>
            </div>

            {/* Countdown Expiration Timer */}
            <div className="flex items-center gap-2 text-xs font-bold text-white/70">
              <span>⏱️ Expires in:</span>
              <span className="font-mono text-emerald-400 font-black text-sm">{formatTimer(timeLeft)}</span>
            </div>

            {/* Staff Redeem Button */}
            <button
              onClick={() => setRedeemed(true)}
              disabled={redeemed}
              className={`w-full py-3 rounded-xl font-bold text-xs border-2 border-black transition-all ${
                redeemed
                  ? "bg-gray-600 text-white cursor-not-allowed"
                  : "bg-emerald-400 text-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px]"
              }`}
            >
              {redeemed ? "VOUCHER REDEEMED BY STAFF ✓" : "SHOW TO STAFF TO REDEEM"}
            </button>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="text-center text-xs font-bold text-black/50 py-2">
        Powered by <strong>ForStore Gamified Loyalty</strong> • Terms Apply
      </footer>
    </div>
  );
}
