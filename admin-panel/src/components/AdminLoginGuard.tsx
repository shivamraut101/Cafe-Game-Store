"use client";

import React, { useState, useEffect } from "react";
import { loginAction, getSessionAction, registerMerchantAction } from "../app/actions/authActions";

interface AdminLoginGuardProps {
  children: React.ReactNode;
  activeRole: "store_admin" | "super_admin";
  onLoginSuccess: (role: "store_admin" | "super_admin", email: string, storeName?: string) => void;
}

export default function AdminLoginGuard({
  children,
  activeRole,
  onLoginSuccess,
}: AdminLoginGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  
  // Auth Mode: Sign In vs Register
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Sign In States
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedRoleTab, setSelectedRoleTab] = useState<"store_admin" | "super_admin">(activeRole);

  // Self-Serve Registration States
  const [regStoreName, setRegStoreName] = useState<string>("");
  const [regOwnerName, setRegOwnerName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await getSessionAction();
        if (res.authenticated && res.user) {
          setIsAuthenticated(true);
          onLoginSuccess(
            res.user.role as "store_admin" | "super_admin",
            res.user.email,
            res.user.storeName || undefined
          );
        }
      } catch (e) {
        console.error("Session verification failed", e);
      } finally {
        setCheckingSession(false);
      }
    }
    checkActiveSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      setIsLoggingIn(true);
      setErrorMsg(null);

      const res = await loginAction({
        email: email.trim(),
        password,
        role: selectedRoleTab,
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || "Invalid credentials.");
        return;
      }

      setIsAuthenticated(true);
      onLoginSuccess(
        res.user.role as "store_admin" | "super_admin",
        res.user.email,
        res.user.storeName || undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Network error logging into portal.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStoreName.trim() || !regOwnerName.trim() || !regEmail.trim() || !regPassword) return;

    try {
      setIsRegistering(true);
      setErrorMsg(null);

      const res = await registerMerchantAction({
        storeName: regStoreName.trim(),
        ownerName: regOwnerName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || "Registration failed. Please try again.");
        return;
      }

      setIsAuthenticated(true);
      onLoginSuccess(
        res.user.role as "store_admin" | "super_admin",
        res.user.email,
        res.user.storeName || undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Network error registering cafe.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleQuickDemoFill = async (role: "store_admin" | "super_admin") => {
    setSelectedRoleTab(role);
    setAuthMode("login");
    const demoEmail = role === "super_admin" ? "koushik@forstore.app" : "manager@brewbites.com";
    const demoPass = role === "super_admin" ? "super123" : "admin123";
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);

    // Auto trigger login for convenience
    try {
      setIsLoggingIn(true);
      const res = await loginAction({
        email: demoEmail,
        password: demoPass,
        role,
      });

      if (res.success && res.user) {
        setIsAuthenticated(true);
        onLoginSuccess(
          res.user.role as "store_admin" | "super_admin",
          res.user.email,
          res.user.storeName || undefined
        );
      } else {
        setErrorMsg(res.error || "Demo login failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex items-center justify-center font-sans">
        <div className="text-center font-black text-black/60 text-sm flex flex-col items-center gap-2">
          <span className="text-3xl animate-bounce">🔐</span>
          <span>Verifying Secure Session with MongoDB...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex flex-col items-center justify-center p-4 font-sans select-none">
        <main className="w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative">
          
          {/* Top Mode Selector: Sign In vs Register */}
          <div className="w-full grid grid-cols-2 gap-2 bg-[#FBF9F4] p-1.5 rounded-2xl border-2 border-black mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_#FF4C29]"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Sign In 🔑
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-[#FF4C29] text-white shadow-[2px_2px_0px_0px_#000]"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Start Free Trial ⚡
            </button>
          </div>

          {authMode === "login" ? (
            <>
              <h1 className="font-serif text-2xl font-black text-black mb-1">Cafe Admin Portal</h1>
              <p className="text-xs font-semibold text-black/60 mb-5">
                Database-authenticated login for cafe owners and SaaS platform administrators.
              </p>

              {/* Role Tab Switcher */}
              <div className="w-full grid grid-cols-2 gap-2 bg-[#FBF9F4] p-1 rounded-xl border border-black/20 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoleTab("store_admin");
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    selectedRoleTab === "store_admin"
                      ? "bg-black text-white"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  🏪 Store Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoleTab("super_admin");
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    selectedRoleTab === "super_admin"
                      ? "bg-[#332FD0] text-white"
                      : "text-black/60 hover:text-black"
                  }`}
                >
                  ⚡ Super Admin
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="w-full flex flex-col gap-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRoleTab === "super_admin" ? "koushik@forstore.app" : "manager@brewbites.com"}
                    className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-black text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer mt-1 disabled:opacity-50"
                >
                  {isLoggingIn ? "VERIFYING CREDENTIALS..." : "LOG IN TO PORTAL 🔑"}
                </button>
              </form>

              {/* Quick Demo Sign-in Divider */}
              <div className="w-full flex items-center my-5">
                <div className="flex-1 border-t-2 border-black/10" />
                <span className="px-3 text-[10px] font-black uppercase tracking-wider text-black/40">
                  OR QUICK 1-CLICK AUTH
                </span>
                <div className="flex-1 border-t-2 border-black/10" />
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => handleQuickDemoFill("store_admin")}
                  className="py-2.5 bg-[#FBF9F4] text-black border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Brew & Bites Admin ☕
                </button>
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={() => handleQuickDemoFill("super_admin")}
                  className="py-2.5 bg-[#FBF9F4] text-black border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Super Admin HQ ⚡
                </button>
              </div>
            </>
          ) : (
            /* Register New Store Form */
            <>
              <h1 className="font-serif text-2xl font-black text-black mb-1">Launch Your Cafe Arcade</h1>
              <p className="text-xs font-semibold text-black/60 mb-3">
                Get started in 30 seconds with 100 free table scan credits.
              </p>

              <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-xl p-2.5 text-xs font-bold mb-4 w-full text-left">
                🎁 <span className="font-black">Trial Perks:</span> 100 Free Scan Credits • 3 Pre-configured Minigames • Custom Printable QR Studio
              </div>

              <form onSubmit={handleRegister} className="w-full flex flex-col gap-3 text-left">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Cafe / Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regStoreName}
                    onChange={(e) => setRegStoreName(e.target.value)}
                    placeholder="e.g. Sunset Roast & Bakery"
                    className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regOwnerName}
                    onChange={(e) => setRegOwnerName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="owner@sunsetroast.com"
                    className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1">
                    Password (Min 6 Characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl border-2 border-black bg-[#FBF9F4] font-semibold text-sm focus:outline-none focus:border-[#FF4C29] shadow-[2px_2px_0px_0px_#000]"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-100 border-2 border-red-500 text-red-700 p-2.5 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3.5 bg-[#FF4C29] text-white border-3 border-black rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#000] hover:translate-y-[1px] transition-all cursor-pointer mt-1 disabled:opacity-50"
                >
                  {isRegistering ? "PROVISIONING STORE..." : "START FREE TRIAL (100 CREDITS) 🚀"}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
