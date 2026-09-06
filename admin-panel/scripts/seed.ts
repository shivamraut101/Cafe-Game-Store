import "dotenv/config";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import * as Models from "../src/lib/models";
import { getResolvedMongoURI } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function seed() {
  const envMode = (process.env.MONGODB_ENV || "demo").toLowerCase();
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

  // ─── 1. Stores (Clean 4 Cafes for DEV Mode) ──────────────
  console.log("🏪 Creating 4 clean cafe stores...");
  const stores = await Store.insertMany([
    {
      storeName: "Brew & Bites Cafe (Main Branch)",
      slug: "brew-bites-main",
      ownerEmail: "owner@brewbites.com",
      ownerName: "Sarah Jenkins",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 1000,
      totalScans: 0,
      churnRisk: "Low",
      aiCreditsUsed: 0,
      whiteLabelOverride: true,
      joinedDate: new Date(),
    },
    {
      storeName: "Downtown Tacos & Tequila",
      slug: "downtown-tacos",
      ownerEmail: "manager@downtowntacos.com",
      ownerName: "Miguel Santos",
      plan: "Enterprise",
      status: "Active",
      walletBalance: 2500,
      totalScans: 0,
      churnRisk: "Low",
      aiCreditsUsed: 0,
      whiteLabelOverride: true,
      watermarkRemoved: true,
      joinedDate: new Date(),
    },
    {
      storeName: "Pixel Arcade Cafe",
      slug: "pixel-arcade",
      ownerEmail: "contact@pixelarcade.io",
      ownerName: "Alex Rivera",
      plan: "Pro Store",
      status: "Active",
      walletBalance: 500,
      totalScans: 0,
      churnRisk: "Low",
      aiCreditsUsed: 0,
      joinedDate: new Date(),
    },
    {
      storeName: "Corner Bakery & Espresso",
      slug: "corner-bakery",
      ownerEmail: "hello@cornerbakery.com",
      ownerName: "Emily Chen",
      plan: "Starter",
      status: "Active",
      walletBalance: 200,
      totalScans: 0,
      churnRisk: "Low",
      aiCreditsUsed: 0,
      joinedDate: new Date(),
    },
  ]);
  console.log(`   ✅ ${stores.length} clean stores created`);

  // ─── 2. Auth Users ──────────────────────────────────────
  console.log("👤 Creating admin and guest users...");
  const users = await User.insertMany([
    {
      email: "koushik@forstore.app",
      name: "Koushik (Super Admin)",
      role: "super_admin",
      passwordHash: hashPassword("super123"),
      totalCafePoints: 0,
    },
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
  console.log(`   ✅ ${users.length} auth users created with cryptographically salted passwords`);

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

  // ─── 4. Store Branding ──────────────────────────────────
  console.log("🎨 Creating store branding...");
  for (const s of stores) {
    await StoreBranding.create({
      storeId: s._id,
      primaryColor: "#FF4C29",
      secondaryColor: "#332FD0",
      fontFamily: "Inter",
      darkMode: false,
      watermarkVisible: true,
    });
  }
  console.log(`   ✅ ${stores.length} store branding records created`);

  // ─── Summary ────────────────────────────────────────────
  console.log(`\n🎉 Clean Seed Complete! [${envMode.toUpperCase()} DATABASE] summary:`);
  console.log(`   Stores:           ${await Store.countDocuments()}`);
  console.log(`   Users:            ${await User.countDocuments()}`);
  console.log(`   MiniGameConfigs:  ${await MiniGameConfig.countDocuments()}`);
  console.log(`   Campaigns:        ${await Campaign.countDocuments()}`);
  console.log(`   StoreBranding:    ${await StoreBranding.countDocuments()}`);
  console.log(`   GameSessions:     ${await GameSession.countDocuments()} (Clean 0)`);
  console.log(`   RewardClaims:     ${await RewardClaim.countDocuments()} (Clean 0)`);
  console.log(`   AuditLogs:        ${await AuditLog.countDocuments()} (Clean 0)`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected cleanly. Done!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
