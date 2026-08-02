"use server";

import connectDB from "../../lib/db";
import { GameSession, MiniGameConfig, RewardClaim, User, Store } from "../../lib/models";
import mongoose from "mongoose";

// Generate clean, readable 4-character random code (e.g. BRW-7X92)
function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "BRW-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface SubmitSessionInput {
  storeId?: string;
  userId?: string;
  gameSlug: string;
  score: number;
  duration?: number;
  combo?: number;
}

/**
 * Server Action: Submits game session, updates Cafe Points, and checks/issues 2-HOUR REWARD VOUCHERS.
 */
export async function submitGameSessionAction(input: SubmitSessionInput) {
  try {
    await connectDB();
    let { storeId, userId, gameSlug, score, duration = 30, combo = 0 } = input;

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
      return { success: false, error: "Store or user not found" };
    }

    const pointsEarned = score * 10;

    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Fetch live Game Config to check for qualified reward tiers
    const config = await MiniGameConfig.findOne({
      storeId: storeObjId,
      slug: gameSlug as "coffee-tower" | "flappy-barista" | "barista-catch",
    });

    let rewardEarned: { tierId: string; rewardName: string; claimed: boolean } | null = null;
    let claimCode: string | null = null;
    let expiresAt: Date | null = null;

    if (config && config.rewardTiers && config.rewardTiers.length > 0) {
      // Find highest qualified tier
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

        claimCode = generateCode();
        // SECURITY REQUIREMENT: 2-Hour Strict Expiry Window
        expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const sessionId = new mongoose.Types.ObjectId();

        await RewardClaim.create({
          storeId: storeObjId,
          userId: userObjId,
          sessionId,
          gameSlug,
          rewardName: topTier.rewardName || "Cafe Reward",
          rewardDescription: topTier.rewardDescription || `Earned from playing ${gameSlug}`,
          rewardType: topTier.rewardType || "item",
          status: "pending",
          claimCode,
          earnedAt: new Date(),
          expiresAt,
        });
      }
    }

    // Save Game Session to MongoDB
    const session = await GameSession.create({
      storeId: storeObjId,
      userId: userObjId,
      gameSlug,
      difficulty: config?.difficulty || "medium",
      score,
      cafePointsEarned: pointsEarned,
      duration,
      combo,
      rewardEarned: rewardEarned || undefined,
      playedAt: new Date(),
    });

    // Update Customer's total Cafe Points
    await User.findByIdAndUpdate(userObjId, {
      $inc: { totalCafePoints: pointsEarned },
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      score,
      pointsEarned,
      rewardEarned,
      claimCode,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  } catch (error: any) {
    console.error("Error in submitGameSessionAction:", error);
    return { success: false, error: error.message || "Failed to save game session" };
  }
}

/**
 * Server Action: Redeems a reward voucher by claim code (Staff verification with 2-hour window check).
 */
export async function redeemRewardVoucherAction(claimCode: string) {
  try {
    await connectDB();
    if (!claimCode) return { success: false, error: "Claim code is required" };

    let code = claimCode.toUpperCase().trim();
    if (!code.startsWith("BRW-")) {
      code = `BRW-${code}`;
    }

    const claim = await RewardClaim.findOne({ claimCode: code });

    if (!claim) {
      return { success: false, error: "Invalid claim code. Please check and try again." };
    }

    if (claim.status === "claimed") {
      return {
        success: false,
        error: `Voucher was already redeemed on ${new Date(claim.claimedAt || Date.now()).toLocaleTimeString()}`,
      };
    }

    // SECURITY CHECK: 2-Hour Strict Expiry Check
    if (claim.expiresAt < new Date()) {
      claim.status = "expired";
      await claim.save();
      return { success: false, error: "Voucher validity expired (2-hour time limit exceeded)" };
    }

    // Mark as claimed in MongoDB Atlas
    claim.status = "claimed";
    claim.claimedAt = new Date();
    await claim.save();

    return {
      success: true,
      claimCode: claim.claimCode,
      rewardName: claim.rewardName,
      claimedAt: claim.claimedAt.toISOString(),
    };
  } catch (error: any) {
    console.error("Error in redeemRewardVoucherAction:", error);
    return { success: false, error: error.message || "Redemption failed" };
  }
}

/**
 * Server Action: Fetches customer's active rewards and Cafe Points.
 */
export async function getUserRewardsAction(userId?: string) {
  try {
    await connectDB();

    if (!userId) {
      const defaultUser = await User.findOne({ role: "customer" });
      if (defaultUser) userId = defaultUser._id.toString();
    }

    if (!userId) {
      return { success: false, error: "User not found" };
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjId);
    const claims = await RewardClaim.find({ userId: userObjId }).sort({ earnedAt: -1 });

    const formattedClaims = await Promise.all(
      claims.map(async (c) => {
        const store = await Store.findById(c.storeId);
        const isExpired = c.expiresAt < new Date();
        
        // Auto-update expired status if past 2 hours
        if (isExpired && c.status === "pending") {
          c.status = "expired";
          await c.save();
        }

        return {
          id: c._id.toString(),
          claimCode: c.claimCode,
          gameSlug: c.gameSlug,
          rewardName: c.rewardName,
          rewardDescription: c.rewardDescription,
          rewardType: c.rewardType,
          status: c.status,
          earnedAt: c.earnedAt.toISOString(),
          claimedAt: c.claimedAt ? c.claimedAt.toISOString() : null,
          expiresAt: c.expiresAt.toISOString(),
          storeName: store ? store.storeName : "Cafe Store",
        };
      })
    );

    return {
      success: true,
      user: {
        id: user?._id.toString(),
        name: user?.name || "Player",
        email: user?.email || "",
        totalCafePoints: user?.totalCafePoints || 0,
      },
      rewards: formattedClaims,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch rewards" };
  }
}
