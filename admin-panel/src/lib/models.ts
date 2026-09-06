import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Store ────────────────────────────────────────────────
export interface IStore extends Document {
  storeName: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  plan: "Starter" | "Pro Store" | "Enterprise";
  status: "Active" | "Trialing" | "Suspended";
  walletBalance: number;
  totalScans: number;
  churnRisk: "Low" | "Medium" | "High";
  aiCreditsUsed: number;
  whiteLabelOverride: boolean;
  watermarkRemoved: boolean;
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    storeName: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerEmail: { type: String, required: true },
    ownerName: { type: String, required: true },
    plan: { type: String, enum: ["Starter", "Pro Store", "Enterprise"], default: "Starter" },
    status: { type: String, enum: ["Active", "Trialing", "Suspended"], default: "Active" },
    walletBalance: { type: Number, default: 0 },
    totalScans: { type: Number, default: 0 },
    churnRisk: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    aiCreditsUsed: { type: Number, default: 0 },
    whiteLabelOverride: { type: Boolean, default: false },
    watermarkRemoved: { type: Boolean, default: false },
    joinedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

StoreSchema.index({ ownerEmail: 1 });
StoreSchema.index({ status: 1, plan: 1 });

export const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

// ─── User ─────────────────────────────────────────────────
export interface IUser extends Document {
  storeId: mongoose.Types.ObjectId | null;
  guestId?: string;
  email: string;
  name: string;
  role: "super_admin" | "store_admin" | "customer";
  passwordHash: string;
  avatarUrl?: string;
  phone?: string;
  lastLoginAt?: Date;
  dailyPlayCounts: Record<string, Record<string, number>>;
  totalCafePoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", default: null },
    guestId: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["super_admin", "store_admin", "customer"], required: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    phone: { type: String },
    lastLoginAt: { type: Date },
    dailyPlayCounts: { type: Schema.Types.Mixed, default: {} },
    totalCafePoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ storeId: 1, role: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// ─── MiniGameConfig ───────────────────────────────────────
export interface IRewardTier {
  id: string;
  pointThreshold: number;
  rewardName: string;
  rewardDescription: string;
  rewardType: "item" | "discount" | "voucher";
  discountPercent?: number;
  voucherCode?: string;
}

export interface IMiniGameConfig extends Document {
  storeId: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  icon: string;
  enabled: boolean;
  difficulty: "easy" | "medium" | "hard" | "insane";
  maxDailyPlays: number;
  difficultyParams: Record<string, Record<string, number>>;
  rewardTiers: IRewardTier[];
  createdAt: Date;
  updatedAt: Date;
}

const RewardTierSchema = new Schema<IRewardTier>(
  {
    id: { type: String, required: true },
    pointThreshold: { type: Number, required: true },
    rewardName: { type: String, default: "" },
    rewardDescription: { type: String, default: "" },
    rewardType: { type: String, enum: ["item", "discount", "voucher"], default: "item" },
    discountPercent: { type: Number },
    voucherCode: { type: String },
  },
  { _id: false }
);

const MiniGameConfigSchema = new Schema<IMiniGameConfig>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard", "insane"], default: "medium" },
    maxDailyPlays: { type: Number, default: 0 },
    difficultyParams: { type: Schema.Types.Mixed, default: {} },
    rewardTiers: { type: [RewardTierSchema], default: [] },
  },
  { timestamps: true }
);

MiniGameConfigSchema.index({ storeId: 1, slug: 1 }, { unique: true });
MiniGameConfigSchema.index({ enabled: 1 });

export const MiniGameConfig: Model<IMiniGameConfig> =
  mongoose.models.MiniGameConfig || mongoose.model<IMiniGameConfig>("MiniGameConfig", MiniGameConfigSchema);

// ─── GameSession ──────────────────────────────────────────
export interface IGameSession extends Document {
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  gameSlug: string;
  difficulty: string;
  score: number;
  cafePointsEarned: number;
  duration: number;
  combo: number;
  rewardEarned?: {
    tierId: string;
    rewardName: string;
    claimed: boolean;
  };
  playedAt: Date;
}

const GameSessionSchema = new Schema<IGameSession>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  gameSlug: { type: String, required: true },
  difficulty: { type: String, required: true },
  score: { type: Number, required: true },
  cafePointsEarned: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  combo: { type: Number, default: 0 },
  rewardEarned: {
    tierId: { type: String },
    rewardName: { type: String },
    claimed: { type: Boolean, default: false },
  },
  playedAt: { type: Date, default: Date.now },
});

GameSessionSchema.index({ storeId: 1, playedAt: -1 });
GameSessionSchema.index({ userId: 1, playedAt: -1 });
GameSessionSchema.index({ gameSlug: 1, storeId: 1, playedAt: -1 });

export const GameSession: Model<IGameSession> =
  mongoose.models.GameSession || mongoose.model<IGameSession>("GameSession", GameSessionSchema);

// ─── RewardClaim ──────────────────────────────────────────
export interface IRewardClaim extends Document {
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  gameSlug: string;
  rewardName: string;
  rewardDescription: string;
  rewardType: "item" | "discount" | "voucher";
  status: "pending" | "claimed" | "expired";
  claimCode: string;
  earnedAt: Date;
  claimedAt?: Date;
  expiresAt: Date;
}

const RewardClaimSchema = new Schema<IRewardClaim>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: "GameSession", required: true },
  gameSlug: { type: String, required: true },
  rewardName: { type: String, required: true },
  rewardDescription: { type: String, default: "" },
  rewardType: { type: String, enum: ["item", "discount", "voucher"], default: "item" },
  status: { type: String, enum: ["pending", "claimed", "expired"], default: "pending" },
  claimCode: { type: String, required: true, unique: true },
  earnedAt: { type: Date, default: Date.now },
  claimedAt: { type: Date },
  expiresAt: { type: Date, required: true },
});

RewardClaimSchema.index({ storeId: 1, status: 1 });
RewardClaimSchema.index({ userId: 1, status: 1 });
RewardClaimSchema.index({ expiresAt: 1 });

export const RewardClaim: Model<IRewardClaim> =
  mongoose.models.RewardClaim || mongoose.model<IRewardClaim>("RewardClaim", RewardClaimSchema);

// ─── Campaign ─────────────────────────────────────────────
export interface ICampaign extends Document {
  storeId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  icon: string;
  status: "Active" | "Inactive";
  scans: number;
  winRate: number;
  reward: string;
  qrCodeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    icon: { type: String, default: "🎡" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    scans: { type: Number, default: 0 },
    winRate: { type: Number, default: 10 },
    reward: { type: String, default: "" },
    qrCodeUrl: { type: String },
  },
  { timestamps: true }
);

CampaignSchema.index({ storeId: 1, status: 1 });

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);

// ─── StoreBranding ────────────────────────────────────────
export interface IStoreBranding extends Document {
  storeId: mongoose.Types.ObjectId;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  domainVerified: boolean;
  fontFamily: string;
  darkMode: boolean;
  watermarkVisible: boolean;
  updatedAt: Date;
}

const StoreBrandingSchema = new Schema<IStoreBranding>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, unique: true },
    primaryColor: { type: String, default: "#FF4C29" },
    secondaryColor: { type: String, default: "#332FD0" },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    customDomain: { type: String, sparse: true },
    domainVerified: { type: Boolean, default: false },
    fontFamily: { type: String, default: "Inter" },
    darkMode: { type: Boolean, default: false },
    watermarkVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// StoreBrandingSchema indexes defined in field options

export const StoreBranding: Model<IStoreBranding> =
  mongoose.models.StoreBranding || mongoose.model<IStoreBranding>("StoreBranding", StoreBrandingSchema);

// ─── AuditLog ─────────────────────────────────────────────
export interface IAuditLog extends Document {
  storeId?: mongoose.Types.ObjectId;
  actorName: string;
  actorEmail: string;
  actorRole: "Super Admin" | "Store Admin";
  ipAddress: string;
  action: string;
  actionCategory: "SECURITY" | "BILLING" | "BRANDING" | "CAMPAIGN" | "SYSTEM";
  targetType: string;
  targetName: string;
  details: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store" },
  actorName: { type: String, required: true },
  actorEmail: { type: String, required: true },
  actorRole: { type: String, enum: ["Super Admin", "Store Admin"], required: true },
  ipAddress: { type: String, required: true },
  action: { type: String, required: true },
  actionCategory: { type: String, enum: ["SECURITY", "BILLING", "BRANDING", "CAMPAIGN", "SYSTEM"], required: true },
  targetType: { type: String, required: true },
  targetName: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ storeId: 1, timestamp: -1 });
AuditLogSchema.index({ actionCategory: 1 });
AuditLogSchema.index({ actorRole: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

// ─── TopUpRequest (Bank Transfer & UPI) ────────────────────
export interface ITopUpRequest extends Document {
  storeId: mongoose.Types.ObjectId;
  storeName: string;
  creditsRequested: number;
  amountInINR: number;
  paymentMethod: "bank_transfer" | "upi" | "cash";
  referenceId: string; // UTR or UPI transaction reference
  status: "pending" | "approved" | "rejected";
  notes?: string;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopUpRequestSchema = new Schema<ITopUpRequest>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    storeName: { type: String, required: true },
    creditsRequested: { type: Number, required: true },
    amountInINR: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "cash"],
      default: "upi",
    },
    referenceId: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: { type: String, default: "" },
    approvedAt: { type: Date },
    approvedBy: { type: String },
  },
  { timestamps: true }
);

TopUpRequestSchema.index({ storeId: 1, status: 1 });
TopUpRequestSchema.index({ status: 1, createdAt: -1 });
TopUpRequestSchema.index({ referenceId: 1 });

export const TopUpRequest: Model<ITopUpRequest> =
  mongoose.models.TopUpRequest ||
  mongoose.model<ITopUpRequest>("TopUpRequest", TopUpRequestSchema);

