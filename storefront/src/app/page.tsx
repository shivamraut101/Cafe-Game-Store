import React from "react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EB]">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-lg">🎡</span>
          </div>
          <span className="font-serif font-black text-2xl tracking-tight">ForStore</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-medium">
          <a href="#features" className="hover:text-black/70 transition-colors">Features</a>
          <a href="#games" className="hover:text-black/70 transition-colors">Games</a>
          <a href="#how-it-works" className="hover:text-black/70 transition-colors">How it works</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 px-4 py-2 rounded-full border border-black/10 hover:border-black/30 transition-all text-sm font-medium">
            <span>🌐</span> EN <span>▼</span>
          </button>
          <a href="/admin-panel" className="font-medium hover:text-black/70 transition-colors hidden sm:inline-block">
            Sign In
          </a>
          <a
            href="/admin-panel"
            className="bg-[#111111] text-white px-5 py-2.5 rounded-full font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-sm flex items-center gap-2"
          >
            Get Started Free <span>→</span>
          </a>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column Info */}
        <div className="lg:col-span-6 flex flex-col items-start gap-8">
          <span className="text-xs font-bold tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ● GAMIFIED LOYALTY FOR LOCAL STORES
          </span>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-[#111111]">
            Turn every visit into a game
          </h1>

          <p className="text-lg md:text-xl text-[#4A4A4A] leading-relaxed max-w-xl">
            Give your customers a reason to come back. Set up a QR-based game in minutes — no hardware, no app.
          </p>

          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <a
              href="/admin-panel"
              className="bg-[#111111] text-white text-center py-4 px-8 rounded-2xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all flex items-center justify-center gap-2"
            >
              Get Started Free <span>→</span>
            </a>
            <a
              href="/admin-panel"
              className="bg-transparent text-[#111111] text-center py-4 px-8 rounded-2xl font-bold border-2 border-black hover:bg-black/5 transition-all flex items-center justify-center"
            >
              Go to Dashboard
            </a>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/10 text-sm font-semibold bg-white/50">
              ✓ No hardware needed
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/10 text-sm font-semibold bg-white/50">
              ✓ Works on any phone
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/10 text-sm font-semibold bg-white/50">
              ✓ Multi-language
            </span>
          </div>
        </div>

        {/* Right Column Games Grid */}
        <div className="lg:col-span-6 relative bg-[#EAE6DA] rounded-3xl p-8 border-2 border-black/10">
          {/* Dotted Grid Overlay Background */}
          <div className="absolute inset-0 retro-dotted-bg rounded-3xl pointer-events-none"></div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Game Card 1 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#8B5CF6] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-2xl">
                🎡
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Spin the Wheel</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>

            {/* Game Card 2 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#FF4C29] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-2xl">
                🎟️
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Instant Lottery</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>

            {/* Game Card 3 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#EC4899] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#EC4899] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center text-2xl">
                🎰
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Slot Machine</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>

            {/* Game Card 4 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#10B981] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#10B981] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-2xl">
                🧺
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Catch & Win</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>

            {/* Game Card 5 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#3B82F6] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#3B82F6] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-2xl">
                🐍
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Snakes & Ladders</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>

            {/* Game Card 6 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#F59E0B] transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl">
                👆
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Tap Speed</h3>
                <p className="text-xs font-bold text-black/40 tracking-wider mt-1">SCAN & PLAY</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
