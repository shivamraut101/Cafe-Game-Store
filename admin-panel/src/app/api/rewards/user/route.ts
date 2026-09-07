import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { RewardClaim, User, Store, GameSession } from "../../../../lib/models";
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

    // 3. Hardware Device Fingerprint Auto-Linking & Consolidation
    // Seamlessly unifies all Chrome profiles & incognito windows on the same physical device!
    if (fp) {
      const deviceUsers = await User.find({
        storeId: storeObjId,
        deviceFingerprint: fp,
      }).sort({ totalCafePoints: -1, createdAt: 1 });

      if (deviceUsers.length > 0) {
        // Master account election:
        // Priority 1: Profile with points (> 0)
        // Priority 2: Profile with custom personalized name (not starting with "Player #")
        // Priority 3: Oldest created profile on this device
        const masterUser =
          deviceUsers.find((u) => (u.totalCafePoints || 0) > 0) ||
          deviceUsers.find((u) => !u.name.startsWith("Player #")) ||
          deviceUsers[0];

        // Link current session to masterUser
        if (!user || user._id.toString() !== masterUser._id.toString()) {
          if (user && (user.totalCafePoints || 0) > 0 && user._id.toString() !== masterUser._id.toString()) {
            masterUser.totalCafePoints = (masterUser.totalCafePoints || 0) + (user.totalCafePoints || 0);
            await masterUser.save();
            await RewardClaim.updateMany({ userId: user._id }, { userId: masterUser._id });
            await GameSession.updateMany({ userId: user._id }, { userId: masterUser._id });
          }
          user = masterUser;
          guestId = masterUser.guestId;
        }

        // Merge and clean up any duplicate empty accounts created during incognito / separate profile testing
        for (const duplicate of deviceUsers) {
          if (duplicate._id.toString() !== masterUser._id.toString()) {
            if ((duplicate.totalCafePoints || 0) > 0) {
              masterUser.totalCafePoints = (masterUser.totalCafePoints || 0) + duplicate.totalCafePoints;
              await masterUser.save();
            }
            await RewardClaim.updateMany({ userId: duplicate._id }, { userId: masterUser._id });
            await GameSession.updateMany({ userId: duplicate._id }, { userId: masterUser._id });
            await User.deleteOne({ _id: duplicate._id });
          }
        }
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

