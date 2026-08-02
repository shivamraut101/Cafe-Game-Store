import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { GameSession, MiniGameConfig, RewardClaim, User, Store } from "../../../../lib/models";
import mongoose from "mongoose";

// Generate clean 4-character random string (e.g. 7X92)
function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "BRW-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    let { storeId, userId, gameSlug, score, duration = 30, combo = 0 } = body;

    // Fallback store & user if testing without auth
    if (!storeId) {
      const defaultStore = await Store.findOne({ status: "Active" });
      if (defaultStore) storeId = defaultStore._id.toString();
    }

    if (!userId && storeId) {
      const defaultCustomer = await User.findOne({ storeId, role: "customer" });
      if (defaultCustomer) userId = defaultCustomer._id.toString();
    }

    if (!storeId || !userId) {
      return NextResponse.json({ error: "Missing storeId or userId" }, { status: 400 });
    }

    const pointsEarned = score * 10;

    // Fetch Game Config to check for reward tiers
    const config = await MiniGameConfig.findOne({ storeId, slug: gameSlug });

    let rewardEarned: any = null;
    let claimCode: string | null = null;

    if (config && config.rewardTiers && config.rewardTiers.length > 0) {
      // Find highest tier qualified by player's score
      const qualifiedTiers = config.rewardTiers
        .filter((t) => score >= t.pointThreshold)
        .sort((a, b) => b.pointThreshold - a.pointThreshold);

      if (qualifiedTiers.length > 0) {
        const topTier = qualifiedTiers[0];
        rewardEarned = {
          tierId: topTier.id,
          rewardName: topTier.rewardName || "Cafe Reward",
          claimed: false,
        };

        // Generate unique claim code
        claimCode = generateCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr expiry

        // Temporary session ID for claim reference
        const sessionId = new mongoose.Types.ObjectId();

        await RewardClaim.create({
          storeId,
          userId,
          sessionId,
          gameSlug,
          rewardName: topTier.rewardName || "Cafe Reward",
          rewardDescription: topTier.rewardDescription || "Earned from playing " + gameSlug,
          rewardType: topTier.rewardType || "item",
          status: "pending",
          claimCode,
          earnedAt: new Date(),
          expiresAt,
        });
      }
    }

    // Save Game Session
    const session = await GameSession.create({
      storeId,
      userId,
      gameSlug,
      difficulty: config?.difficulty || "medium",
      score,
      cafePointsEarned: pointsEarned,
      duration,
      combo,
      rewardEarned,
      playedAt: new Date(),
    });

    // Update Customer Cafe Points
    await User.findByIdAndUpdate(userId, {
      $inc: { totalCafePoints: pointsEarned },
    });

    return NextResponse.json({
      success: true,
      sessionId: session._id,
      score,
      pointsEarned,
      rewardEarned,
      claimCode,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
