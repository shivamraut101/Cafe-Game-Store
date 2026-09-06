"use client";

import React, { useState } from "react";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";

export default function Home() {
  const [scansPerMonth, setScansPerMonth] = useState(1500);
  const [avgTicket, setAvgTicket] = useState(12);

  // Credit calculation ($0.02 or 1 credit per scan)
  const creditCost = (scansPerMonth * 0.02).toFixed(2);
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
          <a href="#features" className="hover:text-black/70 transition-colors">White-Labeling</a>
          <a href="#calculator" className="hover:text-black/70 transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-black/70 transition-colors">Pricing & Credits</a>
          <a href="#games" className="hover:text-black/70 transition-colors">Game Minigames</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={ADMIN_URL}
            className="font-bold text-sm hover:text-black/70 transition-colors hidden sm:inline-block px-3 py-2"
          >
            Merchant Sign In
          </a>
          <a
            href={ADMIN_URL}
            className="bg-[#111111] text-white px-5 py-2.5 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all text-xs flex items-center gap-2"
          >
            Launch Merchant Portal <span>→</span>
          </a>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-6 flex flex-col items-start gap-6">
            <span className="text-xs font-bold tracking-wider text-emerald-900 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              WHITE-LABEL SAAS & PAY-AS-YOU-GO WALLET ENGINE
            </span>

            <h1 className="font-serif text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-[#111111]">
              Turn every customer wait into revenue under <span className="underline decoration-[#FF4C29] decoration-wavy">your brand</span>.
            </h1>

            <p className="text-lg text-[#4A4A4A] leading-relaxed max-w-xl">
              Fully white-labeled QR game & reward platform for any local business. Run custom branded minigames, pay only for active customer scans with zero hardware, and boost repeat visits by up to 25%.
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto pt-2">
              <a
                href={ADMIN_URL}
                className="bg-[#111111] text-white text-center py-4 px-8 rounded-2xl font-bold border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all flex items-center justify-center gap-2 text-sm"
              >
                Start Free Trial <span>→</span>
              </a>
              <a
                href="#calculator"
                className="bg-white text-[#111111] text-center py-4 px-8 rounded-2xl font-bold border-2 border-black hover:bg-black/5 transition-all flex items-center justify-center text-sm shadow-[4px_4px_0px_0px_#000000]"
              >
                Calculate Store ROI
              </a>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 text-xs font-bold text-black/70">
              <span className="flex items-center gap-1.5">✓ Custom Domain (play.yourstore.com)</span>
              <span className="flex items-center gap-1.5">✓ 1 Credit = $0.02 / scan</span>
              <span className="flex items-center gap-1.5">✓ Vector QR PDF Printables</span>
            </div>
          </div>

          {/* Right Column Interactive White-Label Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="bg-[#EAE6DA] rounded-3xl p-6 md:p-8 border-2 border-black shadow-[8px_8px_0px_0px_#000000] flex flex-col gap-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-black/50 uppercase tracking-wider">LIVE DEMO SIMULATOR</span>
                  <h3 className="font-serif text-xl font-bold text-black">Brew & Bites Cafe (White-Labeled)</h3>
                </div>
                <span className="bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold px-3 py-1 rounded-full">
                  Pro Tier Active
                </span>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_#8B5CF6] flex flex-col gap-2">
                  <span className="text-3xl">🎡</span>
                  <span className="font-bold text-sm">Spin the Wheel</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-max">
                    1,420 Scans
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] flex flex-col gap-2">
                  <span className="text-3xl">🎟️</span>
                  <span className="font-bold text-sm">Instant Lottery</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-max">
                    950 Scans
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-black flex items-center justify-center font-bold">
                    ☕
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Customer Phone Experience</h4>
                    <p className="text-[11px] text-black/60">Branded with your logo, colors & custom domain.</p>
                  </div>
                </div>
                <a
                  href="/admin-panel"
                  className="bg-[#111111] text-white text-[11px] font-bold px-3 py-2 rounded-lg border border-black"
                >
                  Test Admin Panel
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: ROI & CREDIT CALCULATOR */}
        <section id="calculator" className="bg-white border-y-2 border-black py-16 px-6">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C29]">
                PAY-AS-YOU-GO COST CALCULATOR
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-black">
                See how much revenue your store generates with scan credits.
              </h2>
              <p className="text-sm text-black/70 leading-relaxed">
                Our wallet credit model charges only 1 credit ($0.02) per customer game play. No wasted ad spend—you only pay when customers engage at your tables.
              </p>

              {/* Slider 1: Monthly Scans */}
              <div className="bg-[#F6F3EB] rounded-2xl p-5 border-2 border-black mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Estimated Monthly Customer Scans</span>
                  <span className="text-[#FF4C29] text-lg font-black">{scansPerMonth.toLocaleString()} scans</span>
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
                  <span>Average Customer Ticket Spend ($)</span>
                  <span className="text-[#FF4C29] text-lg font-black">${avgTicket}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
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
                  <span className="text-xs text-white/60 font-semibold block">Wallet Credit Cost</span>
                  <span className="font-serif text-3xl font-black text-white mt-1 block">${creditCost}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">({scansPerMonth} credits used)</span>
                </div>

                <div>
                  <span className="text-xs text-white/60 font-semibold block">Est. Additional Repeat Revenue</span>
                  <span className="font-serif text-3xl font-black text-emerald-400 mt-1 block">
                    +${estimatedRevenue.toLocaleString()}
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

              <a
                href={ADMIN_URL}
                className="w-full bg-[#FF4C29] text-white py-4 rounded-xl font-bold border-2 border-black shadow-[3px_3px_0px_0px_#FFFFFF] text-center hover:translate-y-[1px] text-sm"
              >
                Top-Up Store Wallet & Start
              </a>
            </div>
          </div>
        </section>

        {/* SECTION: PRICING TIERS & WALLET CREDITS */}
        <section id="pricing" className="max-w-7xl mx-auto w-full px-6 py-20 flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C29]">SUBSCRIPTION & WALLET PRICING</span>
            <h2 className="font-serif text-4xl font-black text-black">Flexible plans for stores of any size.</h2>
            <p className="text-sm text-black/70">
              Combine fixed monthly subscription tiers with Pay-As-You-Go wallet scan credits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_#000000] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-black/50 uppercase">STARTER MERCHANT</span>
                <h3 className="font-serif text-3xl font-black text-black mt-2">$0</h3>
                <span className="text-xs text-black/60 font-semibold block">Free Forever</span>

                <div className="bg-[#F6F3EB] rounded-xl p-3 border border-black/10 my-6 text-xs font-bold">
                  🎁 Includes 200 Monthly Bonus Credits
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2">✓ 1 Active Game Campaign</li>
                  <li className="flex items-center gap-2">✓ Standard Printable QR Codes</li>
                  <li className="flex items-center gap-2">✓ $0.02 per extra scan credit</li>
                  <li className="flex items-center gap-2">✓ Community Support</li>
                </ul>
              </div>

              <a
                href={ADMIN_URL}
                className="w-full mt-8 py-3.5 text-center font-bold border-2 border-black rounded-xl text-xs hover:bg-black/5"
              >
                Get Started Free
              </a>
            </div>

            {/* Pro Store Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 bg-[#FF4C29] text-white text-[10px] font-black px-3.5 py-1 rounded-full border border-black tracking-widest uppercase">
                MOST POPULAR
              </span>

              <div>
                <span className="text-xs font-bold text-black/50 uppercase">PRO STORE TIER</span>
                <h3 className="font-serif text-3xl font-black text-black mt-2">$29</h3>
                <span className="text-xs text-black/60 font-semibold block">per month</span>

                <div className="bg-orange-50 rounded-xl p-3 border border-orange-200 my-6 text-xs font-bold text-orange-900">
                  🎁 Includes 1,000 Monthly Bonus Credits
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2">✓ Up to 5 Active Minigames</li>
                  <li className="flex items-center gap-2">✓ White-Label Logo & Color Palette</li>
                  <li className="flex items-center gap-2">✓ Custom Subdomain (play.yourstore.com)</li>
                  <li className="flex items-center gap-2">✓ Printable A5 Table Tent PDF Studio</li>
                  <li className="flex items-center gap-2">✓ Priority Email & Chat Support</li>
                </ul>
              </div>

              <a
                href={ADMIN_URL}
                className="w-full mt-8 py-3.5 text-center font-bold bg-[#111111] text-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] text-xs hover:translate-y-[1px]"
              >
                Start Pro 14-Day Trial
              </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-black/50 uppercase">ENTERPRISE WHITE-LABEL</span>
                <h3 className="font-serif text-3xl font-black text-black mt-2">$99</h3>
                <span className="text-xs text-black/60 font-semibold block">per month</span>

                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 my-6 text-xs font-bold text-purple-900">
                  🎁 Includes 3,500 Monthly Bonus Credits
                </div>

                <ul className="flex flex-col gap-3 text-xs text-black/80 font-medium">
                  <li className="flex items-center gap-2">✓ Unlimited Active Game Campaigns</li>
                  <li className="flex items-center gap-2">✓ 100% Clean White-Label (No Watermarks)</li>
                  <li className="flex items-center gap-2">✓ Multi-Location Account Switcher</li>
                  <li className="flex items-center gap-2">✓ Custom Domain + Free SSL</li>
                  <li className="flex items-center gap-2">✓ Dedicated Success Manager</li>
                </ul>
              </div>

              <a
                href={ADMIN_URL}
                className="w-full mt-8 py-3.5 text-center font-bold border-2 border-black rounded-xl text-xs hover:bg-black/5"
              >
                Contact Enterprise Sales
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8 px-6 text-center text-xs font-bold text-black/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 ForStore White-Label SaaS Engine. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href={ADMIN_URL} className="hover:underline">Merchant Portal</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <a href="#calculator" className="hover:underline">ROI Calculator</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
