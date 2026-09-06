import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { MiniGameConfig, Store } from "../../../../lib/models";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "coffee-tower";
    let storeId = searchParams.get("storeId");

    // If no storeId provided, default to first active store
    if (!storeId) {
      const defaultStore = await Store.findOne({ status: "Active" }).sort({ createdAt: 1 });
      if (defaultStore) {
        storeId = defaultStore._id.toString();
      }
    }

    if (!storeId) {
      return NextResponse.json({
        success: true,
        storeId: "default",
        slug,
        name: slug.replace("-", " ").toUpperCase(),
        enabled: true,
        difficulty: "medium",
        maxDailyPlays: 0,
        rewardTiers: [
          { id: "t1", pointThreshold: 5, rewardName: "10% Off Table Reward", rewardDescription: "10% off bill or service" },
          { id: "t2", pointThreshold: 15, rewardName: "VIP Treat Upgrade", rewardDescription: "Complimentary upgrade" },
        ],
      });
    }

    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const config = await MiniGameConfig.findOne({
      storeId: storeObjId,
      slug,
    });

    if (!config) {
      // Fallback default config if not found
      return NextResponse.json({
        success: true,
        storeId,
        slug,
        name: slug.replace("-", " ").toUpperCase(),
        enabled: true,
        difficulty: "medium",
        maxDailyPlays: 0,
        rewardTiers: [
          { id: "t1", pointThreshold: 5, rewardName: "10% Off Table Reward", rewardDescription: "10% off bill or service" },
          { id: "t2", pointThreshold: 15, rewardName: "VIP Treat Upgrade", rewardDescription: "Complimentary upgrade" },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "air-hockey";
    return NextResponse.json({
      success: true,
      storeId: "default",
      slug,
      name: slug.replace("-", " ").toUpperCase(),
      enabled: true,
      difficulty: "medium",
      maxDailyPlays: 0,
      rewardTiers: [
        { id: "t1", pointThreshold: 5, rewardName: "10% Off Table Reward", rewardDescription: "10% off bill or service" },
      ],
      warning: error.message,
    });
  }
}
