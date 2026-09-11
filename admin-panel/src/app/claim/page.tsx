"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { redeemRewardVoucherAction } from "../actions/gameActions";
import { getSessionAction, loginAction, logoutAction } from "../actions/authActions";
import { verifyStoreStaffPinAction, getStoreStaffConfigAction } from "../actions/staffActions";
import { downloadCSV } from "../../lib/csvExport";
import { isClientProd } from "../../lib/appEnv";

interface RedeemedRecord {
  claimCode: string;
  rewardName: string;
  customerName: string;
  staffName: string;
  redeemedAt: string;
}

export default function StaffVoucherLookupPortal() {
  // Auth & Session state
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auth Mode: Staff Counter PIN vs Store Manager Login
  const [authMode, setAuthMode] = useState<"staff_pin" | "manager_login">("staff_pin");
  const [staffPinInput, setStaffPinInput] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffName, setSelectedStaffName] = useState("Rohan Sharma");

  // Login form state for unauthenticated manager
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Staff on Duty
  const [activeStaffName, setActiveStaffName] = useState("Cashier Counter #01");
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Voucher Lookup State
  const [inputCode, setInputCode] = useState("");
  const [billAmountInput, setBillAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Shift Redemption History
  const [recentRedemptions, setRecentRedemptions] = useState<RedeemedRecord[]>([]);

  // 1. Check active session on mount
  useEffect(() => {
    checkSession();
    async function loadStaff() {
      try {
        const res = await getStoreStaffConfigAction();
        if (res.success && res.staffMembers) {
          setStaffList(res.staffMembers);
          if (res.staffMembers.length > 0) {
            setSelectedStaffName(res.staffMembers[0].name);
          }
        }
      } catch {}
    }
    loadStaff();
  }, []);

  const checkSession = async () => {
    try {
      setCheckingAuth(true);

      // Check stored staff session
      const savedStaff = sessionStorage.getItem("forstore_active_staff_session");
      if (savedStaff) {
        try {
          const parsed = JSON.parse(savedStaff);
          if (parsed && parsed.staffName) {
            setSession({
              authenticated: true,
              user: { role: "store_staff", name: parsed.staffName, storeName: parsed.storeName },
            });
            setActiveStaffName(parsed.staffName);
            setCheckingAuth(false);
            return;
          }
        } catch {}
      }

      const res = await getSessionAction();
      if (res.authenticated && res.user) {
        setSession(res);
        setActiveStaffName(res.user.name || "Manager Staff");
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Load recent redemptions from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("forstore_recent_redemptions");
      if (saved) {
        setRecentRedemptions(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const addRecentRedemption = (record: RedeemedRecord) => {
    const updated = [record, ...recentRedemptions.slice(0, 19)];
    setRecentRedemptions(updated);
    try {
      sessionStorage.setItem("forstore_recent_redemptions", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleExportShiftCSV = () => {
    if (recentRedemptions.length === 0) return;
    const headers = ["Claim Code", "Reward Name", "Customer Name", "Redeemed By Staff", "Redeemed Time"];
    const rows = recentRedemptions.map((r) => [
      r.claimCode,
      r.rewardName,
      r.customerName,
      r.staffName,
      r.redeemedAt,
    ]);
    downloadCSV(`Shift_Redemptions_${new Date().toISOString().substring(0, 10)}`, headers, rows);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await loginAction({
        email: loginEmail,
        password: loginPassword,
      });

      if (!res.success) {
        setLoginError(res.error || "Login failed. Please verify credentials.");
      } else {
        await checkSession();
      }
    } catch {
      setLoginError("Network error logging in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffPinLogin = async (customPin?: string, customStaffName?: string) => {
    const pin = (customPin || staffPinInput).trim();
    const staffName = customStaffName || selectedStaffName || "Counter Cashier #01";
    if (!pin) {
      setLoginError("Please enter your 4-digit Staff PIN.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await verifyStoreStaffPinAction({
        enteredPin: pin,
        staffMemberName: staffName,
      });

      if (!res.success) {
        setLoginError(res.error || "Invalid Counter Staff PIN.");
        return;
      }

      const staffSessionObj = {
        staffName: res.activeStaffName || staffName,
        storeName: res.storeName || "Brew & Bites Cafe",
      };
      sessionStorage.setItem("forstore_active_staff_session", JSON.stringify(staffSessionObj));

      setSession({
        authenticated: true,
        user: { role: "store_staff", name: staffSessionObj.staffName, storeName: staffSessionObj.storeName },
      });
      setActiveStaffName(staffSessionObj.staffName);
    } catch (e: any) {
      setLoginError("Failed to verify PIN. Check your connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    if (isClientProd()) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await loginAction({
        email: "manager@brewbites.com",
        password: "password123",
      });
      if (res.success) {
        await checkSession();
      } else {
        setLoginError(res.error || "Quick login failed.");
      }
    } catch {
      setLoginError("Network error during demo login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("forstore_active_staff_session");
    await logoutAction();
    setSession(null);
    setClaimData(null);
  };

  const executeLookup = async (codeToLookup: string) => {
    let formatted = codeToLookup.trim().toUpperCase();
    if (!formatted) return;
    if (!formatted.startsWith("BRW-")) formatted = `BRW-${formatted}`;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setClaimData(null);
    setBillAmountInput("");

    try {
      const res = await fetch(`/api/rewards/claim?code=${formatted}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Voucher code not found in system.");
      } else {
        setClaimData(data.claim);
      }
    } catch {
      setError("Network error looking up voucher code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(inputCode);
  };

  const handleRedeem = async () => {
    if (!claimData) return;

    const parsedBill = billAmountInput ? parseFloat(billAmountInput) : undefined;
    if (claimData.minOrderValue && parsedBill !== undefined && parsedBill < claimData.minOrderValue) {
      setError(`Minimum bill requirement of ₹${claimData.minOrderValue} not met (current entered: ₹${parsedBill}).`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await redeemRewardVoucherAction(
        claimData.claimCode,
        activeStaffName,
        session?.user?.userId,
        parsedBill
      );
      if (!res.success) {
        setError(res.error || "Redemption failed.");
      } else {
        setSuccessMsg(`Voucher ${claimData.claimCode} successfully redeemed!`);
        setClaimData({
          ...claimData,
          status: "claimed",
          claimedAt: res.claimedAt,
          claimedByStaffName: res.claimedByStaffName || activeStaffName,
          daysToReturn: res.daysToReturn,
          returnBillAmount: res.returnBillAmount,
        });

        addRecentRedemption({
          claimCode: claimData.claimCode,
          rewardName: claimData.rewardName,
          customerName: claimData.customerName,
          staffName: activeStaffName,
          redeemedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        if (typeof window !== "undefined" && window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 200]);
        }
      }
    } catch {
      setError("Failed to process redemption.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Camera Scanner ──────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    setCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const scanInterval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(scanInterval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(scanInterval);
              stopCamera();

              let extractedCode = rawValue;
              if (rawValue.includes("/claim/")) {
                const parts = rawValue.split("/claim/");
                extractedCode = parts[parts.length - 1];
              }
              setInputCode(extractedCode.replace(/^BRW-/i, ""));
              executeLookup(extractedCode);
            }
          } catch {
            // Frame error
          }
        }, 300);
      }
    } catch {
      setCameraError("Camera permission denied or camera unavailable on this device.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return "Expired (2h limit reached)";
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m remaining`;
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] text-[#1A1A1A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <main className="w-full max-w-lg bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
        
        {/* Top Header Badge */}
        <div className="bg-black text-white px-4 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29] mb-3">
          STAFF COUNTER REDEMPTION PORTAL
        </div>

        {checkingAuth ? (
          <div className="py-12 flex flex-col items-center">
            <span className="text-4xl animate-spin mb-2">☕</span>
            <p className="text-xs font-bold text-black/60">Verifying manager access...</p>
          </div>
        ) : !session?.authenticated ? (
          /* ─── AUTH GUARD: STORE MANAGER & STAFF LOGIN ───────────────────── */
          <div className="w-full flex flex-col items-center my-2 text-left">
            <div className="w-full text-center mb-4">
              <span className="text-4xl mb-2 inline-block">🔐</span>
              <h2 className="font-serif text-2xl font-black text-black">Counter Staff Access</h2>
              <p className="text-xs font-semibold text-black/60 max-w-xs mx-auto mt-1">
                Enter your counter PIN to redeem customer vouchers and record staff attribution.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="w-full flex p-1 bg-[#F0ECE1] rounded-2xl border-2 border-black mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("staff_pin");
                  setLoginError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === "staff_pin"
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]"
                    : "text-black/60 hover:text-black"
                }`}
              >
                👤 Staff Counter PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("manager_login");
                  setLoginError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === "manager_login"
                    ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]"
                    : "text-black/60 hover:text-black"
                }`}
              >
                👔 Manager Sign-In
              </button>
            </div>

            {loginError && (
              <div className="w-full bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-xs font-bold mb-4 shadow-[2px_2px_0px_0px_#000]">
                ⚠️ {loginError}
              </div>
            )}

            {authMode === "staff_pin" ? (
              /* ─── STAFF PIN LOGIN ─── */
              <div className="w-full flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
                    Select Staff Member On Duty
                  </label>
                  <select
                    value={selectedStaffName}
                    onChange={(e) => setSelectedStaffName(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-black font-black text-xs bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  >
                    {staffList.length > 0 ? (
                      staffList.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role} · {m.shift || "Counter"})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Rohan Sharma">Rohan Sharma (Head Barista · Counter #1)</option>
                        <option value="Priya Verma">Priya Verma (Cashier · Counter #2)</option>
                        <option value="Aman Gupta">Aman Gupta (Floor Lead · Counter #1)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
                      Counter Staff PIN
                    </label>
                    <span className="text-[10px] font-mono font-bold text-black/40">Demo PIN: 1234</span>
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={staffPinInput}
                    onChange={(e) => setStaffPinInput(e.target.value)}
                    placeholder="•••• (Enter 1234)"
                    className="w-full p-3 rounded-xl border-2 border-black font-mono font-black text-center text-lg tracking-widest bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => handleStaffPinLogin()}
                  className="w-full py-3.5 bg-[#FF4C29] hover:bg-[#E03E1D] text-white border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  {isLoggingIn ? "VERIFYING PIN..." : `UNLOCK TERMINAL AS ${selectedStaffName.toUpperCase()} 🚀`}
                </button>

                {/* Quick 1-Click Staff Fill for Demo */}
                {!isClientProd() && (
                  <div className="mt-2 pt-3 border-t-2 border-dashed border-black/10">
                    <span className="text-[10px] font-mono uppercase font-bold text-black/40 block mb-2 text-center">
                      ⚡ 1-Click Instant Staff Access (Demo Sandbox):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStaffPinLogin("1234", "Rohan Sharma (Barista)")}
                        className="py-2 px-2.5 bg-amber-200 hover:bg-amber-300 border-2 border-black rounded-xl font-bold text-[11px] text-black shadow-[2px_2px_0px_0px_#000] cursor-pointer text-left truncate"
                      >
                        ☕ Rohan (Barista)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStaffPinLogin("1234", "Priya Verma (Cashier)")}
                        className="py-2 px-2.5 bg-emerald-200 hover:bg-emerald-300 border-2 border-black rounded-xl font-bold text-[11px] text-black shadow-[2px_2px_0px_0px_#000] cursor-pointer text-left truncate"
                      >
                        🧾 Priya (Cashier)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── MANAGER SIGN-IN FORM ─── */
              <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="manager@yourstore.com"
                    className="w-full p-3 rounded-xl border-2 border-black font-semibold text-sm bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl border-2 border-black font-semibold text-sm bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-black text-white border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer mt-2 disabled:opacity-50"
                >
                  {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN AS STORE MANAGER 🔑"}
                </button>

                {!isClientProd() && (
                  <div className="w-full mt-2 pt-3 border-t-2 border-dashed border-black/10 text-center">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-amber-400 text-black border-2 border-black rounded-xl font-black text-xs shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer"
                    >
                      ⚡ 1-CLICK QUICK DEMO MANAGER ACCESS
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        ) : (
          /* ─── AUTHENTICATED STAFF & MANAGER VERIFICATION DASHBOARD ───────── */
          <div className="w-full flex flex-col items-center">
            {/* Active Store & Staff Banner */}
            <div className="w-full bg-[#FBF9F4] border-2 border-black rounded-2xl p-3 mb-4 text-left shadow-[3px_3px_0px_0px_#000]">
              <div className="flex justify-between items-center mb-1.5">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-black/40 block">AUTHORIZED STORE</span>
                  <span className="font-serif text-sm font-black text-black">
                    🏬 {session.user?.storeName || "Store Counter"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[10px] font-black uppercase text-red-600 border border-red-500 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 cursor-pointer"
                >
                  Logout ✕
                </button>
              </div>

              <div className="pt-2 border-t border-black/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-black/40 block">STAFF ON DUTY (REWARD ATTRIBUTION)</span>
                  {isEditingStaff ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={activeStaffName}
                        onChange={(e) => setActiveStaffName(e.target.value)}
                        className="p-1 px-2 text-xs font-black border border-black rounded-lg bg-white"
                        placeholder="e.g. Alex (Cashier 1)"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingStaff(false)}
                        className="px-2 py-0.5 bg-black text-white text-[10px] font-black rounded-md"
                      >
                        SAVE
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-emerald-800">👤 {activeStaffName}</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingStaff(true)}
                        className="text-[10px] text-[#FF4C29] underline font-bold cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-black/50">
                  Manager: {session.user?.name}
                </span>
              </div>
            </div>

            <h1 className="font-serif text-2xl font-black text-black mb-1">Verify Customer Voucher</h1>
            <p className="text-xs font-semibold text-black/60 mb-4">
              Scan QR code or enter code to verify customer voucher and log staff attribution.
            </p>

            {/* Action Buttons: Camera & Input Form */}
            <div className="w-full flex gap-2 mb-4">
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-3 bg-amber-400 text-black border-2 border-black rounded-2xl font-black text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📷</span>
                <span>SCAN CUSTOMER QR CODE</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleLookup} className="w-full flex flex-col gap-3 mb-4">
              <div className="relative w-full">
                <span className="absolute left-4 top-3.5 font-mono font-black text-black/40 text-sm">BRW-</span>
                <input
                  type="text"
                  value={inputCode.replace(/^BRW-/i, "")}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="7X92"
                  maxLength={8}
                  className="w-full pl-16 pr-4 py-3 rounded-2xl border-3 border-black font-mono text-xl font-black uppercase bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29] shadow-[3px_3px_0px_0px_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="w-full py-3.5 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "SEARCHING DATABASE..." : "LOOKUP VOUCHER 🔍"}
              </button>
            </form>

            {/* Error Alert */}
            {error && (
              <div className="w-full bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-2xl text-xs font-bold mb-4 shadow-[2px_2px_0px_0px_#000]">
                ⚠️ {error}
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div className="w-full bg-emerald-100 border-2 border-emerald-500 text-emerald-800 p-3 rounded-2xl text-xs font-bold mb-4 shadow-[2px_2px_0px_0px_#000]">
                ✅ {successMsg}
              </div>
            )}

            {/* Verification Result Card */}
            {claimData && (() => {
              const isLocked = claimData.isLocked || (claimData.validFrom && new Date(claimData.validFrom) > new Date());
              return (
                <div className="w-full bg-[#FBF9F4] border-3 border-black rounded-2xl p-4 text-left shadow-[4px_4px_0px_0px_#000] flex flex-col gap-3 mb-5">
                  <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                    <span className="font-mono text-lg font-black text-[#FF4C29]">{claimData.claimCode}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        claimData.status === "claimed"
                          ? "bg-black text-white border-black"
                          : claimData.status === "expired"
                          ? "bg-red-500 text-white border-black"
                          : isLocked
                          ? "bg-amber-300 text-amber-950 border-black"
                          : "bg-emerald-400 text-black border-black"
                      }`}
                    >
                      {claimData.status === "claimed" ? "claimed" : isLocked ? "locked until next visit" : claimData.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-black text-black">{claimData.rewardName}</h3>
                    <p className="text-xs font-semibold text-black/60">{claimData.rewardDescription}</p>
                  </div>

                  {/* Locked Next-Visit Alert */}
                  {isLocked && (
                    <div className="w-full bg-amber-100 border-2 border-amber-500 text-amber-950 p-3 rounded-xl text-xs font-bold space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-950 font-black uppercase tracking-wider">
                        <span>🔒</span>
                        <span>Next-Visit Retention Voucher</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-tight">
                        This voucher is valid only on a <strong>return visit</strong>. It unlocks on <strong>{new Date(claimData.validFrom).toLocaleDateString()} at {new Date(claimData.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
                      </p>
                      <p className="text-[10px] text-amber-800 italic">
                        Cannot be applied to today&apos;s bill. Ask customer to save to WhatsApp for next visit!
                      </p>
                    </div>
                  )}

                  {/* Minimum Order Value Check */}
                  {claimData.minOrderValue > 0 && (
                    <div className="bg-white p-3 rounded-xl border-2 border-black text-xs font-bold space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-black/70">Minimum Bill Required:</span>
                        <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">₹{claimData.minOrderValue}</span>
                      </div>
                      {!isLocked && claimData.status === "pending" && (
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-black/50 block mb-1">
                            Enter Today&apos;s Bill Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={billAmountInput}
                            onChange={(e) => setBillAmountInput(e.target.value)}
                            placeholder={`Min ₹${claimData.minOrderValue}`}
                            className="w-full p-2.5 rounded-xl border-2 border-black font-mono font-black text-sm bg-[#FBF9F4] focus:outline-none focus:border-[#FF4C29]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status & Expiry Window Check */}
                  <div className="bg-white p-3 rounded-xl border-2 border-black text-xs font-bold space-y-1.5">
                    <p className="text-black/70">Customer: <span className="text-black font-black">{claimData.customerName}</span></p>
                    <p className="text-black/70">Store: <span className="text-black font-black">{claimData.storeName}</span></p>
                    
                    {claimData.status === "claimed" ? (
                      <div className="pt-1.5 border-t border-black/10 text-emerald-800 space-y-0.5">
                        <p className="text-[10px] uppercase font-black tracking-wider text-emerald-700">STATUS: REDEEMED</p>
                        <p>Claimed At: <span className="font-black text-black">{new Date(claimData.claimedAt || Date.now()).toLocaleTimeString()}</span></p>
                        {claimData.claimedByStaffName && (
                          <p>Rewarded by Staff: <span className="font-black text-emerald-950">{claimData.claimedByStaffName}</span></p>
                        )}
                        {claimData.daysToReturn !== undefined && claimData.daysToReturn > 0 && (
                          <p className="text-[11px] text-emerald-900">
                            🎯 Return Visit: Returned after <strong>{claimData.daysToReturn} days</strong>
                            {claimData.returnBillAmount ? ` • Bill: ₹${claimData.returnBillAmount}` : ""}
                          </p>
                        )}
                      </div>
                    ) : claimData.status === "expired" ? (
                      <p className="text-red-600 font-black">⚠️ EXPIRED: Validity Window Passed</p>
                    ) : isLocked ? (
                      <p className="text-amber-900 font-black">
                        🔒 Unlocks on: <span className="font-mono">{new Date(claimData.validFrom).toLocaleDateString()} {new Date(claimData.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    ) : (
                      <p className="text-black/70">
                        Validity Window: <span className="text-[#FF4C29] font-black">{getRemainingTime(claimData.expiresAt)}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  {claimData.status === "pending" && (
                    isLocked ? (
                      <div className="w-full py-3.5 bg-amber-200 text-amber-950 border-2 border-black rounded-xl font-black text-xs text-center shadow-[3px_3px_0px_0px_#000]">
                        🔒 LOCKED: REDEEMABLE ON NEXT VISIT ONLY
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRedeem}
                        disabled={loading}
                        className="w-full py-3.5 bg-emerald-400 text-black border-2 border-black rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer mt-1"
                      >
                        {loading ? "VERIFYING..." : `VERIFY & REWARD AS ${activeStaffName.toUpperCase()} ✅`}
                      </button>
                    )
                  )}
                </div>
              );
            })()}

            {/* Shift Recent Redemptions Table for Store Manager */}
            {recentRedemptions.length > 0 && (
              <div className="w-full border-t-2 border-black/10 pt-4 text-left">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-black/40">
                    Shift Redemptions Log ({recentRedemptions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleExportShiftCSV}
                    className="text-[10px] font-bold text-black bg-[#FBF9F4] border border-black px-2 py-0.5 rounded-lg hover:bg-black/5 shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                  >
                    📥 Export CSV
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {recentRedemptions.map((r, i) => (
                    <div
                      key={i}
                      className="bg-[#FBF9F4] p-2.5 rounded-xl border border-black/10 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#FF4C29]">{r.claimCode}</span>
                          <span className="font-bold text-black/80">{r.rewardName}</span>
                        </div>
                        <div className="text-[10px] text-black/50 mt-0.5">
                          Customer: <span className="font-bold text-black/70">{r.customerName}</span> • Staff: <span className="font-bold text-emerald-800">{r.staffName}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-black/60">{r.redeemedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/arcade"
              className="text-xs font-bold text-black/40 underline mt-5 hover:text-black"
            >
              Back to Arcade Website
            </Link>
          </div>
        )}
      </main>

      {/* Camera Scanner Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border-4 border-black rounded-3xl p-5 flex flex-col items-center shadow-[8px_8px_0px_0px_#FF4C29]">
            <h3 className="font-serif text-lg font-black text-black mb-1">Scan Customer Voucher QR</h3>
            <p className="text-xs text-black/60 mb-3">Align customer&apos;s voucher QR in the frame</p>

            {cameraError ? (
              <div className="w-full bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold mb-4">
                ⚠️ {cameraError}
              </div>
            ) : (
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-3 border-black mb-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-8 border-2 border-dashed border-white/80 rounded-xl pointer-events-none animate-pulse" />
              </div>
            )}

            <button
              type="button"
              onClick={stopCamera}
              className="w-full py-3 bg-black text-white border-2 border-black rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_#000] cursor-pointer"
            >
              CLOSE SCANNER ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
