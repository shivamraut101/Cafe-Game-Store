"use client";

import React, { useState, useEffect } from "react";
import SuperAdminDashboard from "../../components/SuperAdminDashboard";
import GlobalAnalyticsTab from "../../components/tabs/super-admin/GlobalAnalyticsTab";
import BillingPayoutsTab from "../../components/tabs/super-admin/BillingPayoutsTab";
import GlobalTemplatesTab from "../../components/tabs/super-admin/GlobalTemplatesTab";
import AuditLogsTab from "../../components/tabs/AuditLogsTab";
import CreateStoreModal from "../../components/CreateStoreModal";
import { getSessionAction, loginAction, logoutAction } from "../actions/authActions";
import { getClientAppEnvironment } from "../../lib/appEnv";
import { TierLevel } from "../../types";

type SuperAdminTabType = "merchants" | "global-analytics" | "billing" | "global-templates" | "audit-logs";

export default function SuperAdminPage() {
  const [env, setEnv] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<SuperAdminTabType>("merchants");

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Store creation modal
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);

  useEffect(() => {
    const currentEnv = getClientAppEnvironment();
    setEnv(currentEnv);

    async function checkSession() {
      try {
        const res = await getSessionAction();
        if (res.authenticated && res.user && res.user.role === "super_admin") {
          setIsAuthenticated(true);
          setUserEmail(res.user.email);
        }
      } catch (err) {
        console.error("Super Admin session check failed", err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail.trim() || !loginPass) return;

    try {
      setIsLoggingIn(true);
      setErrorMsg(null);

      const res = await loginAction({
        email: loginEmail.trim(),
        password: loginPass,
        role: "super_admin",
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || "Invalid Super Admin credentials.");
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(res.user.email);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error logging into Super Admin portal.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePreloadedFill = async () => {
    const defaultEmail = "koushik@forstore.app";
    const defaultPass = "super123";
    setEmail(defaultEmail);
    setPassword(defaultPass);
    await handleLogin(undefined, defaultEmail, defaultPass);
  };

  const handleLogout = async () => {
    try {
      await logoutAction();
      setIsAuthenticated(false);
      setUserEmail("");
    } catch (err) {
      console.error("Logout error", err);
      setIsAuthenticated(false);
    }
  };

  const handleImpersonateStore = (storeName: string, tier: TierLevel) => {
    window.location.href = `/admin?impersonate=${encodeURIComponent(storeName)}`;
  };

  // If in demo environment, block superadmin completely
  if (env === "demo") {
    return (
      <div className="min-h-screen bg-[#F6F3EB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-4 border-black rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_#000]">
          <span className="text-4xl block mb-3">🛡️</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase rounded-full tracking-wider">
            Demo Sandbox Protected
          </span>
          <h1 className="font-serif text-2xl font-black text-black mt-3">Super Admin Disabled</h1>
          <p className="text-xs text-black/60 font-semibold mt-2 leading-relaxed">
            The Super Admin console is strictly reserved for internal platform operations and is completely unavailable in the Demo Sandbox environment.
          </p>
          <div className="mt-6">
            <a
              href="/admin"
              className="inline-block py-3 px-6 bg-black text-white font-bold text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#FF4C29] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              ← Return to Cafe Demo Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF4C29] animate-ping" />
          <span>Verifying HQ credentials...</span>
        </div>
      </div>
    );
  }

  // Not authenticated as Super Admin: Show dedicated HQ Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-4 relative">
        <div className="max-w-md w-full bg-[#161B26] border-2 border-white/10 rounded-3xl p-8 shadow-2xl relative text-left">
          {/* Top Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-[#FF4C29]/10 text-[#FF4C29] border border-[#FF4C29]/30 text-[10px] font-mono font-black uppercase rounded-full tracking-wider">
              👑 ForStore HQ · Restricted
            </span>
            <span className="text-[11px] text-white/40 font-mono">Platform Admin</span>
          </div>

          <h1 className="font-serif text-2xl font-black text-white">Super Admin Portal</h1>
          <p className="text-xs text-white/50 font-semibold mt-1 mb-6">
            Multi-tenant control center, billing management, and global platform analytics.
          </p>

          <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/60 mb-1.5">
                Super Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="koushik@forstore.app"
                className="w-full p-3 rounded-xl border border-white/20 bg-[#0B0F17] text-white font-semibold text-sm focus:outline-none focus:border-[#FF4C29] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-white/60 mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-white/20 bg-[#0B0F17] text-white font-semibold text-sm focus:outline-none focus:border-[#FF4C29] transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-[#FF4C29] hover:bg-[#E03E1D] text-white font-black text-sm rounded-xl transition-all shadow-lg hover:translate-y-[-1px] cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoggingIn ? "AUTHENTICATING..." : "ENTER PLATFORM CONSOLE 🔑"}
            </button>
          </form>

          {/* Preloaded Credentials for Quick Super Admin Access */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
              ⚡ ForStore HQ Operator Shortcut:
            </span>
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={handlePreloadedFill}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <div className="text-left">
                  <span className="block font-bold">Quick Fill Super Admin</span>
                  <span className="text-[10px] text-white/50 font-mono">koushik@forstore.app</span>
                </div>
              </div>
              <span className="text-[11px] text-[#FF4C29] font-mono">Auto Login →</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <a href="/admin" className="text-xs text-white/40 hover:text-white transition-colors">
              ← Go to Merchant Store Admin (/admin)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated as Super Admin: Render full Super Admin Dashboard
  const superAdminTabs: { id: SuperAdminTabType; label: string; icon: string; badge?: string }[] = [
    { id: "merchants", label: "Merchants", icon: "👑" },
    { id: "global-analytics", label: "Global Analytics", icon: "📈" },
    { id: "billing", label: "Billing & Payouts", icon: "💳" },
    { id: "global-templates", label: "Global Templates", icon: "🎮", badge: "New" },
    { id: "audit-logs", label: "System Audit Logs", icon: "📜" },
  ];

  return (
    <div className="min-h-screen bg-[#0E131F] text-white flex flex-col">
      {/* Top Super Admin Header */}
      <header className="bg-[#161B26] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF4C29] rounded-xl border border-black/30 flex items-center justify-center font-black text-white text-lg shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-xl tracking-tight text-white">ForStore HQ</h1>
                <span className="px-2 py-0.5 bg-[#FF4C29]/20 text-[#FF4C29] border border-[#FF4C29]/30 text-[9px] font-mono font-black uppercase rounded">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/40">Multi-Tenant Platform Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70">{userEmail || "koushik@forstore.app"}</span>
            </div>

            <a
              href="/admin"
              className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition-colors"
            >
              🏪 Store Portal
            </a>

            <button
              onClick={handleLogout}
              className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Log Out 🔒
            </button>
          </div>
        </div>
      </header>

      {/* Main Super Admin Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 sticky top-20">
            {superAdminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border text-left cursor-pointer
                    ${isActive
                      ? "bg-[#FF4C29] text-white border-[#FF4C29] shadow-lg translate-y-[-1px]"
                      : "bg-[#161B26] text-white/70 border-white/5 hover:border-white/15 hover:text-white"
                    }
                  `}
                >
                  <span className={isActive ? "opacity-100" : "opacity-60"}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/30 text-white font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Section */}
        <section className="flex-1 min-w-0 bg-[#161B26] border border-white/10 rounded-3xl p-6 shadow-xl">
          {activeTab === "merchants" && (
            <SuperAdminDashboard
              onImpersonateStore={handleImpersonateStore}
              onCreateStore={() => setShowCreateStoreModal(true)}
            />
          )}
          {activeTab === "global-analytics" && <GlobalAnalyticsTab />}
          {activeTab === "billing" && <BillingPayoutsTab />}
          {activeTab === "global-templates" && <GlobalTemplatesTab />}
          {activeTab === "audit-logs" && <AuditLogsTab />}
        </section>
      </main>

      <CreateStoreModal
        isOpen={showCreateStoreModal}
        onClose={() => setShowCreateStoreModal(false)}
        onStoreCreated={() => setShowCreateStoreModal(false)}
      />
    </div>
  );
}
