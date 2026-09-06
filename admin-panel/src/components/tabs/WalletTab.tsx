"use client";

import React, { useState, useEffect } from "react";
import {
  getStoreWalletAction,
  submitTopUpRequestAction,
  getTopUpRequestsAction,
} from "../../app/actions/adminActions";
import { downloadCSV } from "../../lib/csvExport";

interface WalletTabProps {
  storeName?: string;
}

export default function WalletTab({ storeName: currentStoreName }: WalletTabProps) {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [aiCreditsUsed, setAiCreditsUsed] = useState<number>(0);
  const [totalPlays, setTotalPlays] = useState<number>(0);
  const [sponsoredPlays, setSponsoredPlays] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Up Modal State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ credits: number; inr: number; usd: number }>({
    credits: 2000,
    inr: 1600,
    usd: 32,
  });
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer">("upi");
  const [referenceId, setReferenceId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletData();
    fetchRequests();
  }, [currentStoreName]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await getStoreWalletAction(currentStoreName);
      if (res.success && res.wallet) {
        setWalletBalance(res.wallet.walletBalance || 0);
        setAiCreditsUsed(res.wallet.aiCreditsUsed || 0);
        setTotalPlays(res.wallet.totalPlays || 0);
        setSponsoredPlays(res.wallet.sponsoredPlays || 0);
        setTransactions(res.wallet.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load wallet data from DB", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRequestsCSV = () => {
    if (topUpRequests.length === 0) return;
    const headers = ["Date", "Credits Requested", "Amount (INR)", "Payment Method", "UTR / Ref ID", "Status", "Admin Note"];
    const rows = topUpRequests.map((r) => [
      r.createdAt ? r.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
      r.creditsRequested,
      r.amountInINR,
      r.paymentMethod.toUpperCase(),
      r.referenceId,
      r.status.toUpperCase(),
      r.adminNote || "",
    ]);
    downloadCSV(`TopUp_Requests_${(currentStoreName || "store").replace(/[^a-zA-Z0-9]/g, "_")}`, headers, rows);
  };

  const handleExportTransactionsCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Description", "Credits Added/Deducted", "Balance After"];
    const rows = transactions.map((tx) => [
      tx.date ? new Date(tx.date).toLocaleDateString() : "",
      tx.description,
      tx.amount,
      tx.balanceAfter,
    ]);
    downloadCSV(`Transactions_${(currentStoreName || "store").replace(/[^a-zA-Z0-9]/g, "_")}`, headers, rows);
  };

  const fetchRequests = async () => {
    try {
      const res = await getTopUpRequestsAction(currentStoreName);
      if (res.success && res.requests) {
        setTopUpRequests(res.requests);
      }
    } catch (e) {
      console.error("Failed to load top up requests", e);
    }
  };

  const handleSubmitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId.trim()) {
      setSubmitError("Please enter your Bank UTR or UPI Transaction Reference Number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const res = await submitTopUpRequestAction({
        storeName: currentStoreName,
        creditsRequested: selectedPackage.credits,
        amountInINR: selectedPackage.inr,
        paymentMethod,
        referenceId: referenceId.trim(),
        notes: paymentNote.trim(),
      });

      if (!res.success) {
        setSubmitError(res.error || "Failed to submit request.");
      } else {
        setSubmitSuccess(
          `Request submitted successfully! Reference: ${referenceId.trim()}. Super Admin will verify and activate credits shortly.`
        );
        setReferenceId("");
        setPaymentNote("");
        fetchRequests();
      }
    } catch (err: any) {
      setSubmitError(err.message || "Network error submitting top-up request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingGenerations = Math.floor(walletBalance / 50);

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎮</span>
            <h2 className="font-serif text-3xl font-bold text-black">Game Play Credits & Wallet</h2>
          </div>
          <p className="text-sm font-semibold text-black/60">
            Pay-Per-Play credit wallet for {currentStoreName || "your store"}. Top up anytime via Direct Bank Transfer or UPI.
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitSuccess(null);
            setSubmitError(null);
            setIsTopUpModalOpen(true);
          }}
          className="bg-[#111111] text-[#ffffff] px-6 py-3 rounded-xl font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>⚡</span> Top Up via Bank / UPI
        </button>
      </div>

      {/* Pay-Per-Play Model & Fair Cap Protection Banner */}
      <div className="bg-[#FFFBEB] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_#F59E0B] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000] shrink-0">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-black text-white text-[10px] font-black uppercase rounded-full tracking-wider">
                PAY-PER-PLAY MODEL
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase rounded-full">
                10-PLAY FAIR CAP PROTECTION
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold text-black mt-1">
              Never Overpay for Addictive Gamers
            </h3>
            <p className="text-xs text-black/70 font-semibold mt-1 max-w-2xl leading-relaxed">
              Your store only pays <strong>1 credit per customer game play</strong> for the first <strong>10 plays per customer each day</strong>.
              From play 11 onwards for that same customer on the same day, <strong>the cost is 100% on us (Platform Courtesy)</strong>! Your store wallet is never drained.
            </p>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <div className="bg-white border-2 border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0px_0px_#000] text-center">
            <span className="text-[10px] font-bold text-black/50 uppercase block">Store Billed Cap</span>
            <span className="font-mono text-sm font-black text-black">10 Plays/Day</span>
          </div>
          <div className="bg-emerald-400 border-2 border-black rounded-2xl px-4 py-2.5 shadow-[3px_3px_0px_0px_#000] text-center">
            <span className="text-[10px] font-bold text-black uppercase block">Plays 11+ Free</span>
            <span className="font-mono text-sm font-black text-black">Cost on Us 🎁</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-[#FBF9F4] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000000] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-black/50">Current Credit Balance</span>
            <div className="flex items-baseline gap-2">
              {loading ? (
                <div className="h-14 w-36 bg-black/10 animate-pulse rounded-xl" />
              ) : (
                <>
                  <span className="text-6xl font-black tracking-tight text-black">{walletBalance.toLocaleString()}</span>
                  <span className="text-2xl font-bold text-black/40">Credits</span>
                </>
              )}
            </div>
            <p className="text-sm font-semibold text-black/60 mt-1">
              Supports roughly <span className="text-black font-black">~{walletBalance.toLocaleString()}</span> customer game plays.
              ({aiCreditsUsed} credits billed • {sponsoredPlays} platform sponsored plays on us)
            </p>
          </div>

          <div className="w-full md:w-1/3 bg-white border-2 border-black rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">Credit Packages</h4>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                Direct Bank / UPI
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setSelectedPackage({ credits: 500, inr: 500, usd: 10 });
                  setIsTopUpModalOpen(true);
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl border-2 border-black/10 hover:border-black hover:bg-[#FBF9F4] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>🪙</span> 500 Plays
                </div>
                <span className="font-bold bg-black text-white px-3 py-1 rounded-lg text-xs group-hover:bg-[#FF4C29] transition-colors">
                  ₹500 ($10)
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedPackage({ credits: 2000, inr: 1600, usd: 32 });
                  setIsTopUpModalOpen(true);
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl border-2 border-black/10 hover:border-black hover:bg-amber-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>💰</span> 2,000 Plays
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Save 20%</span>
                  <span className="font-bold bg-black text-white px-3 py-1 rounded-lg text-xs group-hover:bg-[#FF4C29] transition-colors">
                    ₹1,600 ($32)
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedPackage({ credits: 5000, inr: 3500, usd: 70 });
                  setIsTopUpModalOpen(true);
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl border-2 border-black/10 hover:border-black hover:bg-purple-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>🚀</span> 5,000 Plays
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Save 30%</span>
                  <span className="font-bold bg-black text-white px-3 py-1 rounded-lg text-xs group-hover:bg-[#FF4C29] transition-colors">
                    ₹3,500 ($70)
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Up Requests Ledger (Bank / UPI Submissions) */}
      {topUpRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold text-black flex items-center gap-2">
              <span>📋</span> Pending & Recent Payment Requests
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportRequestsCSV}
                className="text-xs font-bold text-black bg-[#FBF9F4] border-2 border-black px-3 py-1.5 rounded-xl hover:bg-black/5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                📥 Export CSV
              </button>
              <span className="text-xs font-bold text-black/50 hidden sm:inline">Auto-updates on Super Admin approval</span>
            </div>
          </div>
          <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black/70">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Package</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">UTR / Ref #</th>
                    <th className="p-4 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 text-sm font-semibold">
                  {topUpRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-black/[0.02]">
                      <td className="p-4 pl-6 text-black/60 font-mono text-xs">
                        {req.createdAt ? req.createdAt.substring(0, 10) : "Today"}
                      </td>
                      <td className="p-4 font-bold text-black">+{req.creditsRequested.toLocaleString()} Credits</td>
                      <td className="p-4 font-mono font-bold">₹{req.amountInINR}</td>
                      <td className="p-4 uppercase text-xs font-bold">
                        <span className="px-2 py-0.5 rounded bg-black/5 border border-black/10">
                          {req.paymentMethod === "upi" ? "UPI" : "Bank Wire"}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-blue-700">{req.referenceId}</td>
                      <td className="p-4 pr-6 text-right">
                        {req.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full">
                            ✓ Approved & Credited
                          </span>
                        ) : req.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 rounded-full">
                            ✕ Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse">
                            ⏳ Pending Verification
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History (Live DB) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold text-black">Transaction History (Live DB)</h3>
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportTransactionsCSV}
              className="text-xs font-bold text-black bg-[#FBF9F4] border-2 border-black px-3 py-1.5 rounded-xl hover:bg-black/5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              📥 Export CSV
            </button>
          )}
        </div>
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs font-bold text-black/40">
                      Loading transactions from MongoDB Atlas...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs font-bold text-black/40">
                      No wallet transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-black/[0.02]">
                      <td className="p-4 pl-6 text-black/60 font-mono text-xs">{tx.date}</td>
                      <td className="p-4 text-black">{tx.desc}</td>
                      <td className="p-4 text-right font-mono font-bold">
                        {tx.isFree ? (
                          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full border border-purple-300 font-bold">
                            🎁 0 (COST ON US)
                          </span>
                        ) : (
                          <span className={tx.isPositive ? "text-emerald-600" : "text-red-500"}>
                            {tx.isPositive ? "+" : ""}{tx.amount}
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right text-black/50 font-mono">{tx.balance}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bank Transfer & UPI Modal */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#F6F3EB] rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-6 sm:p-8 max-w-lg w-full relative my-8">
            <button
              onClick={() => setIsTopUpModalOpen(false)}
              className="absolute top-5 right-5 font-bold text-xl hover:text-black/70 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-white cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h2 className="font-serif text-2xl font-black text-black">Top Up Game Play Credits</h2>
            </div>
            <p className="text-xs text-black/60 mb-5">
              Direct transfer via UPI or NEFT/IMPS Bank Wire. 1 Credit = 1 Game Play (Plays 11+ per user/day are free on us!). Enter your UTR reference ID below to activate credits immediately.
            </p>

            {/* Step 1: Package Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">
                1. Select Credit Package
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { credits: 500, inr: 500, usd: 10, label: "Starter" },
                  { credits: 2000, inr: 1600, usd: 32, label: "Popular", highlight: true },
                  { credits: 5000, inr: 3500, usd: 70, label: "Pro Value" },
                ].map((pkg) => (
                  <button
                    key={pkg.credits}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-3 rounded-2xl border-2 font-bold text-left transition-all cursor-pointer ${
                      selectedPackage.credits === pkg.credits
                        ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#FF4C29]"
                        : "bg-white text-black border-black hover:bg-black/5"
                    }`}
                  >
                    <div className="text-xs opacity-70">{pkg.label}</div>
                    <div className="text-sm font-black">{pkg.credits} Credits</div>
                    <div className="text-xs font-mono mt-0.5">₹{pkg.inr}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Payment Method Switcher */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-black/70 mb-2">
                2. Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={`py-3 rounded-xl font-black text-xs border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === "upi"
                      ? "bg-[#332FD0] text-white shadow-[2px_2px_0px_0px_#000]"
                      : "bg-white text-black hover:bg-black/5"
                  }`}
                >
                  <span>📱</span> UPI / GPay / PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`py-3 rounded-xl font-black text-xs border-2 border-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]"
                      : "bg-white text-black hover:bg-black/5"
                  }`}
                >
                  <span>🏦</span> Direct Bank Transfer
                </button>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white border-3 border-black rounded-2xl p-4 mb-5 shadow-[4px_4px_0px_0px_#000000]">
              {paymentMethod === "upi" ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Visual QR Code Box */}
                  <div className="w-28 h-28 bg-[#FBF9F4] border-2 border-black rounded-xl p-2 flex flex-col items-center justify-center shrink-0 shadow-sm text-center">
                    <div className="w-full h-full bg-white border border-black/20 rounded flex flex-col items-center justify-center text-xs font-mono font-bold text-black p-1">
                      <span className="text-2xl mb-0.5">📲</span>
                      <span className="text-[9px] leading-tight">SCAN ANY UPI APP</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full text-left">
                    <div className="text-[11px] font-bold uppercase text-black/50">Official ForStore UPI ID</div>
                    <div className="font-mono text-sm font-black text-black bg-[#FBF9F4] p-2 rounded-lg border border-black/20 select-all my-1 flex items-center justify-between">
                      <span>forstore@hdfcbank</span>
                      <span className="text-[10px] text-black/40 uppercase">Copy</span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/60">
                      Amount to Pay: <span className="font-black text-black font-mono">₹{selectedPackage.inr}</span>. Supported on GPay, PhonePe, Paytm, or BHIM.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-left flex flex-col gap-1.5 text-xs font-semibold text-black">
                  <div className="text-[11px] font-bold uppercase text-black/50 mb-1">Company Bank Account Details</div>
                  <div className="grid grid-cols-2 gap-2 bg-[#FBF9F4] p-2.5 rounded-xl border border-black/20 font-mono text-[11px]">
                    <div>
                      <span className="text-black/50 block text-[10px]">Beneficiary Name</span>
                      <span className="font-black text-black">ForStore Tech Pvt Ltd</span>
                    </div>
                    <div>
                      <span className="text-black/50 block text-[10px]">Bank Name</span>
                      <span className="font-black text-black">HDFC Bank Ltd</span>
                    </div>
                    <div>
                      <span className="text-black/50 block text-[10px]">Account Number</span>
                      <span className="font-black text-black">50200088991122</span>
                    </div>
                    <div>
                      <span className="text-black/50 block text-[10px]">IFSC Code</span>
                      <span className="font-black text-black">HDFC0001234</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-black/60 mt-1">
                    Amount to wire: <span className="font-black text-black font-mono">₹{selectedPackage.inr}</span> via NEFT, RTGS, or IMPS.
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Reference Form */}
            <form onSubmit={handleSubmitTopUp} className="flex flex-col gap-3 text-left">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1">
                  3. Enter Bank UTR / UPI Transaction Reference ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                  placeholder={paymentMethod === "upi" ? "e.g. 423819284192 (12-digit UPI Ref)" : "e.g. UTR / IMPS12948194"}
                  className="w-full p-3 rounded-xl border-2 border-black bg-white font-mono text-sm font-black focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-1">
                  Optional Note / Sender Info
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Paid via HDFC App from BrewBites account"
                  className="w-full p-2.5 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none shadow-[2px_2px_0px_0px_#000]"
                />
              </div>

              {submitError && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 p-2.5 rounded-xl text-xs font-bold">
                  ⚠️ {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-800 p-2.5 rounded-xl text-xs font-bold">
                  ✅ {submitSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer mt-1 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Reference..." : "SUBMIT PAYMENT REFERENCE FOR APPROVAL 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

