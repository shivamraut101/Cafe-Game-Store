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
      return NextResponse.json({ error: "No store found" }, { status: 404 });
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
        rewardTiers: [],
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
