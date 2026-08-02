import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { RewardClaim, User, Store } from "../../../../lib/models";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    // Fallback default customer if no userId passed
    if (!userId) {
      const defaultUser = await User.findOne({ role: "customer" });
      if (defaultUser) userId = defaultUser._id.toString();
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjId);
    const claims = await RewardClaim.find({ userId: userObjId }).sort({ earnedAt: -1 });

    // Format claims with store details
    const formattedClaims = await Promise.all(
      claims.map(async (c) => {
        const store = await Store.findById(c.storeId);
        const isExpired = c.expiresAt < new Date();
        return {
          id: c._id,
          claimCode: c.claimCode,
          gameSlug: c.gameSlug,
          rewardName: c.rewardName,
          rewardDescription: c.rewardDescription,
          rewardType: c.rewardType,
          status: isExpired && c.status === "pending" ? "expired" : c.status,
          earnedAt: c.earnedAt,
          claimedAt: c.claimedAt,
          expiresAt: c.expiresAt,
          storeName: store ? store.storeName : "Cafe Store",
        };
      })
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        totalCafePoints: user?.totalCafePoints || 0,
      },
      rewards: formattedClaims,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
