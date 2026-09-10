"use client";

import React, { useState } from "react";
import Link from "next/link";
import { triggerStoryboardModal } from "../components/DemoStoryboardModal";

export default function MarketingHomePage() {
  const [scansPerMonth, setScansPerMonth] = useState(1500);
  const [avgTicket, setAvgTicket] = useState(250);

  // Dynamic game credit calculation (average ~22 credits per play across 10-40 credit game tiers)
  const estimatedCredits = scansPerMonth * 22;
  // Blended credit cost using volume packs (e.g. ₹999 for 9,000 credits = ~11 paise/credit)
  const creditCost = Math.round(estimatedCredits * 0.111);
  // Estimated repeat visit revenue generated (assuming 18% repeat visit lift)
  const estimatedRevenue = Math.round(scansPerMonth * 0.18 * avgTicket);

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F3EB]">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full sticky top-0 bg-[#F6F3EB]/90 backdrop-blur-md z-40 border-b border-black/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29]">
            ⚡
          </div>
          <span className="font-serif font-black text-2xl tracking-tight text-black">ForStore</span>
          <span className="bg-orange-100 text-[#FF4C29] text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-200 uppercase tracking-widest hidden sm:inline-block">
            White-Label SaaS
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm">
          <button
            onClick={() => triggerStoryboardModal(0)}
            className="text-black hover:text-[#FF4C29] transition-colors font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>📖</span>
            <span>How It Works</span>
          </button>
          <a href="#features" className="hover:text-black/70 transition-colors">White-Labeling</a>
          <a href="#calculator" className="hover:text-black/70 transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-black/70 transition-colors">Pricing & Plans</a>
          <a href="#games" className="hover:text-black/70 transition-colors">Arcade Games</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="font-bold text-sm hover:text-black/70 transition-colors hidden sm:inline-block px-3 py-2"
          >
            Merchant Sign In
          </Link>
          <Link
            href="/admin?mode=register"
            className="bg-[#111111] text-white px-5 py-2.5 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-xs flex items-center gap-2"
          >
            Start Free Trial <span>→</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6">
            <span className="text-xs font-bold tracking-wider text-emerald-900 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              WHITE-LABEL SAAS & PAY-PER-PLAY WALLET ENGINE
            </span>

            <h1 className="font-serif text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-[#111111]">
              Turn every customer visit into repeat revenue under <span className="underline decoration-[#FF4C29] decoration-wavy">your brand</span>.
            </h1>

            <p className="text-lg text-[#4A4A4A] leading-relaxed max-w-xl">
              Fully white-labeled QR game & reward platform for cafes, diners, and restaurants. Run custom branded minigames, pay only for active customer plays with zero hardware, and boost repeat visits by up to 25%.
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/admin?mode=register"
                className="bg-[#111111] text-white text-center py-4 px-8 rounded-2xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all flex items-center justify-center gap-2 text-sm"
              >
                Start Free Trial (1,500 Welcome Credits) <span>→</span>
              </Link>
              <a
                href="#calculator"
                className="bg-white text-[#111111] text-center py-4 px-8 rounded-2xl font-bold border-2 border-black hover:bg-black/5 transition-all flex items-center justify-center text-sm shadow-[4px_4px_0px_0px_#000000]"
              >
                Calculate Store ROI
              </a>
              <button
                onClick={() => triggerStoryboardModal(0)}
                className="bg-amber-100 text-black text-center py-4 px-6 rounded-2xl font-black border-2 border-black hover:bg-amber-200 transition-all flex items-center justify-center gap-1.5 text-sm shadow-[4px_4px_0px_0px_#000000] cursor-pointer"
              >
                <span>🎬</span>
                <span>See Storyboard</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs font-bold text-black/70">
              <span className="flex items-center gap-1.5">✓ 1,500 Welcome Credits on Sign-up</span>
              <span className="flex items-center gap-1.5">✓ Capped at 10 plays/user/day</span>
              <span className="flex items-center gap-1.5">✓ Custom Printable QR Table Stands</span>
            </div>
          </div>

          {/* Right Column Interactive White-Label Mockup */}
          <div className="lg:col-span-6 relative" id="features">
            <div className="bg-[#EAE6DA] rounded-3xl p-6 md:p-8 border-2 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-black/50 uppercase tracking-wider">INTERACTIVE PREVIEW</span>
                  <h3 className="font-serif text-xl font-bold text-black">Custom Cafe Experience (White-Labeled)</h3>
                </div>
                <span className="bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold px-3 py-1 rounded-full">
                  Pro Tier Active
                </span>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-2 gap-4" id="games">
                <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_#8B5CF6] flex flex-col gap-2">
                  <span className="text-3xl">☕</span>
                  <span className="font-bold text-sm">Coffee Stack Tower</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-max">
                    1,420 Plays
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] flex flex-col gap-2">
                  <span className="text-3xl">🏓</span>
                  <span className="font-bold text-sm">Air Hockey Cup</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-max">
                    950 Plays
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-black flex items-center justify-center font-bold text-xl">
                    🏪
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Customer Table Experience</h4>
                    <p className="text-[11px] text-black/60">Branded with your cafe logo, colors & table QR standees.</p>
                  </div>
                </div>
                <Link
                  href="/admin"
                  className="bg-[#111111] text-white text-[11px] font-bold px-3 py-2 rounded-lg border border-black"
                >
                  Enter Portal →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ROI & CREDIT CALCULATOR */}
        <section id="calculator" className="bg-white border-y-2 border-black py-16 px-6">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C29]">
                PAY-PER-PLAY ROI CALCULATOR
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-black">
                See how much repeat revenue your cafe generates.
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                Our Pay-Per-Play model uses dynamic game fuel (10 to 40 credits per play depending on game type). Fair-play cap limits billed plays to 10 plays/user/day; plays 11+ on the same day are 100% on us!
              </p>

              {/* Slider 1: Monthly Scans */}
              <div className="bg-[#F6F3EB] rounded-2xl p-5 border-2 border-black mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Estimated Monthly Customer Game Plays</span>
                  <span className="text-[#FF4C29] text-lg font-black">{scansPerMonth.toLocaleString()} plays</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={scansPerMonth}
                  onChange={e => setScansPerMonth(Number(e.target.value))}
                  className="w-full accent-[#FF4C29] cursor-pointer"
                />
              </div>

              {/* Slider 2: Average Ticket Size */}
              <div className="bg-[#F6F3EB] rounded-2xl p-5 border-2 border-black flex flex-col gap-3">
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Average Customer Ticket Spend (₹)</span>
                  <span className="text-[#FF4C29] text-lg font-black">₹{avgTicket}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={avgTicket}
                  onChange={e => setAvgTicket(Number(e.target.value))}
                  className="w-full accent-[#FF4C29] cursor-pointer"
                />
              </div>
            </div>

            {/* Results Box */}
            <div className="lg:col-span-6 bg-[#111111] text-white rounded-3xl p-8 border-2 border-black shadow-[8px_8px_0px_0px_#FF4C29] flex flex-col gap-6">
              <span className="text-xs font-black text-[#FF4C29] uppercase tracking-widest">ESTIMATED MONTHLY ROI</span>

              <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-xs text-white/60 font-semibold block">Est. Wallet Fuel Cost</span>
                  <span className="font-serif text-3xl font-black text-white mt-1 block">₹{creditCost.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">({estimatedCredits.toLocaleString()} credits across ~{scansPerMonth} plays)</span>
                </div>

                <div>
                  <span className="text-xs text-white/60 font-semibold block">Est. Additional Repeat Revenue</span>
                  <span className="font-serif text-3xl font-black text-emerald-400 mt-1 block">
                    +₹{estimatedRevenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-white/60 block mt-1">Based on 18% repeat visit lift</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Net Profit ROI Multiplier:</span>
                <span className="text-xl font-black text-emerald-400">
                  ~{((estimatedRevenue / (Number(creditCost) || 1)) * 100).toFixed(0)}% ROI
                </span>
              </div>

              <Link
                href="/admin?mode=register"
                className="w-full bg-[#FF4C29] text-white py-4 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FFFFFF] text-center hover:translate-y-[1px] text-sm block"
              >
                Top-Up Store Wallet & Start Free
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION: PRICING TIERS & WALLET CREDITS */}
        <section id="pricing" className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-10">
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF4C29] bg-[#FF4C29]/10 px-3 py-1 rounded-full border border-[#FF4C29]/30 inline-block self-center">
              PROMOTIONAL LAUNCH OFFER · PURE PAY-PER-PLAY
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-black text-black">
              Zero Monthly Subscription Fees.
            </h2>
            <p className="text-sm sm:text-base text-black/70 font-medium">
              We eliminated fixed monthly software fees for our launch cohort! All plans are unlocked at <strong className="text-emerald-700 underline decoration-2">₹0 /mo</strong> on our dynamic Pay-Per-Play model (10 to 40 credits per game play, capped at 10 plays/user/day — plays 11+ same day are 100% on us).
            </p>
          </div>

          {/* High Urgency Founder Launch Banner */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 p-1 rounded-3xl border-3 border-black shadow-[6px_6px_0px_0px_#000]">
            <div className="bg-[#111111] text-white rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full animate-pulse border border-white">
                    ⚡ FOUNDER LAUNCH EXEMPTION
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    🔥 42 / 50 Cafe Venues Claimed
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    8 Slots Remaining
                  </span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-black text-white leading-tight">
                  Lock in <span className="text-emerald-400">₹0 /mo Fixed Cost</span> for Life
                </h3>
                <p className="text-xs sm:text-sm text-white/70 max-w-xl font-medium">
                  Normally ₹2,499/mo to ₹7,999/mo. Claim your venue slot today to waive all fixed monthly subscription fees permanently. You only pay via dynamic game fuel credits (10 to 40 credits/play)!
                </p>
              </div>
              <Link
                href="/admin?mode=register"
                className="whitespace-nowrap px-8 py-4 bg-emerald-400 text-black font-black text-sm rounded-xl border-2 border-white shadow-[4px_4px_0px_0px_#FF4C29] hover:bg-emerald-300 transition-all hover:scale-105 cursor-pointer text-center"
              >
                Claim ₹0/mo Exemption Now ➔
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black/50 uppercase">STARTER MERCHANT</span>
                  <span className="text-[10px] font-black bg-black/5 text-black px-2 py-0.5 rounded border border-black/20">
                    FREE TIER
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-serif text-4xl font-black text-black">₹0</h3>
                  <span className="text-xs text-black/60 font-bold">/month</span>
                </div>
                <span className="text-xs text-black/60 font-semibold block mt-0.5">Free Forever • Dynamic Fuel</span>

                <div className="bg-[#F6F3EB] rounded-xl p-3 border border-black/10 my-6 text-xs font-bold text-black/80">
                  🎁 Includes 1,500 Welcome Game Credits (~75-150 Plays)
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2">✓ 1 Active Game Campaign</li>
                  <li className="flex items-center gap-2">✓ Standard Printable QR Codes</li>
                  <li className="flex items-center gap-2">✓ Pay-Per-Play (10 to 40 credits/play, max 10/day)</li>
                  <li className="flex items-center gap-2">✓ Plays 11+ same day are 100% on us!</li>
                </ul>
              </div>

              <Link
                href="/admin?mode=register"
                className="w-full mt-8 py-3.5 text-center font-bold border-2 border-black rounded-xl text-xs hover:bg-black/5 block transition-colors"
              >
                Get Started Free ➔
              </Link>
            </div>

            {/* Pro Store Plan */}
            <div className="bg-white rounded-3xl p-8 border-3 border-black shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col justify-between relative">
              <div className="absolute -top-3.5 right-6 flex items-center gap-2">
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-black uppercase tracking-wider">
                  100% WAIVED
                </span>
                <span className="bg-[#FF4C29] text-white text-[10px] font-black px-3 py-1 rounded-full border border-black tracking-widest uppercase">
                  POPULAR
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-black/50 uppercase">PRO STORE TIER</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-serif text-2xl font-bold line-through text-black/40">₹2,499</span>
                  <h3 className="font-serif text-4xl font-black text-emerald-600">₹0</h3>
                  <span className="text-xs text-black/60 font-bold">/month</span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 block mt-0.5">
                  ⚡ Founder Exemption: ₹2,499/mo waived! Dynamic Game Fuel.
                </span>

                <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 my-6 text-xs font-bold text-orange-900">
                  🎁 Includes 12,500 Monthly Bonus Game Credits
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2 font-bold text-black">✓ Up to 8 Active Minigames</li>
                  <li className="flex items-center gap-2 font-bold text-black">✓ Custom Cafe Brand Theme & Colors</li>
                  <li className="flex items-center gap-2 font-bold text-black">✓ Printable Table QR Stand PDF Studio</li>
                  <li className="flex items-center gap-2 font-bold text-black">✓ Counter Staff Attribution & Shifts</li>
                  <li className="flex items-center gap-2 font-bold text-black">✓ Priority WhatsApp & Email Support</li>
                </ul>
              </div>

              <Link
                href="/admin?mode=register"
                className="w-full mt-8 py-3.5 text-center font-black bg-[#111111] text-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] text-xs hover:bg-black transition-transform active:translate-y-[1px] block"
              >
                Claim Pro at ₹0/mo (Lock In Exemption) ➔
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-black uppercase tracking-wider">
                100% WAIVED
              </span>

              <div>
                <span className="text-xs font-bold text-black/50 uppercase">ENTERPRISE WHITE-LABEL</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-serif text-2xl font-bold line-through text-black/40">₹7,999</span>
                  <h3 className="font-serif text-4xl font-black text-purple-700">₹0</h3>
                  <span className="text-xs text-black/60 font-bold">/month</span>
                </div>
                <span className="text-[11px] font-bold text-purple-700 block mt-0.5">
                  ⚡ Founder Exemption: ₹7,999/mo waived! Dynamic Game Fuel.
                </span>

                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 my-6 text-xs font-bold text-purple-900">
                  🎁 Includes 45,000 Monthly Bonus Game Credits
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2 font-bold text-black">✓ Unlimited Active Game Campaigns</li>
                  <li className="flex items-center gap-2 font-bold text-black">✓ 100% Clean White-Label (No Watermarks)</li>
                  <li className="flex items-center gap-2">✓ Multi-Location Account Switcher</li>
                  <li className="flex items-center gap-2">✓ Custom Domain + Free SSL</li>
                  <li className="flex items-center gap-2">✓ Dedicated Success Manager</li>
                </ul>
              </div>

              <Link
                href="/admin?mode=register"
                className="w-full mt-8 py-3.5 text-center font-black bg-purple-900 text-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#8B5CF6] text-xs hover:bg-purple-950 transition-transform active:translate-y-[1px] block"
              >
                Claim Enterprise at ₹0/mo (Lock In Exemption) ➔
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8 px-6 text-center text-xs font-bold text-black/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 ForStore White-Label SaaS Engine. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="hover:underline">Merchant Portal</Link>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#calculator" className="hover:underline">ROI Calculator</a>
            <Link href="/recover-pin" className="hover:underline">Store PIN Recovery</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
