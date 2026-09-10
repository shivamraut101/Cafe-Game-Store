export type UserRole = "super_admin" | "store_admin";
export type TierLevel = "Starter" | "Pro Store" | "Enterprise";

export interface Game {
  id: string;
  name: string;
  type: string;
  icon: string;
  status: "Active" | "Inactive";
  scans: number;
  winRate: number;
  reward: string;
  shadowColor: string;
}

export type GameDifficulty = "easy" | "medium" | "hard" | "insane";

export interface GameRewardTier {
  id: string;
  pointThreshold: number;
  rewardName: string;
  rewardDescription: string;
}

export interface MiniGameConfig {
  id: string;
  slug: string;
  name: string;
  icon: string;
  enabled: boolean;
  difficulty: GameDifficulty;
  maxDailyPlays: number; // 0 = unlimited
  rewardTiers: GameRewardTier[];
  creditCost?: number;
  stats: {
    totalPlays?: number;
    totalPlaysToday: number;
    avgScore: number;
    rewardsClaimed: number;
  };
}

export interface MerchantAccount {
  storeName: string;
  ownerName: string;
  email: string;
  plan: TierLevel;
  status: "Active" | "Pending" | "Suspended";
  mrr: number;
  joinDate: string;
  churnRisk?: "Low" | "Medium" | "High";
  aiCreditsUsed?: number;
}
