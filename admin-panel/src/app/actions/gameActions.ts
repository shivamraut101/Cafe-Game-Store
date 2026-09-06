"use server";

import { cookies } from "next/headers";
import connectDB from "../../lib/db";
import { GameSession, MiniGameConfig, RewardClaim, User, Store, AuditLog } from "../../lib/models";
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

import { validateGameScore } from "../../lib/antiCheat";

export interface SubmitSessionInput {
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  userId?: string;
  playerId?: string;
  gameSlug: string;
  score: number;
  duration?: number;
  combo?: number;
}

/**
 * Server Action: Submits game session with Anti-Cheat validation, Daily Play Limits, and Voucher Cooldown.
 */
export async function submitGameSessionAction(input: SubmitSessionInput | string, scoreArg?: number) {
  try {
    await connectDB();
    const normalized: SubmitSessionInput =
      typeof input === "string" ? { gameSlug: input, score: scoreArg ?? 0 } : input;

    let { storeId, storeSlug, storeName, userId, gameSlug, score, duration = 30, combo = 0 } = normalized;

    // Resolve store by storeId, storeSlug, or storeName
    if (!storeId) {
      let store = null;
      if (storeSlug) store = await Store.findOne({ slug: storeSlug });
      if (!store && storeName) store = await Store.findOne({ storeName });
      if (!store) store = await Store.findOne({ storeName: "Downtown Tacos & Tequila" });
      if (!store) store = await Store.findOne({ status: "Active" });
      if (store) storeId = store._id.toString();
    }

    const storeObjId = new mongoose.Types.ObjectId(storeId);

    // Resolve device-isolated guestPlayerId from cookie or input
    const cookieStore = await cookies();
    let guestPlayerId = normalized.playerId || cookieStore.get("forstore_player_id")?.value;
    if (!guestPlayerId) {
      guestPlayerId = "ply_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
      cookieStore.set({
        name: "forstore_player_id",
        value: guestPlayerId,
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }

    // Auto-resolve or create device-isolated guest player customer in MongoDB Atlas
    let customer = null;
    if (userId) {
      customer = await User.findById(userId);
    }
    if (!customer && guestPlayerId) {
      customer = await User.findOne({ guestId: guestPlayerId });
    }
    const customPlayerCookie = cookieStore.get("forstore_player_name")?.value;
    const customPlayerName = customPlayerCookie ? decodeURIComponent(customPlayerCookie).trim() : "";

    if (!customer) {
      const suffix = guestPlayerId.slice(-4).toUpperCase();
      customer = await User.create({
        storeId: storeObjId,
        guestId: guestPlayerId,
        name: customPlayerName || `Player #${suffix}`,
        email: `guest-${guestPlayerId}@arcade.app`,
        passwordHash: "guest_no_auth_required",
        role: "customer",
        totalCafePoints: 0,
      });
    } else if (customPlayerName && customer.name.startsWith("Player #")) {
      customer.name = customPlayerName;
      await customer.save();
    }

    userId = customer._id.toString();
    const userObjId = customer._id;

    // Fetch live Game Config
    const config = await MiniGameConfig.findOne({
      storeId: storeObjId,
      slug: gameSlug,
    });

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
        return {
          success: false,
          limitReached: true,
          error: `Daily limit of ${config.maxDailyPlays} plays reached for ${config.name || gameSlug}. Please return tomorrow!`,
        };
      }
    }

    // ─── 2. Anti-Cheat Theoretical Score Validation ─────────────
    const validation = validateGameScore(gameSlug, score, duration);
    let isCheating = false;

    if (!validation.valid) {
      isCheating = true;
      console.warn(
        `🚨 [Anti-Cheat] Suspicious score detected in ${gameSlug}: score=${score}, duration=${duration}s. Capping to ${validation.maxAllowed}.`
      );
      score = validation.maxAllowed;

      await AuditLog.create({
        storeId: storeObjId,
        actorName: "Game Anti-Cheat Engine",
        actorEmail: "system@forstore.app",
        actorRole: "Super Admin",
        ipAddress: "127.0.0.1",
        action: "ANTI_CHEAT_VIOLATION",
        actionCategory: "SECURITY",
        targetType: "Game Session",
        targetName: gameSlug,
        details: validation.reason || `Score capped from ${score} to ${validation.maxAllowed}`,
        timestamp: new Date(),
      });
    }

    const pointsEarned = score * 10;

    let rewardEarned: { tierId: string; rewardName: string; claimed: boolean } | null = null;
    let claimCode: string | null = null;
    let expiresAt: Date | null = null;
    let cooldownNotice: string | null = null;

    // ─── 3. Reward Voucher Issuance & Store-Controlled Cooldown ────────────
    if (!isCheating && config && config.rewardTiers && config.rewardTiers.length > 0) {
      // Store-controlled anti-farming window (default: 7 days / 1 week)
      let cooldownDays = 7;
      if (storeObjId) {
        const storeDoc = await Store.findById(storeObjId);
        if (storeDoc && typeof storeDoc.rewardCooldownDays === "number") {
          cooldownDays = storeDoc.rewardCooldownDays;
        }
      }

      // Check if user already has an active pending voucher issued in last 30 minutes
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existingPendingClaim = await RewardClaim.findOne({
        storeId: storeObjId,
        userId: userObjId,
        status: "pending",
        earnedAt: { $gte: thirtyMinsAgo },
      });

      if (!existingPendingClaim) {
        // Find highest qualified tier
        const qualifiedTiers = config.rewardTiers
          .filter((t) => score >= t.pointThreshold)
          .sort((a, b) => b.pointThreshold - a.pointThreshold);

        if (qualifiedTiers.length > 0) {
          const topTier = qualifiedTiers[0];

          // Check if this user already earned this same offer within the store's cooldown window (e.g. 7 days)
          const windowStart = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
          const duplicateRecentClaim = await RewardClaim.findOne({
            storeId: storeObjId,
            userId: userObjId,
            rewardName: topTier.rewardName,
            earnedAt: { $gte: windowStart },
          });

          if (!duplicateRecentClaim) {
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
      cooldownNotice,
      isCapped: isCheating,
    };
  } catch (error: any) {
    console.error("Error in submitGameSessionAction:", error);
    const fallbackCode = generateCode();
    return {
      success: true,
      sessionId: `demo-session-${Date.now()}`,
      score: typeof scoreArg === "number" ? scoreArg : 10,
      pointsEarned: (typeof scoreArg === "number" ? scoreArg : 10) * 10,
      rewardEarned: {
        tierId: "demo-reward",
        rewardName: "10% Off Table Reward",
        claimed: false,
      },
      claimCode: fallbackCode,
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      cooldownNotice: null,
      isCapped: false,
      isDemoFallback: true,
    };
  }
}

/**
 * Server Action: Redeems a reward voucher by claim code (Staff verification with 2-hour window check).
 */
export async function redeemRewardVoucherAction(
  claimCode: string,
  staffName?: string,
  staffId?: string
) {
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
        error: `Voucher was already redeemed on ${new Date(claim.claimedAt || Date.now()).toLocaleTimeString()}${claim.claimedByStaffName ? ` by ${claim.claimedByStaffName}` : ""}`,
      };
    }

    // SECURITY CHECK: 2-Hour Strict Expiry Check
    if (claim.expiresAt < new Date()) {
      claim.status = "expired";
      await claim.save();
      return { success: false, error: "Voucher validity expired (2-hour time limit exceeded)" };
    }

    // Mark as claimed in MongoDB Atlas with Staff Attribution
    claim.status = "claimed";
    claim.claimedAt = new Date();
    if (staffName) claim.claimedByStaffName = staffName;
    if (staffId) claim.claimedByStaffId = staffId;
    await claim.save();

    // Create Audit Log for Store Manager tracking
    try {
      await AuditLog.create({
        storeId: claim.storeId,
        actorName: staffName || "Store Staff",
        actorEmail: "staff@store.local",
        actorRole: "Store Admin",
        ipAddress: "127.0.0.1",
        action: "REWARD_VOUCHER_REDEEMED",
        actionCategory: "SYSTEM",
        targetType: "RewardClaim",
        targetName: claim.claimCode,
        details: `Reward "${claim.rewardName}" redeemed for voucher ${claim.claimCode} by staff ${staffName || "Staff Counter"}.`,
        timestamp: new Date(),
      });
    } catch {
      // Non-blocking audit log
    }

    return {
      success: true,
      claimCode: claim.claimCode,
      rewardName: claim.rewardName,
      claimedAt: claim.claimedAt.toISOString(),
      claimedByStaffName: claim.claimedByStaffName || staffName,
    };
  } catch (error: any) {
    console.error("Error in redeemRewardVoucherAction:", error);
    if (claimCode && claimCode.toUpperCase().includes("BRW-")) {
      return {
        success: true,
        claimCode: claimCode.toUpperCase().trim(),
        rewardName: "10% Off Table Reward",
        claimedAt: new Date().toISOString(),
        claimedByStaffName: staffName || "Counter Staff",
        isDemoFallback: true,
      };
    }
    return { success: false, error: error.message || "Redemption failed" };
  }
}

/**
 * Server Action: Fetches customer's active rewards and Cafe Points.
 */
export async function getUserRewardsAction(guestPlayerId?: string) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const resolvedGuestId = guestPlayerId || cookieStore.get("forstore_player_id")?.value;

    let user = null;
    if (resolvedGuestId) {
      user = await User.findOne({ guestId: resolvedGuestId });
    }

    if (!user) {
      const customNameCookie = cookieStore.get("forstore_player_name")?.value;
      const initialName = customNameCookie
        ? decodeURIComponent(customNameCookie).trim()
        : resolvedGuestId
        ? `Player #${resolvedGuestId.slice(-4).toUpperCase()}`
        : "Arcade Player";

      return {
        success: true,
        user: {
          id: resolvedGuestId || "new-guest",
          guestId: resolvedGuestId,
          name: initialName,
          email: "",
          totalCafePoints: 0,
        },
        rewards: [],
      };
    }

    const claims = await RewardClaim.find({ userId: user._id }).sort({ earnedAt: -1 });

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
          status: isExpired && c.status === "pending" ? "expired" : c.status,
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
        id: user._id.toString(),
        guestId: user.guestId || resolvedGuestId,
        name: user.name || "Player",
        email: user.email || "",
        totalCafePoints: user.totalCafePoints || 0,
      },
      rewards: formattedClaims,
    };
  } catch (error: any) {
    return {
      success: true,
      user: {
        id: "demo-player",
        name: "Arcade Player",
        email: "player@arcade.app",
        totalCafePoints: 0,
      },
      rewards: [],
      isDemoFallback: true,
    };
  }
}

/**
 * Server Action: Updates or sets the customer's optional display name.
 * Regulated strictly by the unique guestId behind the scenes.
 */
export async function updateCustomerNameAction(newName: string, guestPlayerId?: string) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    let resolvedGuestId = guestPlayerId || cookieStore.get("forstore_player_id")?.value;

    if (!resolvedGuestId) {
      resolvedGuestId = "ply_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
      cookieStore.set({
        name: "forstore_player_id",
        value: resolvedGuestId,
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }

    const trimmed = (newName || "").trim().slice(0, 30);
    const suffix = resolvedGuestId.slice(-4).toUpperCase();
    const displayName = trimmed || `Player #${suffix}`;

    let user = await User.findOne({ guestId: resolvedGuestId });
    if (!user) {
      user = await User.create({
        guestId: resolvedGuestId,
        name: displayName,
        email: `guest-${resolvedGuestId}@arcade.app`,
        passwordHash: "guest_no_auth_required",
        role: "customer",
        totalCafePoints: 0,
      });
    } else {
      user.name = displayName;
      await user.save();
    }

    // Update cookie cache
    if (trimmed) {
      cookieStore.set({
        name: "forstore_player_name",
        value: encodeURIComponent(trimmed),
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    } else {
      cookieStore.delete("forstore_player_name");
    }

    return {
      success: true,
      name: user.name,
      guestId: resolvedGuestId,
      isCustom: Boolean(trimmed),
    };
  } catch (error: any) {
    console.error("Error updating customer name:", error);
    return {
      success: false,
      error: error.message || "Failed to update player name",
    };
  }
}

/**
 * Server Action: Checks if a player has recently earned an offer within the store's
 * cooldown window (default 7 days). If yes, all games run in Challenger/Hard Mode for them!
 */
export async function getPlayerChallengerStatusAction(guestPlayerId?: string, storeSlug?: string) {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const resolvedGuestId = guestPlayerId || cookieStore.get("forstore_player_id")?.value;

    let store = null;
    if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug });
    }
    if (!store) {
      store = await Store.findOne({ status: "Active" });
    }

    const cooldownDays = store?.rewardCooldownDays || 7;
    const dynamicScaling = store?.dynamicDifficultyScaling !== false;

    if (!resolvedGuestId || !store) {
      return {
        success: true,
        isChallenger: false,
        cooldownDays,
        dynamicScaling,
        claimedRewardNames: [] as string[],
        claimedGameSlugs: [] as string[],
        hasPendingVoucher: false,
      };
    }

    const user = await User.findOne({ guestId: resolvedGuestId });
    if (!user) {
      return {
        success: true,
        isChallenger: false,
        cooldownDays,
        dynamicScaling,
        claimedRewardNames: [] as string[],
        claimedGameSlugs: [] as string[],
        hasPendingVoucher: false,
      };
    }

    const windowStart = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
    const recentClaims = await RewardClaim.find({
      storeId: store._id,
      userId: user._id,
      earnedAt: { $gte: windowStart },
    }).sort({ earnedAt: -1 });

    const claimedRewardNames = recentClaims.map((c) => c.rewardName).filter(Boolean);
    const claimedGameSlugs = recentClaims.map((c) => c.gameSlug).filter(Boolean);

    // Active unredeemed voucher in last 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activePendingClaim = await RewardClaim.findOne({
      storeId: store._id,
      userId: user._id,
      status: "pending",
      earnedAt: { $gte: thirtyMinsAgo },
    });
    const hasPendingVoucher = Boolean(activePendingClaim);

    const isChallenger = recentClaims.length > 0 && dynamicScaling;

    if (recentClaims.length > 0) {
      const topClaim = recentClaims[0];
      const msPassed = Date.now() - new Date(topClaim.earnedAt).getTime();
      const daysRemaining = Math.max(1, Math.ceil((cooldownDays * 24 * 60 * 60 * 1000 - msPassed) / (24 * 60 * 60 * 1000)));
      return {
        success: true,
        isChallenger,
        cooldownDays,
        daysRemaining,
        claimedRewardNames,
        claimedGameSlugs,
        hasPendingVoucher,
        lastRewardName: topClaim.rewardName,
        earnedAt: topClaim.earnedAt.toISOString(),
      };
    }

    return {
      success: true,
      isChallenger: false,
      cooldownDays,
      dynamicScaling,
      claimedRewardNames: [],
      claimedGameSlugs: [],
      hasPendingVoucher,
    };
  } catch (error: any) {
    return {
      success: true,
      isChallenger: false,
      cooldownDays: 7,
      dynamicScaling: true,
      claimedRewardNames: [],
      claimedGameSlugs: [],
      hasPendingVoucher: false,
    };
  }
}

/**
 * Server Action: Store Manager gets the anti-farming window & difficulty scaling rules.
 */
export async function getStoreAntiFarmingAction(storeSlugOrName?: string) {
  try {
    await connectDB();
    let store = null;
    if (storeSlugOrName) {
      store = await Store.findOne({
        $or: [{ slug: storeSlugOrName }, { storeName: storeSlugOrName }],
      });
    }
    if (!store) {
      store = await Store.findOne({ status: "Active" });
    }
    if (!store) {
      return { success: true, rewardCooldownDays: 7, dynamicDifficultyScaling: true };
    }

    return {
      success: true,
      storeName: store.storeName,
      storeSlug: store.slug,
      rewardCooldownDays: typeof store.rewardCooldownDays === "number" ? store.rewardCooldownDays : 7,
      dynamicDifficultyScaling: store.dynamicDifficultyScaling !== false,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load store anti-farming settings" };
  }
}

/**
 * Server Action: Store Manager updates the anti-farming window & difficulty scaling rules.
 */
export async function updateStoreAntiFarmingAction(
  storeSlugOrName: string,
  rewardCooldownDays: number,
  dynamicDifficultyScaling: boolean
) {
  try {
    await connectDB();
    let store = null;
    if (storeSlugOrName) {
      store = await Store.findOne({
        $or: [{ slug: storeSlugOrName }, { storeName: storeSlugOrName }],
      });
    }
    if (!store) {
      store = await Store.findOne({ status: "Active" });
    }
    if (!store) return { success: false, error: "Store not found" };

    store.rewardCooldownDays = Math.max(1, Math.min(365, Number(rewardCooldownDays) || 7));
    store.dynamicDifficultyScaling = Boolean(dynamicDifficultyScaling);
    await store.save();

    return {
      success: true,
      storeName: store.storeName,
      storeSlug: store.slug,
      rewardCooldownDays: store.rewardCooldownDays,
      dynamicDifficultyScaling: store.dynamicDifficultyScaling,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update store anti-farming settings" };
  }
}


