"use client";

import React from "react";

export default function WalletTab() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-black mb-2">AI Credits Wallet</h2>
          <p className="text-sm font-semibold text-black/60">Manage your credits for Generative AI QR codes.</p>
        </div>
        <button className="bg-[#111111] text-white px-6 py-3 rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all flex items-center gap-2">
          <span>💳</span> Add Credits
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-[#FBF9F4] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF4C29] rounded-full mix-blend-multiply opacity-20 blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#332FD0] rounded-full mix-blend-multiply opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-black/50">Current Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tight text-black">1,450</span>
              <span className="text-2xl font-bold text-black/40">Credits</span>
            </div>
            <p className="text-sm font-semibold text-black/60 mt-1">
              Roughly <span className="text-black">~29</span> Generative AI QR Code generations left.
            </p>
          </div>

          <div className="w-full md:w-1/3 bg-white border-2 border-black rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-sm mb-3">Quick Top-Up Packages</h4>
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-between w-full p-3 rounded-xl border-2 border-black/10 hover:border-black hover:bg-[#FBF9F4] transition-colors group">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>🪙</span> 500 Credits
                </div>
                <span className="font-bold bg-black text-white px-3 py-1 rounded-lg text-xs group-hover:bg-[#FF4C29] transition-colors">$10</span>
              </button>
              <button className="flex items-center justify-between w-full p-3 rounded-xl border-2 border-black/10 hover:border-black hover:bg-amber-50 transition-colors group">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>💰</span> 2,000 Credits
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Save 20%</span>
                  <span className="font-bold bg-black text-white px-3 py-1 rounded-lg text-xs group-hover:bg-[#FF4C29] transition-colors">$32</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-serif text-xl font-bold text-black mb-4">Transaction History</h3>
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black/70">
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 pr-6 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 text-sm font-semibold">
                {[
                  { id: 1, date: "Oct 24, 2026", desc: "Generated AI QR: 'Cyberpunk Coffee'", amount: -50, balance: 1450 },
                  { id: 2, date: "Oct 23, 2026", desc: "Generated AI QR: 'Latte Art 3D'", amount: -50, balance: 1500 },
                  { id: 3, date: "Oct 20, 2026", desc: "Purchased 'Pro Top-Up' (2,000 Credits)", amount: 2000, balance: 1550, isPositive: true },
                  { id: 4, date: "Oct 15, 2026", desc: "Generated AI QR: 'Neon Sign'", amount: -50, balance: -450 },
                ].map((tx) => (
                  <tr key={tx.id} className="hover:bg-black/[0.02]">
                    <td className="p-4 pl-6 text-black/60">{tx.date}</td>
                    <td className="p-4 text-black">{tx.desc}</td>
                    <td className={`p-4 text-right ${tx.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.isPositive ? '+' : ''}{tx.amount}
                    </td>
                    <td className="p-4 pr-6 text-right text-black/50 font-mono">{tx.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
