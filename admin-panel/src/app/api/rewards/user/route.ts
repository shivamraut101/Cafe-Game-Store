import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { RewardClaim, User, Store } from "../../../../lib/models";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");
    let guestId = searchParams.get("guestId") || req.cookies.get("forstore_player_id")?.value;
    const storeSlug = searchParams.get("store");

    let storeObjId: mongoose.Types.ObjectId | null = null;
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug });
      if (store) storeObjId = store._id as mongoose.Types.ObjectId;
    }
    if (!storeObjId) {
      const defaultStore = await Store.findOne({ status: "Active" });
      if (defaultStore) storeObjId = defaultStore._id as mongoose.Types.ObjectId;
    }

    const fp = searchParams.get("fp") || req.headers.get("x-device-fingerprint") || "";
    const syncCode = (searchParams.get("syncCode") || "").trim().toUpperCase();

    const nameCookie = req.cookies.get("forstore_player_name")?.value;
    const cookiePlayerName = nameCookie ? decodeURIComponent(nameCookie).trim() : "";

    let user = null;

    // 1. Explicit Sync Code lookup (e.g. 4-letter suffix 9L9X)
    if (syncCode && syncCode.length >= 3) {
      user = await User.findOne({
        storeId: storeObjId,
        guestId: { $regex: new RegExp(`${syncCode}$`, "i") },
      });
      if (user) {
        guestId = user.guestId;
      }
    }

    // 2. Direct ID or Cookie / GuestId Lookup
    if (!user) {
      if (userId) {
        user = await User.findById(userId);
      } else if (guestId) {
        user = await User.findOne({ guestId });
      }
    }

    // 3. Hardware Device Fingerprint Auto-Linking
    // If current profile is fresh/empty (0 points) or unlinked, check if this same device
    // already has an active player profile in this store!
    if (fp && (!user || (user.totalCafePoints === 0))) {
      const existingDeviceUser = await User.findOne({
        storeId: storeObjId,
        deviceFingerprint: fp,
        totalCafePoints: { $gt: 0 },
      }).sort({ totalCafePoints: -1, updatedAt: -1 });

      if (existingDeviceUser) {
        user = existingDeviceUser;
        guestId = existingDeviceUser.guestId;
      }
    }

    // 4. Create new user if still none exists
    if (!user) {
      const newGuestId = guestId || ("ply_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4));
      guestId = newGuestId;
      const suffix = newGuestId.slice(-4).toUpperCase();
      user = await User.create({
        storeId: storeObjId,
        guestId: newGuestId,
        deviceFingerprint: fp || undefined,
        name: cookiePlayerName || `Player #${suffix}`,
        email: `guest-${newGuestId}@arcade.app`,
        passwordHash: "guest_no_auth_required",
        role: "customer",
        totalCafePoints: 0,
      });
    } else {
      // Keep device fingerprint and custom name synced
      let needsSave = false;
      if (fp && !user.deviceFingerprint) {
        user.deviceFingerprint = fp;
        needsSave = true;
      }
      if (cookiePlayerName && user.name.startsWith("Player #")) {
        user.name = cookiePlayerName;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    const userObjId = user._id;
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        guestId: user.guestId,
        name: user.name,
        email: user.email,
        totalCafePoints: user.totalCafePoints || 0,
      },
      rewards: formattedClaims,
    });

    if (guestId) {
      response.cookies.set({
        name: "forstore_player_id",
        value: guestId,
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }

    if (fp) {
      response.cookies.set({
        name: "forstore_device_fp",
        value: fp,
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    let guestId = body.guestId || req.cookies.get("forstore_player_id")?.value;
    const rawName = (body.name || "").trim().slice(0, 30);

    if (!guestId) {
      guestId = "ply_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
    }

    const suffix = guestId.slice(-4).toUpperCase();
    const displayName = rawName || `Player #${suffix}`;

    let user = await User.findOne({ guestId });
    if (!user) {
      user = await User.create({
        guestId,
        name: displayName,
        email: `guest-${guestId}@arcade.app`,
        passwordHash: "guest_no_auth_required",
        role: "customer",
        totalCafePoints: 0,
      });
    } else {
      user.name = displayName;
      await user.save();
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        guestId: user.guestId,
        name: user.name,
        totalCafePoints: user.totalCafePoints || 0,
      },
    });

    res.cookies.set({
      name: "forstore_player_id",
      value: guestId,
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });

    if (rawName) {
      res.cookies.set({
        name: "forstore_player_name",
        value: encodeURIComponent(rawName),
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      });
    } else {
      res.cookies.delete("forstore_player_name");
    }

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

