"use client";

import React, { useState, useEffect } from "react";
import RoleHeader from "../components/RoleHeader";
import CustomDropdown from "../components/CustomDropdown";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import GlobalAnalyticsTab from "../components/tabs/super-admin/GlobalAnalyticsTab";
import BillingPayoutsTab from "../components/tabs/super-admin/BillingPayoutsTab";
import GlobalTemplatesTab from "../components/tabs/super-admin/GlobalTemplatesTab";
import AnalyticsTab from "../components/tabs/AnalyticsTab";
import BrandingTab from "../components/tabs/BrandingTab";
import WalletTab from "../components/tabs/WalletTab";
import SubscriptionTab from "../components/tabs/SubscriptionTab";
import AuditLogsTab from "../components/tabs/AuditLogsTab";
import QRStudio from "../components/QRStudio";
import CreateStoreModal from "../components/CreateStoreModal";
import { logAction } from "../lib/auditLogger";
import { UserRole, TierLevel, Game, MiniGameConfig } from "../types";
import GameManagerTab from "../components/tabs/GameManagerTab";
import { MerchantAccount } from "../components/SuperAdminDashboard";
import {
  getCampaignsAction,
  getMiniGameConfigsAction,
  getSuperAdminMerchantsAction,
  toggleCampaignStatusAction,
  updateMiniGameConfigAction,
} from "./actions/adminActions";

import AdminLoginGuard from "../components/AdminLoginGuard";

export default function AdminPortal() {
  const [role, setRole] = useState<UserRole>("store_admin");
  const [authRole, setAuthRole] = useState<UserRole>("store_admin");
  const [userEmail, setUserEmail] = useState<string>("");
  const [tier, setTier] = useState<TierLevel>("Pro Store");
  const [impersonatedStore, setImpersonatedStore] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "branding" | "wallet" | "subscription" | "qr-studio" | "audit-logs" | "game-manager"
  >("overview");

  const [superAdminTab, setSuperAdminTab] = useState<
    "merchants" | "global-analytics" | "billing" | "global-templates" | "audit-logs"
  >("merchants");

  const [games, setGames] = useState<Game[]>([]);
  const [miniGameConfigs, setMiniGameConfigs] = useState<MiniGameConfig[]>([]);
  const [storesList, setStoresList] = useState<string[]>([]);
  const [currentStore, setCurrentStore] = useState<string>("");
  const [loadingDb, setLoadingDb] = useState(true);

  // Fetch live DB data on mount
  useEffect(() => {
    async function loadDataFromDb() {
      try {
        setLoadingDb(true);
        // Load Campaigns
        const campaignsRes = await getCampaignsAction();
        if (campaignsRes.success && campaignsRes.campaigns) {
          setGames(campaignsRes.campaigns as any);
        }

        // Load MiniGameConfigs
        const configsRes = await getMiniGameConfigsAction();
        if (configsRes.success && configsRes.configs) {
          setMiniGameConfigs(configsRes.configs as any);
        }

        // Load Merchants/Stores List
        const merchantsRes = await getSuperAdminMerchantsAction();
        if (merchantsRes.success && merchantsRes.merchants) {
          const names = merchantsRes.merchants.map((m) => m.storeName);
          setStoresList(names);
          if (names.length > 0) setCurrentStore(names[0]);
        }
      } catch (e) {
        console.error("Failed to load dashboard data from DB", e);
      } finally {
        setLoadingDb(false);
      }
    }
    loadDataFromDb();
  }, []);

  // Re-fetch / Auto-provision game configs when selected store changes in dropdown
  useEffect(() => {
    if (!currentStore) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedStore", currentStore);
    }
    async function loadStoreGames() {
      const res = await getMiniGameConfigsAction(undefined, currentStore);
      if (res.success && res.configs) {
        setMiniGameConfigs(res.configs as any);
      }
    }
    loadStoreGames();
  }, [currentStore]);

  const handleUpdateMiniGameConfig = async (updated: MiniGameConfig) => {
    setMiniGameConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    await updateMiniGameConfigAction(updated);
  };

  const updateUrl = (newRole: UserRole, newTab: string) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      params.set("role", newRole);
      params.set("tab", newTab);
      window.history.pushState({ role: newRole, tab: newTab }, "", `?${params.toString()}`);
    }
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get("role") as UserRole;
      const urlTab = params.get("tab");

      if (urlRole === "super_admin" || urlRole === "store_admin") {
        setRole(urlRole);
      }
      if (urlTab) {
        if (urlRole === "super_admin") {
          setSuperAdminTab(urlTab as any);
        } else {
          setActiveTab(urlTab as any);
        }
      }

      const handlePopState = () => {
        const p = new URLSearchParams(window.location.search);
        const r = p.get("role") as UserRole;
        const t = p.get("tab");
        if (r) setRole(r);
        if (t) {
          if (r === "super_admin") setSuperAdminTab(t as any);
          else setActiveTab(t as any);
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [settingsGameId, setSettingsGameId] = useState<string | null>(null);
  const [newGameName, setNewGameName] = useState("");
  const [newGameIcon, setNewGameIcon] = useState("🎡");

  const handleStoreCreated = (newStore: MerchantAccount) => {
    setStoresList([newStore.storeName, ...storesList]);
    setCurrentStore(newStore.storeName);
  };

  const handleImpersonateStore = (storeName: string, storeTier: TierLevel) => {
    setImpersonatedStore(storeName);
    setCurrentStore(storeName);
    setTier(storeTier);
    setRole("store_admin");
    setActiveTab("overview");
  };

  const handleExitImpersonation = () => {
    setImpersonatedStore(null);
    setRole("super_admin");
  };

  const toggleStatus = (id: string) => {
    const game = games.find(g => g.id === id);
    const newStatus = game?.status === "Active" ? "Inactive" : "Active";

    setGames(prev =>
      prev.map(g => (g.id === id ? { ...g, status: newStatus } : g))
    );

    if (game) {
      logAction({
        actorName: role === "super_admin" ? "Koushik (Super Admin)" : "Store Manager",
        actorEmail: role === "super_admin" ? "koushik@forstore.app" : "manager@brewbites.com",
        actorRole: role === "super_admin" ? "Super Admin" : "Store Admin",
        ipAddress: "192.168.1.104",
        action: "STORE_GAME_TOGGLE",
        actionCategory: "CAMPAIGN",
        targetType: "Game Campaign",
        targetName: game.name,
        details: `Toggled ${game.name} status to ${newStatus} for store ${currentStore}.`,
      });
    }
  };

  const addGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newGame: Game = {
      id: Date.now().toString(),
      name: newGameName,
      type: "Custom",
      icon: newGameIcon,
      status: "Inactive",
      scans: 0,
      winRate: 10,
      reward: "TBD",
      shadowColor: "shadow-flat-blue",
    };

    setGames([...games, newGame]);

    logAction({
      actorName: role === "super_admin" ? "Koushik (Super Admin)" : "Store Manager",
      actorEmail: role === "super_admin" ? "koushik@forstore.app" : "manager@brewbites.com",
      actorRole: role === "super_admin" ? "Super Admin" : "Store Admin",
      ipAddress: "192.168.1.104",
      action: "STORE_GAME_CREATE",
      actionCategory: "CAMPAIGN",
      targetType: "Game Campaign",
      targetName: newGameName,
      details: `Created new game campaign "${newGameName}" for store ${currentStore}.`,
    });

    setNewGameName("");
    setShowAddModal(false);
  };

  const updateGameSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsGameId) {
      setSettingsGameId(null);
    }
  };

  const storeAdminTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "branding", label: "Branding", icon: "🎨" },
    { id: "wallet", label: "Wallet", icon: "💳" },
    { id: "subscription", label: "Subscription", icon: "⭐" },
    { id: "qr-studio", label: "QR Studio", icon: "📱", badge: "New" },
    { id: "game-manager", label: "Game Manager", icon: "🎮", badge: "New" },
    { id: "audit-logs", label: "Audit Logs", icon: "📜" },
  ];

  const superAdminTabs = [
    { id: "merchants", label: "Merchants", icon: "👑" },
    { id: "global-analytics", label: "Global Analytics", icon: "📈" },
    { id: "billing", label: "Billing & Payouts", icon: "💳" },
    { id: "global-templates", label: "Global Templates", icon: "🎮", badge: "New" },
    { id: "audit-logs", label: "System Audit Logs", icon: "📜" },
  ];

  return (
    <AdminLoginGuard
      activeRole={role}
      onLoginSuccess={(r, email, storeName) => {
        setAuthRole(r);
        setRole(r);
        if (email) setUserEmail(email);
        if (r === "store_admin" && storeName) {
          setCurrentStore(storeName);
        }
      }}
    >
      <div className="flex flex-col min-h-screen bg-[#F6F3EB]">
      {/* Top Global Role Switcher Bar */}
      <RoleHeader
        currentRole={role}
        currentTier={tier}
        authRole={authRole}
        userEmail={userEmail}
        storeName={currentStore}
        onRoleChange={(newRole) => {
          setRole(newRole);
          const defaultTab = newRole === "super_admin" ? superAdminTab : activeTab;
          updateUrl(newRole, defaultTab);
        }}
        onTierChange={setTier}
        impersonatedStore={impersonatedStore}
        onExitImpersonation={handleExitImpersonation}
      />

      {/* Main Header Bar */}
      <header className={`border-b-2 border-black sticky top-0 z-40 ${role === "super_admin" ? "bg-[#111111] text-white" : "bg-white text-black"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF4C29] rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <div>
              <h1 className="font-serif font-black text-2xl tracking-tight">
                {role === "super_admin" ? "ForStore HQ" : "ForStore"}
              </h1>
              <p className={`text-[10px] font-bold tracking-widest uppercase -mt-1 ${role === "super_admin" ? "text-[#FF4C29]" : "text-black/40"}`}>
                {role === "super_admin" ? "Super Admin Panel" : "Store Admin Panel"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {authRole === "super_admin" ? (
              <div className="w-64">
                <CustomDropdown
                  options={storesList}
                  value={currentStore}
                  onChange={setCurrentStore}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#FBF9F4] text-black px-3.5 py-2 rounded-xl border-2 border-black font-black text-xs shadow-[2px_2px_0px_0px_#000]">
                <span>🏪</span>
                <span>{currentStore || "Brew & Bites Cafe"}</span>
              </div>
            )}

            <button className={`p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all relative ${role === "super_admin" ? "bg-[#222222]" : "bg-[#FBF9F4]"}`}>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF4C29] rounded-full border-2 border-black animate-pulse"></span>
              🔔
            </button>

            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 border-black ${role === "super_admin" ? "bg-white text-black" : "bg-black text-white"}`}>
              <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs">
                {role === "super_admin" ? "👑" : "🧑‍💼"}
              </div>
              <span className="font-bold text-sm">
                {role === "super_admin" ? "Super Admin" : "Store Manager"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 sticky top-24">
            {role === "super_admin" ? (
              superAdminTabs.map((tab) => {
                const isActive = superAdminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSuperAdminTab(tab.id as any);
                      updateUrl("super_admin", tab.id);
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 text-left
                      ${isActive 
                        ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_#FF4C29] translate-y-[-2px]' 
                        : 'bg-white text-black/60 border-transparent hover:border-black/10 hover:bg-black/5'
                      }
                    `}
                  >
                    <span className={isActive ? "opacity-100" : "opacity-50"}>{tab.icon}</span>
                    {tab.label}
                    {tab.badge && (
                      <span className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${isActive ? 'bg-[#FF4C29] border-black text-white' : 'bg-black/5 border-black/10 text-black/40'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              storeAdminTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      updateUrl("store_admin", tab.id);
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 text-left
                      ${isActive 
                        ? 'bg-black text-[#ffffff] border-black shadow-[4px_4px_0px_0px_#FF4C29] translate-y-[-2px]' 
                        : 'bg-white text-black/60 border-transparent hover:border-black/10 hover:bg-black/5'
                      }
                    `}
                  >
                    <span className={isActive ? "opacity-100" : "opacity-50"}>{tab.icon}</span>
                    {tab.label}
                    {tab.badge && (
                      <span className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${isActive ? 'bg-[#FF4C29] border-black text-white' : 'bg-black/5 border-black/10 text-black/40'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 min-w-0">
          {role === "super_admin" ? (
            <>
              {superAdminTab === "merchants" && (
                <SuperAdminDashboard
                  onImpersonateStore={handleImpersonateStore}
                  onCreateStore={() => setShowCreateStoreModal(true)}
                />
              )}
              {superAdminTab === "global-analytics" && <GlobalAnalyticsTab />}
              {superAdminTab === "billing" && <BillingPayoutsTab />}
              {superAdminTab === "global-templates" && <GlobalTemplatesTab />}
              {superAdminTab === "audit-logs" && <AuditLogsTab />}
            </>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* 3-Step Quick Launcher Banner */}
                  <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] text-white rounded-3xl p-6 border-3 border-black shadow-[6px_6px_0px_0px_#FF4C29] flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div>
                      <span className="bg-[#FF4C29] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
                        ⚡ 3-STEP QUICK LAUNCHER
                      </span>
                      <h2 className="font-serif text-2xl font-black text-white mt-2">Launch Your Cafe Arcade in 60 Seconds</h2>
                      <p className="text-xs text-white/70 mt-1 max-w-lg">
                        Super simple setup: Enable games, set reward vouchers (e.g. Free Coffee at 15 pts), and print your table QR standees!
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveTab("game-manager")}
                        className="py-3 px-4 bg-emerald-400 text-black rounded-2xl font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all"
                      >
                        1. CONFIGURE REWARDS 🎮
                      </button>
                      <button
                        onClick={() => setActiveTab("qr-studio")}
                        className="py-3 px-4 bg-[#FF4C29] text-white rounded-2xl font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-y-[1px] transition-all"
                      >
                        2. PRINT QR STANDS 📱
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#FF4C29]">
                      <p className="text-sm font-bold text-black/50">Active Campaigns</p>
                      <h3 className="font-serif text-3xl font-black mt-1">
                        {games.filter(g => g.status === "Active").length}
                      </h3>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#332FD0]">
                      <p className="text-sm font-bold text-black/50">Total Scans (30d)</p>
                      <h3 className="font-serif text-3xl font-black mt-1">4,280</h3>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border-2 border-black shadow-[4px_4px_0px_0px_#10B981]">
                      <p className="text-sm font-bold text-black/50">Rewards Claimed</p>
                      <h3 className="font-serif text-3xl font-black mt-1">612</h3>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_#000000]">
                    <div className="p-6 border-b-2 border-black bg-[#FBF9F4] flex justify-between items-center">
                      <h3 className="font-serif text-xl font-bold text-black">Campaign Performance</h3>
                      <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_#FF4C29]">
                        {tier}
                      </span>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      {games.map(game => (
                        <div key={game.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-black bg-white hover:bg-black/[0.02] transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-black ${game.shadowColor} bg-white`}>
                              {game.icon}
                            </div>
                            <div>
                              <h4 className="font-bold text-black">{game.name}</h4>
                              <p className="text-xs font-semibold text-black/50">{game.type} • {game.reward}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-xs font-bold text-black/50">Scans</p>
                              <p className="font-black text-black">{game.scans}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-black/50">Win Rate</p>
                              <p className="font-black text-[#10B981]">{game.winRate}%</p>
                            </div>
                            <button 
                              onClick={() => toggleStatus(game.id)}
                              className={`px-4 py-2 rounded-lg font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-[1px] hover:shadow-none transition-all w-24 ${
                                game.status === 'Active' ? 'bg-[#FF4C29] text-white' : 'bg-white text-black'
                              }`}
                            >
                              {game.status}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "analytics" && <AnalyticsTab storeName={currentStore} />}
              {activeTab === "branding" && <BrandingTab storeName={currentStore} />}
              {activeTab === "wallet" && <WalletTab storeName={currentStore} />}
              {activeTab === "subscription" && <SubscriptionTab storeName={currentStore} currentTier={tier} onTierChange={setTier} />}
              {activeTab === "qr-studio" && (
                <QRStudio
                  storeName={currentStore}
                  games={games}
                  showAddModal={showAddModal}
                  setShowAddModal={setShowAddModal}
                  newGameName={newGameName}
                  setNewGameName={setNewGameName}
                  newGameIcon={newGameIcon}
                  setNewGameIcon={setNewGameIcon}
                  handleCreateGame={addGame}
                  settingsGameId={settingsGameId}
                  setSettingsGameId={setSettingsGameId}
                  updateGameSettings={updateGameSettings}
                />
              )}
              {activeTab === "game-manager" && (
                <GameManagerTab
                  configs={miniGameConfigs}
                  onUpdateConfig={handleUpdateMiniGameConfig}
                  currentStore={currentStore}
                />
              )}
              {activeTab === "audit-logs" && <AuditLogsTab />}
            </>
          )}
        </section>
      </main>

      <CreateStoreModal
        isOpen={showCreateStoreModal}
        onClose={() => setShowCreateStoreModal(false)}
        onStoreCreated={handleStoreCreated}
      />
    </div>
  </AdminLoginGuard>
  );
}
