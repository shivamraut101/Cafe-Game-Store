import "dotenv/config";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import * as Models from "../src/lib/models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cafe-game-store";

async function seed() {
  console.log("🌱 Connecting to MongoDB Atlas...");
  console.log(`URI: ${MONGODB_URI.substring(0, 30)}...`);

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB Atlas!\n");

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
  console.log("🗑️  Clearing existing data...");
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

  // ─── 1. Stores ──────────────────────────────────────────
  console.log("🏪 Creating stores...");
  const stores = await Store.insertMany([
    {
      storeName: "Brew & Bites Cafe (Main Branch)",
      slug: "brew-bites-main",
      ownerEmail: "owner@brewbites.com",
      ownerName: "Sarah Jenkins",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 1455,
      totalScans: 12400,
      churnRisk: "Low",
      aiCreditsUsed: 4250,
      whiteLabelOverride: true,
      joinedDate: new Date("2026-03-12"),
    },
    {
      storeName: "Downtown Tacos & Tequila",
      slug: "downtown-tacos",
      ownerEmail: "manager@downtowntacos.com",
      ownerName: "Miguel Santos",
      plan: "Enterprise",
      status: "Active",
      walletBalance: 8200,
      totalScans: 45100,
      churnRisk: "Low",
      aiCreditsUsed: 12500,
      whiteLabelOverride: true,
      watermarkRemoved: true,
      joinedDate: new Date("2026-01-20"),
    },
    {
      storeName: "Pixel Arcade Cafe",
      slug: "pixel-arcade",
      ownerEmail: "contact@pixelarcade.io",
      ownerName: "Alex Rivera",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 520,
      totalScans: 9800,
      churnRisk: "High",
      aiCreditsUsed: 200,
      joinedDate: new Date("2026-05-14"),
    },
    {
      storeName: "Corner Bakery & Espresso",
      slug: "corner-bakery",
      ownerEmail: "hello@cornerbakery.com",
      ownerName: "Emily Chen",
      plan: "Starter",
      status: "Trialing",
      walletBalance: 200,
      totalScans: 180,
      churnRisk: "Medium",
      aiCreditsUsed: 50,
      joinedDate: new Date("2026-07-28"),
    },
  ]);
  console.log(`   ✅ ${stores.length} stores created`);

  // ─── 2. Users ───────────────────────────────────────────
  console.log("👤 Creating users...");
  const users = await User.insertMany([
    {
      email: "koushik@forstore.app",
      name: "Koushik (Super Admin)",
      role: "super_admin",
      passwordHash: "$2b$10$placeholder_super_admin",
      totalCafePoints: 0,
    },
    {
      storeId: stores[0]._id,
      email: "manager@brewbites.com",
      name: "Sarah Jenkins",
      role: "store_admin",
      passwordHash: "$2b$10$placeholder_store1",
      totalCafePoints: 0,
    },
    {
      storeId: stores[0]._id,
      email: "customer1@gmail.com",
      name: "Raj Patel",
      role: "customer",
      passwordHash: "$2b$10$placeholder_cust1",
      totalCafePoints: 1240,
      dailyPlayCounts: {},
    },
    {
      storeId: stores[0]._id,
      email: "customer2@gmail.com",
      name: "Priya Sharma",
      role: "customer",
      passwordHash: "$2b$10$placeholder_cust2",
      totalCafePoints: 860,
      dailyPlayCounts: {},
    },
    {
      storeId: stores[1]._id,
      email: "manager@downtowntacos.com",
      name: "Miguel Santos",
      role: "store_admin",
      passwordHash: "$2b$10$placeholder_store2",
      totalCafePoints: 0,
    },
  ]);
  console.log(`   ✅ ${users.length} users created`);

  // ─── 3. MiniGameConfigs ─────────────────────────────────
  console.log("🎮 Creating mini-game configs...");
  const gameConfigs = await MiniGameConfig.insertMany([
    {
      storeId: stores[0]._id,
      slug: "coffee-tower",
      name: "Coffee Stack Tower",
      icon: "☕",
      enabled: true,
      difficulty: "medium",
      maxDailyPlays: 0,
      difficultyParams: {
        easy: { speed: 1.5, startWidth: 200 },
        medium: { speed: 2.5, startWidth: 180 },
        hard: { speed: 3.5, startWidth: 160 },
        insane: { speed: 5.0, startWidth: 140 },
      },
      rewardTiers: [
        { id: "t1", pointThreshold: 5, rewardName: "Free Cookie", rewardDescription: "Any cookie from the display", rewardType: "item" },
        { id: "t2", pointThreshold: 15, rewardName: "Free Coffee", rewardDescription: "Any regular size coffee", rewardType: "item" },
        { id: "t3", pointThreshold: 30, rewardName: "20% Off Order", rewardDescription: "20% discount on total bill", rewardType: "discount", discountPercent: 20 },
      ],
    },
    {
      storeId: stores[0]._id,
      slug: "flappy-barista",
      name: "Flappy Barista",
      icon: "🐦",
      enabled: true,
      difficulty: "medium",
      maxDailyPlays: 5,
      difficultyParams: {
        easy: { gap: 180, speed: 1.2 },
        medium: { gap: 155, speed: 1.6 },
        hard: { gap: 130, speed: 2.2 },
        insane: { gap: 110, speed: 3.0 },
      },
      rewardTiers: [
        { id: "t4", pointThreshold: 10, rewardName: "Free Pastry", rewardDescription: "Any pastry item", rewardType: "item" },
        { id: "t5", pointThreshold: 25, rewardName: "Buy 1 Get 1 Free", rewardDescription: "On any drink", rewardType: "item" },
      ],
    },
    {
      storeId: stores[0]._id,
      slug: "barista-catch",
      name: "Barista Catch",
      icon: "🍽️",
      enabled: true,
      difficulty: "easy",
      maxDailyPlays: 0,
      difficultyParams: {
        easy: { fallSpeed: 1.5, spawnInterval: 65 },
        medium: { fallSpeed: 2.2, spawnInterval: 55 },
        hard: { fallSpeed: 3.2, spawnInterval: 35 },
        insane: { fallSpeed: 4.5, spawnInterval: 20 },
      },
      rewardTiers: [
        { id: "t6", pointThreshold: 100, rewardName: "10% Off", rewardDescription: "10% off next order", rewardType: "discount", discountPercent: 10 },
        { id: "t7", pointThreshold: 300, rewardName: "Free Combo Meal", rewardDescription: "Any combo from the lunch menu", rewardType: "item" },
        { id: "t8", pointThreshold: 500, rewardName: "VIP Gold Card", rewardDescription: "Month-long 15% discount card", rewardType: "voucher" },
      ],
    },
  ]);
  console.log(`   ✅ ${gameConfigs.length} game configs created`);

  // ─── 4. Campaigns ───────────────────────────────────────
  console.log("📢 Creating campaigns...");
  const campaigns = await Campaign.insertMany([
    { storeId: stores[0]._id, name: "Spin to Win", type: "Wheel", icon: "🎡", status: "Active", scans: 1240, winRate: 15, reward: "Free Coffee" },
    { storeId: stores[0]._id, name: "Instant Lottery", type: "Scratch", icon: "🎟️", status: "Active", scans: 950, winRate: 8, reward: "10% Off Pastry" },
    { storeId: stores[0]._id, name: "Slot Machine", type: "Slots", icon: "🎰", status: "Active", scans: 2100, winRate: 12, reward: "Free Size Upgrade" },
    { storeId: stores[0]._id, name: "Catch & Win", type: "Catch", icon: "🧺", status: "Inactive", scans: 430, winRate: 20, reward: "Buy 1 Get 1 Free" },
    { storeId: stores[0]._id, name: "Snakes & Ladders", type: "Board", icon: "🐍", status: "Active", scans: 880, winRate: 10, reward: "Secret Item" },
  ]);
  console.log(`   ✅ ${campaigns.length} campaigns created`);

  // ─── 5. StoreBranding ───────────────────────────────────
  console.log("🎨 Creating branding...");
  await StoreBranding.create({
    storeId: stores[0]._id,
    primaryColor: "#FF4C29",
    secondaryColor: "#332FD0",
    fontFamily: "Inter",
    darkMode: false,
    watermarkVisible: true,
  });
  console.log("   ✅ 1 branding config created");

  // ─── 6. Sample Game Sessions ────────────────────────────
  console.log("🕹️  Creating sample game sessions...");
  const sessionData = [];
  const gameTypes = ["coffee-tower", "flappy-barista", "barista-catch"];
  const customerIds = [users[2]._id, users[3]._id];
  for (let i = 0; i < 50; i++) {
    const gameSlug = gameTypes[i % 3];
    const score = Math.floor(Math.random() * (gameSlug === "barista-catch" ? 400 : 25)) + 1;
    sessionData.push({
      storeId: stores[0]._id,
      userId: customerIds[i % 2],
      gameSlug,
      difficulty: "medium",
      score,
      cafePointsEarned: score * 10,
      duration: 20 + Math.floor(Math.random() * 120),
      combo: Math.floor(Math.random() * 8),
      playedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
    });
  }
  const sessions = await GameSession.insertMany(sessionData);
  console.log(`   ✅ ${sessions.length} game sessions created`);

  // ─── 7. Sample Audit Logs ──────────────────────────────
  console.log("📜 Creating audit logs...");
  const auditLogs = await AuditLog.insertMany([
    {
      storeId: stores[0]._id,
      actorName: "Koushik (Super Admin)",
      actorEmail: "koushik@forstore.app",
      actorRole: "Super Admin",
      ipAddress: "157.48.22.19",
      action: "SUPER_ADMIN_CREDIT_GRANT",
      actionCategory: "BILLING",
      targetType: "Wallet",
      targetName: "Brew & Bites Cafe (Main Branch)",
      details: "Granted +1,000 bonus scan credits to store wallet.",
    },
    {
      storeId: stores[0]._id,
      actorName: "Sarah Jenkins (Store Admin)",
      actorEmail: "manager@brewbites.com",
      actorRole: "Store Admin",
      ipAddress: "192.168.1.104",
      action: "GAME_CONFIG_UPDATE",
      actionCategory: "CAMPAIGN",
      targetType: "Game Campaign",
      targetName: "Coffee Stack Tower",
      details: "Changed difficulty from Easy to Medium for Coffee Stack Tower.",
    },
    {
      actorName: "Koushik (Super Admin)",
      actorEmail: "koushik@forstore.app",
      actorRole: "Super Admin",
      ipAddress: "157.48.22.19",
      action: "SUPER_ADMIN_IMPERSONATE",
      actionCategory: "SECURITY",
      targetType: "Store Account",
      targetName: "Brew & Bites Cafe (Main Branch)",
      details: "Super Admin initiated portal impersonation session.",
    },
  ]);
  console.log(`   ✅ ${auditLogs.length} audit logs created`);

  // ─── Summary ────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Database summary:");
  console.log(`   Stores:           ${await Store.countDocuments()}`);
  console.log(`   Users:            ${await User.countDocuments()}`);
  console.log(`   MiniGameConfigs:  ${await MiniGameConfig.countDocuments()}`);
  console.log(`   Campaigns:        ${await Campaign.countDocuments()}`);
  console.log(`   StoreBranding:    ${await StoreBranding.countDocuments()}`);
  console.log(`   GameSessions:     ${await GameSession.countDocuments()}`);
  console.log(`   RewardClaims:     ${await RewardClaim.countDocuments()}`);
  console.log(`   AuditLogs:        ${await AuditLog.countDocuments()}`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected. Done!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
