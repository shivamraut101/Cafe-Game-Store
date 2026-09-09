"use client";

import React, { useState } from "react";

export interface Transaction {
  id: string;
  date: string;
  type: "Top-Up" | "Scan Deduction" | "Monthly Bonus";
  amount: number; // Positive for top-ups, negative for scan deductions
  credits: number;
  status: "Completed" | "Pending";
  invoiceUrl?: string;
}

const initialTransactions: Transaction[] = [
  { id: "TX-1092", date: "2026-07-31 14:22", type: "Scan Deduction", amount: -45, credits: 1455, status: "Completed" },
  { id: "TX-1091", date: "2026-07-30 09:15", type: "Top-Up", amount: 500, credits: 1500, status: "Completed", invoiceUrl: "#" },
  { id: "TX-1090", date: "2026-07-28 18:00", type: "Scan Deduction", amount: -120, credits: 1000, status: "Completed" },
  { id: "TX-1089", date: "2026-07-25 10:00", type: "Monthly Bonus", amount: 1000, credits: 1120, status: "Completed" },
];

export default function WalletDashboard() {
  const [balance, setBalance] = useState(1455);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState(500);
  const [autoRecharge, setAutoRecharge] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(200);

  const handleTopUp = () => {
    // 1 Credit = ₹1
    const addedCredits = selectedTopUpAmount;
    const newBal = balance + addedCredits;
    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      type: "Top-Up",
      amount: addedCredits,
      credits: newBal,
      status: "Completed",
      invoiceUrl: "#",
    };
    setBalance(newBal);
    setTransactions([newTx, ...transactions]);
    setShowTopUpModal(false);
  };

  const costPerScan = 1; // ₹1 or 1 credit per scan

  return (
    <div className="flex flex-col gap-8">
      {/* Top Banner & Wallet Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Big Card: Wallet Balance */}
        <div className="md:col-span-7 bg-[#111111] text-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <h2 className="font-serif text-xl font-bold">Pay-As-You-Go Store Wallet</h2>
            </div>
            <span className="bg-[#FF4C29] text-white text-xs font-black px-3 py-1 rounded-full border border-black uppercase tracking-wider">
              Scan Credits
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="font-serif text-5xl font-black text-[#F6F3EB]">{balance.toLocaleString()}</span>
            <span className="text-sm font-semibold text-white/70">
              Credits Remaining (~₹{(balance * costPerScan).toLocaleString()})
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="text-xs text-white/70">
              <span className="font-bold text-white">Rate: 1 Scan = 1 Credit</span> (₹{costPerScan}/scan)
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-[#FF4C29] text-white px-6 py-2.5 rounded-xl font-bold border-2 border-black shadow-[2px_2px_0px_0px_#FFFFFF] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#FFFFFF] transition-all text-sm"
            >
              + Top-Up Credits Now
            </button>
          </div>
        </div>

        {/* Right Side: Wallet Settings & Auto-Recharge */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#10B981] flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-black">Auto-Recharge Engine</h3>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-black/60">
              Never miss customer scan engagement. Automatically purchase credits when balance drops low.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-black/10 pt-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Auto-Top-Up When Below:</span>
              <select
                value={lowBalanceThreshold}
                onChange={e => setLowBalanceThreshold(Number(e.target.value))}
                className="p-1.5 rounded-lg border-2 border-black bg-[#FBF9F4]"
              >
                <option value={100}>100 Credits (₹100)</option>
                <option value={200}>200 Credits (₹200)</option>
                <option value={500}>500 Credits (₹500)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span>Enable Auto-Top-Up Trigger</span>
              <input
                type="checkbox"
                checked={autoRecharge}
                onChange={e => setAutoRecharge(e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions History Audit Log Table */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#000000]">
        <div className="bg-black/5 p-5 border-b-2 border-black flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-black">Wallet Audit & Scan Deductions</h3>
            <p className="text-xs text-black/60">Real-time log of customer plays and credit top-ups.</p>
          </div>
          <button className="text-xs font-bold border border-black bg-white px-3 py-1.5 rounded-lg hover:bg-black/5">
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Tx ID</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Balance After</th>
                <th className="p-4 pr-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-sm">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-black/[0.02]">
                  <td className="p-4 pl-6 font-mono font-bold">{tx.id}</td>
                  <td className="p-4 font-medium text-black/70">{tx.date}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        tx.type === "Top-Up"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : tx.type === "Monthly Bonus"
                          ? "bg-purple-50 border-purple-300 text-purple-800"
                          : "bg-orange-50 border-orange-300 text-orange-800"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    className={`p-4 font-black ${
                      tx.amount > 0 ? "text-emerald-700" : "text-black"
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="p-4 font-semibold">{tx.credits}</td>
                  <td className="p-4 pr-6 text-right">
                    {tx.invoiceUrl ? (
                      <a
                        href={tx.invoiceUrl}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        PDF Invoice ↗
                      </a>
                    ) : (
                      <span className="text-xs text-black/40">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#F6F3EB] rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_#000000] p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 font-bold text-lg hover:text-black/70"
            >
              ✕
            </button>
            <h3 className="font-serif text-2xl font-bold text-black mb-2">Top-Up Scan Credits</h3>
            <p className="text-xs text-black/60 mb-6">Select a credit package to recharge your store wallet.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { amount: 500, credits: 500, label: "Starter Pack" },
                { amount: 1600, credits: 2000, label: "Popular (+400 Bonus)" },
                { amount: 3500, credits: 5000, label: "Pro Store (+1.5k Bonus)" },
                { amount: 7000, credits: 11000, label: "Enterprise (+4k Bonus)" },
              ].map(pkg => (
                <button
                  key={pkg.amount}
                  type="button"
                  onClick={() => setSelectedTopUpAmount(pkg.amount)}
                  className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                    selectedTopUpAmount === pkg.amount
                      ? "border-[#FF4C29] bg-white shadow-[3px_3px_0px_0px_#FF4C29] scale-[1.02]"
                      : "border-black bg-white/70 hover:bg-white"
                  }`}
                >
                  <span className="text-xs font-extrabold text-black/60 uppercase">{pkg.label}</span>
                  <div className="my-2">
                    <span className="text-2xl font-black text-black">₹{pkg.amount.toLocaleString()}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">+{pkg.credits.toLocaleString()} Credits</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-3 border-2 border-black rounded-xl font-bold text-sm bg-white hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTopUp}
                className="flex-1 py-3 bg-[#111111] text-white rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FF4C29] transition-all"
              >
                Pay ₹{selectedTopUpAmount.toLocaleString()} & Add Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
