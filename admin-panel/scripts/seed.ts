import "dotenv/config";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import * as Models from "../src/lib/models";
import { getResolvedMongoURI } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function seed() {
  const cliArg = process.argv[2]?.toLowerCase();
  const envMode = (cliArg || process.env.MONGODB_ENV || "demo").toLowerCase();
  process.env.MONGODB_ENV = envMode;
  process.env.APP_ENV = envMode;
  const mongoUri = getResolvedMongoURI();

  console.log(`🌱 Connecting to MongoDB Atlas [${envMode.toUpperCase()} DATABASE]...`);
  console.log(`URI: ${mongoUri.substring(0, 45)}...`);

  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to ${envMode.toUpperCase()} Database on MongoDB Atlas!\n`);


  const {
    Store,
    User,
    MiniGameConfig,
    Campaign,
    StoreBranding,
    AuditLog,
    GameSession,
    RewardClaim,
  } = Models;

  // Clear existing data
  console.log(`🗑️  Clearing existing data from [${envMode.toUpperCase()} DB]...`);
  await Promise.all([
    Store.deleteMany({}),
    User.deleteMany({}),
    MiniGameConfig.deleteMany({}),
    Campaign.deleteMany({}),
    StoreBranding.deleteMany({}),
    AuditLog.deleteMany({}),
    GameSession.deleteMany({}),
    RewardClaim.deleteMany({}),
  ]);

  if (envMode === "prod" || envMode === "production") {
    console.log("🔒 Production Mode: Creating ONLY Super Admin account. No mock stores or fake data will be inserted.");
    const superAdmin = await User.create({
      email: process.env.SUPER_ADMIN_EMAIL || "koushik@forstore.app",
      name: "Super Admin",
      role: "super_admin",
      passwordHash: hashPassword(process.env.SUPER_ADMIN_PASSWORD || "super123"),
      totalCafePoints: 0,
    });
    console.log(`   ✅ Production Super Admin created (${superAdmin.email})`);
    console.log("\n🎉 Production database initialized clean with 0 mock stores and 0 fake vouchers!\n");
    await mongoose.disconnect();
    return;
  }

  // ─── 1. Stores (Pre-Funded for DEMO Mode) ──────────────
  console.log("🏪 Creating 4 pre-funded demo cafe stores...");
  const stores = await Store.insertMany([
    {
      storeName: "Brew & Bites Cafe (Main Branch)",
      slug: "brew-bites-main",
      ownerEmail: "owner@brewbites.com",
      ownerName: "Sarah Jenkins",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 1000,
      totalScans: 4280,
      totalPlays: 2450,
      sponsoredPlays: 230,
      churnRisk: "Low",
      aiCreditsUsed: 42,
      whiteLabelOverride: true,
      watermarkRemoved: false,
      rewardCooldownDays: 7,
      dynamicDifficultyScaling: true,
      adminPin: "9900",
      joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      storeName: "Downtown Tacos & Tequila",
      slug: "downtown-tacos",
      ownerEmail: "manager@downtowntacos.com",
      ownerName: "Miguel Santos",
      plan: "Enterprise",
      status: "Active",
      walletBalance: 2500,
      totalScans: 6810,
      totalPlays: 4120,
      sponsoredPlays: 480,
      churnRisk: "Low",
      aiCreditsUsed: 89,
      whiteLabelOverride: true,
      watermarkRemoved: true,
      rewardCooldownDays: 5,
      dynamicDifficultyScaling: true,
      adminPin: "9900",
      joinedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      storeName: "Pixel Arcade Cafe",
      slug: "pixel-arcade",
      ownerEmail: "contact@pixelarcade.io",
      ownerName: "Alex Rivera",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 1500,
      totalScans: 3120,
      totalPlays: 1890,
      sponsoredPlays: 150,
      churnRisk: "Low",
      aiCreditsUsed: 25,
      whiteLabelOverride: true,
      watermarkRemoved: false,
      joinedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      storeName: "Corner Bakery & Espresso",
      slug: "corner-bakery",
      ownerEmail: "hello@cornerbakery.com",
      ownerName: "Emily Chen",
      plan: "Starter",
      status: "Active",
      walletBalance: 800,
      totalScans: 1200,
      totalPlays: 850,
      sponsoredPlays: 90,
      churnRisk: "Low",
      aiCreditsUsed: 10,
      joinedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log(`   ✅ ${stores.length} pre-funded stores created (Brew & Bites preloaded with 1,000 credits / 100 free plays)`);

  // ─── 2. Auth Users (Store Admins and Customers ONLY in DEMO) ──
  console.log("👤 Creating demo store admin and customer users...");
  const users = await User.insertMany([
    {
      storeId: stores[0]._id,
      email: "manager@brewbites.com",
      name: "Sarah Jenkins",
      role: "store_admin",
      passwordHash: hashPassword("admin123"),
      totalCafePoints: 0,
    },
    {
      storeId: stores[1]._id,
      email: "manager@downtowntacos.com",
      name: "Miguel Santos",
      role: "store_admin",
      passwordHash: hashPassword("admin123"),
      totalCafePoints: 0,
    },
    {
      storeId: stores[0]._id,
      email: "customer@forstore.app",
      name: "Sam VIP Player",
      role: "customer",
      passwordHash: hashPassword("guest123"),
      totalCafePoints: 350,
    },
  ]);
  console.log(`   ✅ ${users.length} auth users created`);

  // ─── 3. MiniGameConfigs for all 4 stores ────────────────
  console.log("🎮 Provisioning default mini-game configs for all stores...");
  const gameConfigsToInsert = [];
  for (const s of stores) {
    gameConfigsToInsert.push(
      {
        storeId: s._id,
        slug: "coffee-tower",
        name: "Coffee Stack Tower",
        icon: "☕",
        enabled: true,
        difficulty: "medium",
        maxDailyPlays: 0,
        rewardTiers: [
          { id: "t1", pointThreshold: 5, rewardName: "Free Cookie", rewardDescription: "Any cookie from display", rewardType: "item" },
          { id: "t2", pointThreshold: 15, rewardName: "Free Coffee", rewardDescription: "Any regular size coffee", rewardType: "item" },
          { id: "t3", pointThreshold: 30, rewardName: "20% Off Order", rewardDescription: "20% discount on total bill", rewardType: "discount", discountPercent: 20 },
        ],
      },
      {
        storeId: s._id,
        slug: "flappy-barista",
        name: "Flappy Barista",
        icon: "🐦",
        enabled: true,
        difficulty: "medium",
        maxDailyPlays: 5,
        rewardTiers: [
          { id: "t4", pointThreshold: 10, rewardName: "Free Pastry", rewardDescription: "Any pastry item", rewardType: "item" },
          { id: "t5", pointThreshold: 25, rewardName: "Buy 1 Get 1 Free", rewardDescription: "On any drink", rewardType: "item" },
        ],
      },
      {
        storeId: s._id,
        slug: "barista-catch",
        name: "Barista Catch",
        icon: "🍽️",
        enabled: true,
        difficulty: "easy",
        maxDailyPlays: 0,
        rewardTiers: [
          { id: "t6", pointThreshold: 100, rewardName: "10% Off", rewardDescription: "10% off next order", rewardType: "discount", discountPercent: 10 },
          { id: "t7", pointThreshold: 300, rewardName: "Free Combo Meal", rewardDescription: "Any combo from lunch menu", rewardType: "item" },
        ],
      }
    );
  }
  const gameConfigs = await MiniGameConfig.insertMany(gameConfigsToInsert);
  console.log(`   ✅ ${gameConfigs.length} game configs provisioned`);

  // ─── 4. Campaigns ───────────────────────────────────────
  console.log("📢 Provisioning sample marketing campaigns...");
  const campaigns = await Campaign.insertMany([
    {
      storeId: stores[0]._id,
      name: "Coffee Stack Tower Challenge",
      type: "Stack Game",
      icon: "☕",
      status: "Active",
      scans: 1420,
      winRate: 18,
      reward: "Free Regular Coffee at 15 pts",
    },
    {
      storeId: stores[0]._id,
      name: "Morning Flappy Rush",
      type: "Arcade Flappy",
      icon: "🐦",
      status: "Active",
      scans: 980,
      winRate: 12,
      reward: "Free Fresh Pastry at 10 pts",
    },
    {
      storeId: stores[0]._id,
      name: "Catch & Save VIP",
      type: "Falling Catch",
      icon: "🍽️",
      status: "Active",
      scans: 1880,
      winRate: 22,
      reward: "20% Off Total Bill at 100 pts",
    },
    {
      storeId: stores[1]._id,
      name: "Taco Stack Fiesta",
      type: "Stack Game",
      icon: "🌮",
      status: "Active",
      scans: 3410,
      winRate: 15,
      reward: "Free Taco Trio at 20 pts",
    },
    {
      storeId: stores[1]._id,
      name: "Spicy Catch Bonanza",
      type: "Falling Catch",
      icon: "🌶️",
      status: "Active",
      scans: 2200,
      winRate: 25,
      reward: "Free Churro Dessert at 150 pts",
    },
    {
      storeId: stores[2]._id,
      name: "Retro Pixel Run",
      type: "Retro Arcade",
      icon: "👾",
      status: "Active",
      scans: 2150,
      winRate: 20,
      reward: "1 Hour Free Game Pass at 30 pts",
    },
  ]);
  console.log(`   ✅ ${campaigns.length} campaigns provisioned`);

  // ─── 5. Store Branding ──────────────────────────────────
  console.log("🎨 Creating store branding...");
  await StoreBranding.insertMany([
    {
      storeId: stores[0]._id,
      primaryColor: "#FF4C29",
      secondaryColor: "#332FD0",
      fontFamily: "Inter",
      darkMode: false,
      watermarkVisible: false,
    },
    {
      storeId: stores[1]._id,
      primaryColor: "#E11D48",
      secondaryColor: "#F59E0B",
      fontFamily: "Inter",
      darkMode: false,
      watermarkVisible: false,
    },
    {
      storeId: stores[2]._id,
      primaryColor: "#8B5CF6",
      secondaryColor: "#06B6D4",
      fontFamily: "Inter",
      darkMode: true,
      watermarkVisible: true,
    },
    {
      storeId: stores[3]._id,
      primaryColor: "#D97706",
      secondaryColor: "#475569",
      fontFamily: "Inter",
      darkMode: false,
      watermarkVisible: true,
    },
  ]);
  console.log(`   ✅ 4 store branding records created`);

  // ─── 6. Sample Reward Claims & Staff Redemptions ────────
  console.log("🎁 Creating sample reward claims...");
  const dummySession = await GameSession.create({
    storeId: stores[0]._id,
    userId: users[2]._id,
    gameSlug: "coffee-tower",
    difficulty: "medium",
    score: 18,
    cafePointsEarned: 18,
    duration: 45,
    combo: 3,
    billingStatus: "billed",
    creditsBilled: 1,
  });

  await RewardClaim.insertMany([
    {
      storeId: stores[0]._id,
      userId: users[2]._id,
      sessionId: dummySession._id,
      gameSlug: "coffee-tower",
      rewardName: "Free Regular Coffee",
      rewardDescription: "Any regular drip or espresso coffee",
      rewardType: "item",
      status: "claimed",
      claimCode: "BB-8491",
      earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      claimedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      claimedByStaffName: "Sarah Jenkins",
      claimedByStaffId: users[0]._id.toString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      storeId: stores[0]._id,
      userId: users[2]._id,
      sessionId: dummySession._id,
      gameSlug: "coffee-tower",
      rewardName: "Free Fresh Cookie",
      rewardDescription: "Chocolate chip cookie",
      rewardType: "item",
      status: "claimed",
      claimCode: "BB-8492",
      earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      claimedAt: new Date(),
      claimedByStaffName: "Sarah Jenkins",
      claimedByStaffId: users[0]._id.toString(),
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
    {
      storeId: stores[0]._id,
      userId: users[2]._id,
      sessionId: dummySession._id,
      gameSlug: "coffee-tower",
      rewardName: "20% Off Order",
      rewardDescription: "20% discount on entire bill",
      rewardType: "discount",
      status: "pending",
      claimCode: "CLAIM-8821",
      earnedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log(`   ✅ 3 sample reward claims created (2 claimed by staff, 1 pending)`);

  // ─── 7. Sample Audit Logs ────────────────────────────────
  console.log("📜 Creating demo audit logs...");
  await AuditLog.insertMany([
    {
      storeId: stores[0]._id,
      actorName: "Sarah Jenkins",
      actorEmail: "manager@brewbites.com",
      actorRole: "Store Admin",
      ipAddress: "127.0.0.1",
      action: "WALLET_GRANT",
      actionCategory: "BILLING",
      targetType: "Store Wallet",
      targetName: "Brew & Bites Cafe",
      details: "Granted 1,000 wallet credits (100 Free Plays Trial) to Brew & Bites Cafe",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      storeId: stores[0]._id,
      actorName: "Sarah Jenkins",
      actorEmail: "manager@brewbites.com",
      actorRole: "Store Admin",
      ipAddress: "192.168.1.5",
      action: "CAMPAIGN_ACTIVATED",
      actionCategory: "CAMPAIGN",
      targetType: "Game Campaign",
      targetName: "Coffee Stack Tower Challenge",
      details: "Activated Coffee Stack Tower with tier rewards: Free Coffee, Free Cookie",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      storeId: stores[0]._id,
      actorName: "Sarah Jenkins",
      actorEmail: "manager@brewbites.com",
      actorRole: "Store Admin",
      ipAddress: "192.168.1.5",
      action: "STAFF_VOUCHER_CLAIM",
      actionCategory: "SECURITY",
      targetType: "Voucher Code",
      targetName: "BB-8491",
      details: "Redeemed Free Regular Coffee at counter for guest player",
      timestamp: new Date(),
    },
  ]);
  console.log(`   ✅ 3 demo audit logs created`);

  // ─── Summary ────────────────────────────────────────────
  console.log(`\n🎉 Pre-Funded Demo Seed Complete! [${envMode.toUpperCase()} DATABASE] summary:`);
  console.log(`   Stores:           ${await Store.countDocuments()}`);
  console.log(`   Users:            ${await User.countDocuments()}`);
  console.log(`   MiniGameConfigs:  ${await MiniGameConfig.countDocuments()}`);
  console.log(`   Campaigns:        ${await Campaign.countDocuments()}`);
  console.log(`   StoreBranding:    ${await StoreBranding.countDocuments()}`);
  console.log(`   GameSessions:     ${await GameSession.countDocuments()}`);
  console.log(`   RewardClaims:     ${await RewardClaim.countDocuments()}`);
  console.log(`   AuditLogs:        ${await AuditLog.countDocuments()}`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected cleanly. Done!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
