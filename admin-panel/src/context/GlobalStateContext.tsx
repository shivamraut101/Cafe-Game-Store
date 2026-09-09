"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserRole, TierLevel, Game, MerchantAccount } from "../types";
import { logAction } from "../lib/auditLogger";
import { isClientProd } from "../lib/appEnv";

interface GlobalStateContextType {
  role: UserRole;
  setRole: (r: UserRole) => void;
  tier: TierLevel;
  setTier: (t: TierLevel) => void;
  impersonatedStore: string | null;
  setImpersonatedStore: (s: string | null) => void;
  storesList: string[];
  setStoresList: (s: string[]) => void;
  currentStore: string;
  setCurrentStore: (s: string) => void;
  games: Game[];
  setGames: (g: Game[]) => void;
  handleStoreCreated: (newStore: MerchantAccount) => void;
  handleImpersonateStore: (storeName: string, storeTier: TierLevel) => void;
  handleExitImpersonation: () => void;
  toggleGameStatus: (id: string) => void;
  handleRoleChange: (r: UserRole) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("store_admin");
  const [tier, setTier] = useState<TierLevel>("Pro Store");
  const [impersonatedStore, setImpersonatedStore] = useState<string | null>(null);

  const [storesList, setStoresList] = useState<string[]>(
    isClientProd()
      ? []
      : [
          "Brew & Bites Cafe (Main Branch)",
          "Downtown Tacos & Tequila",
          "Pixel Arcade Cafe",
        ]
  );
  const [currentStore, setCurrentStore] = useState(storesList[0] || "");

  const [games, setGames] = useState<Game[]>(
    isClientProd()
      ? []
      : [
          { id: "1", name: "Spin to Win", type: "Wheel", icon: "🎡", status: "Active", scans: 1240, winRate: 15, reward: "Free Coffee", shadowColor: "shadow-flat-blue" },
          { id: "2", name: "Instant Lottery", type: "Scratch", icon: "🎟️", status: "Active", scans: 950, winRate: 8, reward: "10% Off Pastry", shadowColor: "shadow-flat-orange" },
          { id: "3", name: "Slot Machine", type: "Slots", icon: "🎰", status: "Active", scans: 2100, winRate: 12, reward: "Free Size Upgrade", shadowColor: "shadow-flat-pink" },
        ]
  );

  const handleStoreCreated = (newStore: MerchantAccount) => {
    setStoresList([newStore.storeName, ...storesList]);
    setCurrentStore(newStore.storeName);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "super_admin") {
      router.push("/super-admin/merchants");
    } else {
      router.push("/store-admin/overview");
    }
  };

  const handleImpersonateStore = (storeName: string, storeTier: TierLevel) => {
    setImpersonatedStore(storeName);
    setCurrentStore(storeName);
    setTier(storeTier);
    setRole("store_admin");
    router.push("/store-admin/overview");
  };

  const handleExitImpersonation = () => {
    setImpersonatedStore(null);
    setRole("super_admin");
    router.push("/super-admin/merchants");
  };

  const toggleGameStatus = (id: string) => {
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

  return (
    <GlobalStateContext.Provider value={{
      role, setRole, tier, setTier, impersonatedStore, setImpersonatedStore,
      storesList, setStoresList, currentStore, setCurrentStore,
      games, setGames, handleStoreCreated, handleImpersonateStore,
      handleExitImpersonation, toggleGameStatus, handleRoleChange
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}
