import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { GameSession, MiniGameConfig, RewardClaim, User, Store, AuditLog } from "../../../../lib/models";
import { validateGameScore } from "../../../../lib/antiCheat";
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

    const storeObjId = new mongoose.Types.ObjectId(storeId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Fetch Game Config
    const config = await MiniGameConfig.findOne({ storeId: storeObjId, slug: gameSlug });

    // ─── 1. Daily Play Limit Check ──────────────────────────────
    if (config && config.maxDailyPlays > 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const playsToday = await GameSession.countDocuments({
        storeId: storeObjId,
        userId: userObjId,
        gameSlug,
        playedAt: { $gte: startOfDay },
      });

      if (playsToday >= config.maxDailyPlays) {
        return NextResponse.json(
          {
            error: `Daily limit of ${config.maxDailyPlays} plays reached for ${config.name || gameSlug}. Please return tomorrow!`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // ─── 2. Anti-Cheat Theoretical Physics Validation ───────────
    const validation = validateGameScore(gameSlug, score, duration);
    let isCheating = false;

    if (!validation.valid) {
      isCheating = true;
      score = validation.maxAllowed;

      await AuditLog.create({
        storeId: storeObjId,
        actorName: "API Anti-Cheat Filter",
        actorEmail: "api-monitor@forstore.app",
        actorRole: "Super Admin",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        action: "ANTI_CHEAT_VIOLATION",
        actionCategory: "SECURITY",
        targetType: "REST API Session",
        targetName: gameSlug,
        details: validation.reason || `Score capped to ${validation.maxAllowed}`,
        timestamp: new Date(),
      });
    }

    const pointsEarned = score * 10;

    let rewardEarned: any = null;
    let claimCode: string | null = null;
    let cooldownNotice: string | null = null;

    // ─── 3. Reward Voucher Issuance & 30-min Cooldown ────────────
    if (!isCheating && config && config.rewardTiers && config.rewardTiers.length > 0) {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existingPendingClaim = await RewardClaim.findOne({
        storeId: storeObjId,
        userId: userObjId,
        status: "pending",
        earnedAt: { $gte: thirtyMinsAgo },
      });

      if (existingPendingClaim) {
        cooldownNotice = `You already have an active voucher (${existingPendingClaim.claimCode}) ready to claim!`;
      } else {
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
          const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2hr strict expiry
          const sessionId = new mongoose.Types.ObjectId();

          await RewardClaim.create({
            storeId: storeObjId,
            userId: userObjId,
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
    }

    // Save Game Session
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

    // Update Customer Cafe Points
    await User.findByIdAndUpdate(userObjId, {
      $inc: { totalCafePoints: pointsEarned },
    });

    return NextResponse.json({
      success: true,
      sessionId: session._id,
      score,
      pointsEarned,
      rewardEarned,
      claimCode,
      cooldownNotice,
      isCapped: isCheating,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
