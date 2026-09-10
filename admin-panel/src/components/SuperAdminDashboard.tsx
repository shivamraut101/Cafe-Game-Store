"use client";

import React, { useState, useEffect } from "react";
import { TierLevel } from "./SubscriptionPlanCard";
import { logAction } from "../lib/auditLogger";
import CreateStoreModal from "./CreateStoreModal";
import CustomDropdown from "./CustomDropdown";
import {
  getSuperAdminMerchantsAction,
  updateStorePlanAction,
  updateStoreWhiteLabelAction,
  grantStoreCreditsAction,
  getTopUpRequestsAction,
  approveTopUpRequestAction,
  rejectTopUpRequestAction,
} from "../app/actions/adminActions";
import { updateStoreAdminPinAction } from "../app/actions/authActions";
import { downloadCSV } from "../lib/csvExport";

export interface MerchantAccount {
  id: string;
  storeName: string;
  ownerEmail: string;
  plan: TierLevel;
  status: "Active" | "Trialing" | "Suspended";
  walletBalance: number;
  totalScans: number;
  joinedDate: string;
  whiteLabelOverride: boolean;
  watermarkRemoved: boolean;
  churnRisk: "Low" | "Medium" | "High";
  aiCreditsUsed: number;
  adminPin?: string;
}

interface SuperAdminDashboardProps {
  onImpersonateStore?: (storeName: string, tier: TierLevel) => void;
  onCreateStore?: () => void;
}

export default function SuperAdminDashboard({
  onImpersonateStore,
  onCreateStore,
}: SuperAdminDashboardProps) {
  const [merchants, setMerchants] = useState<MerchantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMerchantForCredits, setSelectedMerchantForCredits] = useState<MerchantAccount | null>(null);
  const [creditAddAmount, setCreditAddAmount] = useState(500);
  const [grantMethod, setGrantMethod] = useState<"bank_transfer" | "upi" | "cash" | "complimentary">("bank_transfer");
  const [grantRefId, setGrantRefId] = useState("");
  const [grantNotes, setGrantNotes] = useState("");
  const [grantingLoading, setGrantingLoading] = useState(false);

  // Top-Up Requests State
  const [topUpRequests, setTopUpRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  useEffect(() => {
    fetchMerchants();
    fetchRequests();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await getSuperAdminMerchantsAction();
      if (res.success && res.merchants) {
        setMerchants(res.merchants as any);
      }
    } catch (e) {
      console.error("Failed to load merchants from DB", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await getTopUpRequestsAction();
      if (res.success && res.requests) {
        setTopUpRequests(res.requests);
      }
    } catch (e) {
      console.error("Failed to load top up requests", e);
    } finally {
      setRequestsLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(
    m =>
      m.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStoreCreated = (newStore: MerchantAccount) => {
    setMerchants([newStore, ...merchants]);
  };

  const handlePlanChange = async (id: string, newPlan: TierLevel) => {
    const targetStore = merchants.find(m => m.id === id);
    setMerchants(prev =>
      prev.map(m => (m.id === id ? { ...m, plan: newPlan } : m))
    );

    try {
      await updateStorePlanAction(id, newPlan as any);
    } catch (err) {
      console.error("Failed to persist plan change", err);
    }
  };

  const handleToggleWhiteLabel = async (id: string) => {
    const targetStore = merchants.find(m => m.id === id);
    if (!targetStore) return;

    const newVal = !targetStore.whiteLabelOverride;
    setMerchants(prev =>
      prev.map(m =>
        m.id === id ? { ...m, whiteLabelOverride: newVal } : m
      )
    );

    try {
      await updateStoreWhiteLabelAction(id, { whiteLabelOverride: newVal });
    } catch (err) {
      console.error("Failed to persist white label toggle", err);
    }
  };

  const handleToggleWatermark = async (id: string) => {
    const targetStore = merchants.find(m => m.id === id);
    if (!targetStore) return;

    const newVal = !targetStore.watermarkRemoved;
    setMerchants(prev =>
      prev.map(m =>
        m.id === id ? { ...m, watermarkRemoved: newVal } : m
      )
    );

    try {
      await updateStoreWhiteLabelAction(id, { watermarkRemoved: newVal });
    } catch (err) {
      console.error("Failed to persist watermark toggle", err);
    }
  };

  const handleResetPin = async (storeName: string) => {
    const newPin = prompt(`Enter new secret PIN for "${storeName}" (Min 4 chars):`, "9900");
    if (!newPin || newPin.trim().length < 4) return;
    try {
      const res = await updateStoreAdminPinAction(storeName, newPin.trim());
      if (res.success) {
        setMerchants(prev =>
          prev.map(m => (m.storeName === storeName ? { ...m, adminPin: newPin.trim() } : m))
        );
        alert(`✓ PIN for "${storeName}" updated to: ${newPin.trim()}`);
      } else {
        alert(res.error || "Failed to update PIN");
      }
    } catch {
      alert("Network error updating PIN");
    }
  };

  const handleGrantCredits = async () => {
    if (!selectedMerchantForCredits) return;

    try {
      setGrantingLoading(true);
      const res = await grantStoreCreditsAction({
        storeId: selectedMerchantForCredits.id,
        amount: creditAddAmount,
        paymentMethod: grantMethod,
        referenceId: grantRefId.trim(),
        notes: grantNotes.trim(),
      });

      if (res.success) {
        setMerchants(prev =>
          prev.map(m =>
            m.id === selectedMerchantForCredits.id
              ? { ...m, walletBalance: (m.walletBalance || 0) + creditAddAmount }
              : m
          )
        );
        setSelectedMerchantForCredits(null);
        setGrantRefId("");
        setGrantNotes("");
      } else {
        alert(res.error || "Failed to grant credits.");
      }
    } catch (err) {
      alert("Network error granting credits.");
    } finally {
      setGrantingLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setActioningId(requestId);
      const res = await approveTopUpRequestAction(requestId);
      if (res.success) {
        await Promise.all([fetchRequests(), fetchMerchants()]);
      } else {
        alert(res.error || "Failed to approve request.");
      }
    } catch (err) {
      alert("Network error approving request.");
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt("Enter rejection reason (optional):") || "Unverified payment reference";
    try {
      setActioningId(requestId);
      const res = await rejectTopUpRequestAction(requestId, reason);
      if (res.success) {
        await fetchRequests();
      } else {
        alert(res.error || "Failed to reject request.");
      }
    } catch {
      alert("Network error rejecting request.");
    } finally {
      setActioningId(null);
    }
  };

  const handleExportTopUpsCSV = () => {
    if (topUpRequests.length === 0) return;
    const headers = ["Date", "Store Name", "Credits Requested", "Amount (INR)", "Payment Method", "UTR / Ref ID", "Status", "Admin Note"];
    const rows = topUpRequests.map((r) => [
      r.createdAt ? r.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10),
      r.storeName,
      r.creditsRequested,
      r.amountInINR,
      r.paymentMethod.toUpperCase(),
      r.referenceId,
      r.status.toUpperCase(),
      r.adminNote || "",
    ]);
    downloadCSV("All_Store_TopUp_Requests", headers, rows);
  };

  const handleExportMerchantsCSV = () => {
    if (merchants.length === 0) return;
    const headers = ["Store Name", "Owner Email", "Plan", "Status", "Wallet Balance", "Total Scans", "Churn Risk", "Joined Date", "White-Label", "No-Watermark"];
    const rows = merchants.map((m) => [
      m.storeName,
      m.ownerEmail,
      m.plan,
      m.status,
      m.walletBalance,
      m.totalScans,
      m.churnRisk,
      m.joinedDate,
      m.whiteLabelOverride ? "YES" : "NO",
      m.watermarkRemoved ? "YES" : "NO",
    ]);
    downloadCSV("ForStore_Merchants_Directory", headers, rows);
  };

  // Computations directly from active MongoDB database state
  const totalMRR = merchants.reduce((sum, m) => sum + (m.plan === "Enterprise" ? 7999 : m.plan === "Pro Store" ? 2499 : 0), 0);
  const totalWalletCredits = merchants.reduce((sum, m) => sum + (m.walletBalance || 0), 0);
  const highRiskStore = merchants.find(m => m.churnRisk === "High" || m.status === "Suspended");
  const healthScore = Math.max(75, 100 - merchants.filter(m => m.churnRisk === "High").length * 8);

  const pendingRequests = topUpRequests.filter(r => r.status === "pending");

  return (
    <div className="flex flex-col gap-8 pb-12 select-none">
      {/* Top Welcome & Actions Header */}
      <div className="bg-[#111111] text-white rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <h1 className="font-serif text-2xl font-black">Super Admin Platform Control Center</h1>
          </div>
          <p className="text-white/70 text-sm mt-1">
            Global SaaS metrics, merchant subscription controls, and credit overrides across all stores.
          </p>
        </div>

        <button
          onClick={() => setIsCreateStoreOpen(true)}
          className="bg-[#FF4C29] text-white font-bold px-5 py-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FFFFFF] hover:translate-y-[1px] transition-all text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          🏪 + Provision New Store
        </button>
      </div>

      {/* Dynamic Fraud Detection Alert (if any high risk store exists in DB) */}
      {!dismissedAlert && highRiskStore && (
        <div className="bg-red-50 border-4 border-red-600 rounded-2xl p-6 shadow-[6px_6px_0px_0px_#DC2626]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl animate-pulse">🚨</span>
            <h2 className="font-serif text-xl font-black text-red-900 uppercase tracking-wide">AI Security & Risk Alert</h2>
          </div>
          <div className="bg-white rounded-xl border-2 border-red-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-bold text-red-900">Abnormal Scan Velocity / High Churn Risk</h4>
              <p className="text-sm font-semibold text-red-700/80 mt-1">
                Store <strong className="text-red-950">{highRiskStore.storeName}</strong> has elevated risk parameters in MongoDB Atlas. Review store activity.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlanChange(highRiskStore.id, "Starter")}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm border-2 border-red-900 shadow-[2px_2px_0px_0px_#7F1D1D] hover:translate-y-[1px] transition-all whitespace-nowrap cursor-pointer"
              >
                Restrict Store
              </button>
              <button
                onClick={() => setDismissedAlert(true)}
                className="bg-white text-red-900 px-4 py-2 rounded-lg font-bold text-sm border-2 border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global SaaS Platform Metrics Row (Dynamic DB Computations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29] min-h-[120px] flex flex-col justify-between">
          <p className="text-xs font-bold text-black/50 tracking-wider">PLATFORM MRR</p>
          {loading ? (
            <div className="h-8 w-24 bg-black/10 animate-pulse rounded-lg mt-1" />
          ) : (
            <h3 className="font-serif text-3xl font-black mt-1 text-black">₹{totalMRR.toLocaleString()}</h3>
          )}
          <span className="text-emerald-700 text-xs font-bold block mt-2">Live from DB Merchant Plans</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#8B5CF6] min-h-[120px] flex flex-col justify-between">
          <p className="text-xs font-bold text-black/50 tracking-wider">TOTAL MERCHANTS</p>
          {loading ? (
            <div className="h-8 w-24 bg-black/10 animate-pulse rounded-lg mt-1" />
          ) : (
            <h3 className="font-serif text-3xl font-black mt-1 text-black">{merchants.length} Stores</h3>
          )}
          <span className="text-black/60 text-xs font-bold block mt-2">
            {loading ? "..." : `${merchants.filter(m => m.status === "Active").length} Active in Atlas DB`}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981] min-h-[120px] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-black/50 tracking-wider">PLATFORM HEALTH</p>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-300">AI SCORE</span>
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-black/10 animate-pulse rounded-lg mt-1" />
          ) : (
            <h3 className="font-serif text-3xl font-black mt-1 text-black">{healthScore}/100</h3>
          )}
          <span className="text-emerald-700 text-xs font-bold block mt-2">Calculated from Atlas stores</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#F59E0B] min-h-[120px] flex flex-col justify-between">
          <p className="text-xs font-bold text-black/50 tracking-wider">WALLET CREDITS SOLD</p>
          {loading ? (
            <div className="h-8 w-24 bg-black/10 animate-pulse rounded-lg mt-1" />
          ) : (
            <h3 className="font-serif text-3xl font-black mt-1 text-black">⚡ {totalWalletCredits.toLocaleString()}</h3>
          )}
          <span className="text-black/60 text-xs font-bold block mt-2">Total prepaid balances in DB</span>
        </div>
      </div>

      {/* Pending Bank Transfer & UPI Payment Approvals */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#332FD0]">
        <div className="bg-[#F6F3EB] p-5 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-black">
                  Direct Bank Transfer & UPI Payment Requests
                </h2>
                {pendingRequests.length > 0 && (
                  <span className="bg-[#FF4C29] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    {pendingRequests.length} PENDING APPROVAL
                  </span>
                )}
              </div>
              <p className="text-xs text-black/60">
                Review UTR reference numbers submitted by store owners and approve scan credits with 1-click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExportTopUpsCSV}
              className="text-xs font-bold text-black bg-white border-2 border-black px-3 py-1.5 rounded-xl hover:bg-black/5 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            >
              📥 Export CSV
            </button>
            <button
              onClick={fetchRequests}
              className="text-xs font-bold text-black bg-white border-2 border-black px-3 py-1.5 rounded-xl hover:bg-black/5 cursor-pointer"
            >
              ↻ Refresh Requests
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Store Name</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">UTR / Transaction Ref</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-sm">
              {requestsLoading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs font-bold text-black/40">
                    Checking payment requests...
                  </td>
                </tr>
              ) : topUpRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs font-bold text-black/40">
                    No payment requests submitted yet. When a store submits a bank wire or UPI UTR, it will appear here.
                  </td>
                </tr>
              ) : (
                topUpRequests.map((req) => (
                  <tr key={req.id} className={req.status === "pending" ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-black/[0.02]"}>
                    <td className="p-4 pl-6 text-black/60 font-mono text-xs">
                      {req.createdAt ? req.createdAt.substring(0, 10) : "Today"}
                    </td>
                    <td className="p-4 font-bold text-black">{req.storeName}</td>
                    <td className="p-4 font-mono font-bold text-emerald-700">+{req.creditsRequested.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold">₹{req.amountInINR}</td>
                    <td className="p-4 uppercase text-xs font-bold">
                      <span className="px-2 py-0.5 rounded bg-black/5 border border-black/10">
                        {req.paymentMethod === "upi" ? "UPI" : "Bank Wire"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-black text-blue-700 select-all">
                      {req.referenceId}
                    </td>
                    <td className="p-4">
                      {req.status === "approved" ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          ✓ Credited
                        </span>
                      ) : req.status === "rejected" ? (
                        <span className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                          ✕ Rejected
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {req.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={actioningId === req.id}
                            className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-black hover:bg-emerald-700 shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50"
                          >
                            {actioningId === req.id ? "Approving..." : "✓ Approve & Credit"}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={actioningId === req.id}
                            className="bg-white text-red-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-red-300 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-black/40 font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Management Directory Table */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#000000]">
        <div className="bg-black/5 p-5 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-black">Subscribed Merchant Stores Directory</h2>
            <p className="text-xs text-black/60">Manage plans, credit balances, and feature overrides for store owners.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportMerchantsCSV}
              className="text-xs font-bold text-black bg-white border-2 border-black px-3 py-2.5 rounded-xl hover:bg-black/5 shadow-[2px_2px_0px_0px_#000] cursor-pointer whitespace-nowrap"
            >
              📥 Export Directory CSV
            </button>
            <input
              type="text"
              placeholder="Search store name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-2.5 rounded-xl border-2 border-black bg-white text-xs font-semibold focus:outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-[#FBF9F4] text-xs font-bold uppercase tracking-wider text-black">
                <th className="p-4 pl-6">Merchant Store</th>
                <th className="p-4">Subscription Tier</th>
                <th className="p-4">Churn Risk</th>
                <th className="p-4">Status</th>
                <th className="p-4">Portal PIN</th>
                <th className="p-4">AI Credits Used</th>
                <th className="p-4">Feature Overrides</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs font-bold text-black/40">
                    Loading merchants from MongoDB Atlas...
                  </td>
                </tr>
              ) : filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs font-bold text-black/40">
                    No merchant stores found in database.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map(merchant => (
                  <tr key={merchant.id} className="hover:bg-black/[0.02]">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-black">{merchant.storeName}</div>
                      <div className="text-xs text-black/60 font-mono">{merchant.ownerEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="w-48 text-xs font-bold">
                        <CustomDropdown
                          options={["Starter", "Pro Store", "Enterprise"]}
                          value={merchant.plan}
                          onChange={(val) => handlePlanChange(merchant.id, val as TierLevel)}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          merchant.churnRisk === "High"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : merchant.churnRisk === "Medium"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        {merchant.churnRisk}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          merchant.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : merchant.status === "Trialing"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-black/5 border border-black/10 px-2 py-0.5 rounded font-black text-[#FF4C29]">
                          {merchant.adminPin || "9900"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResetPin(merchant.storeName)}
                          title="Reset Store PIN"
                          className="text-[11px] text-black/40 hover:text-black font-bold p-1 cursor-pointer"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold">{merchant.aiCreditsUsed || 0}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={merchant.whiteLabelOverride}
                            onChange={() => handleToggleWhiteLabel(merchant.id)}
                            className="rounded border-black text-[#FF4C29]"
                          />
                          <span>White-Label</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={merchant.watermarkRemoved}
                            onChange={() => handleToggleWatermark(merchant.id)}
                            className="rounded border-black text-[#FF4C29]"
                          />
                          <span>No Watermark</span>
                        </label>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMerchantForCredits(merchant)}
                          className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#FF4C29] transition-colors"
                        >
                          + Credits
                        </button>
                        {onImpersonateStore && (
                          <button
                            onClick={() => onImpersonateStore(merchant.storeName, merchant.plan)}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                          >
                            Impersonate 👁️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Credits Modal */}
      {selectedMerchantForCredits && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-black rounded-3xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚡</span>
              <h3 className="font-serif text-xl font-bold text-black">Grant Scan Credits</h3>
            </div>
            <p className="text-xs text-black/60 mb-4">
              Add bonus or bank-funded scan credits to <strong>{selectedMerchantForCredits.storeName}</strong> in MongoDB.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-xs font-bold uppercase text-black/60 mb-1">Credit Amount</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={creditAddAmount}
                  onChange={e => setCreditAddAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border-2 border-black font-mono text-lg font-bold bg-[#FBF9F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-black/60 mb-1">Payment Method</label>
                <select
                  value={grantMethod}
                  onChange={e => setGrantMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border-2 border-black text-xs font-bold bg-white"
                >
                  <option value="bank_transfer">Direct Bank Transfer / Wire (NEFT/IMPS)</option>
                  <option value="upi">UPI / QR Payment</option>
                  <option value="cash">Cash / Direct Settlement</option>
                  <option value="complimentary">Complimentary / Promotional Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-black/60 mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={grantRefId}
                  onChange={e => setGrantRefId(e.target.value)}
                  placeholder="e.g. UTR10294829 / UPI Ref #"
                  className="w-full p-2.5 rounded-xl border-2 border-black font-mono text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-black/60 mb-1">
                  Internal Accounting Note
                </label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={e => setGrantNotes(e.target.value)}
                  placeholder="e.g. Verified payment in HDFC statement"
                  className="w-full p-2.5 rounded-xl border-2 border-black text-xs font-semibold bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={grantingLoading}
                onClick={() => setSelectedMerchantForCredits(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black/60 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={grantingLoading}
                onClick={handleGrantCredits}
                className="bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#FF4C29] cursor-pointer disabled:opacity-50"
              >
                {grantingLoading ? "Granting Credits..." : "Confirm & Save to DB 💾"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={isCreateStoreOpen}
        onClose={() => setIsCreateStoreOpen(false)}
        onStoreCreated={handleStoreCreated}
      />
    </div>
  );
}
