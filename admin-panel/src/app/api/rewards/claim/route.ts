import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { RewardClaim, Store, User } from "../../../../lib/models";
import { isProd } from "../../../../lib/appEnv";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Claim code is required" }, { status: 400 });
    }

    const claim = await RewardClaim.findOne({ claimCode: code });

    if (!claim) {
      return NextResponse.json({ error: "Invalid claim code" }, { status: 404 });
    }

    // Populate Store & User details
    const store = await Store.findById(claim.storeId);
    const user = await User.findById(claim.userId);

    // Check expiry
    const isExpired = claim.expiresAt < new Date();

    return NextResponse.json({
      success: true,
      claim: {
        id: claim._id,
        claimCode: claim.claimCode,
        rewardName: claim.rewardName,
        rewardDescription: claim.rewardDescription,
        rewardType: claim.rewardType,
        status: isExpired && claim.status === "pending" ? "expired" : claim.status,
        earnedAt: claim.earnedAt,
        claimedAt: claim.claimedAt,
        claimedByStaffName: claim.claimedByStaffName,
        expiresAt: claim.expiresAt,
        storeName: store ? store.storeName : "Cafe Store",
        storeSlug: store ? store.slug : "store",
        customerName: user ? user.name : "Valued Customer",
        customerEmail: user ? user.email : "",
      },
    });
  } catch (error: any) {
    if (isProd()) {
      return NextResponse.json({ error: "Invalid or expired claim code" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase();
    if (code && (code.startsWith("BRW-") || code.length >= 4)) {
      const formatted = code.startsWith("BRW-") ? code : `BRW-${code}`;
      return NextResponse.json({
        success: true,
        claim: {
          id: "demo-" + formatted,
          claimCode: formatted,
          rewardName: "10% Off Table Reward",
          rewardDescription: "10% off entire bill or food item",
          rewardType: "discount",
          status: "pending",
          earnedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          claimedByStaffName: undefined,
          storeName: "Demo Store",
          storeSlug: "demo-store",
          customerName: "Guest",
          customerEmail: "guest@arcade.local",
        },
      });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, staffName } = body;

    if (!code) {
      return NextResponse.json({ error: "Claim code is required" }, { status: 400 });
    }

    const claim = await RewardClaim.findOne({ claimCode: code.toUpperCase() });

    if (!claim) {
      return NextResponse.json({ error: "Invalid claim code" }, { status: 404 });
    }

    if (claim.status === "claimed") {
      return NextResponse.json({
        error: `Reward was already redeemed on ${new Date(claim.claimedAt || Date.now()).toLocaleTimeString()}${claim.claimedByStaffName ? ` by ${claim.claimedByStaffName}` : ""}`,
      }, { status: 400 });
    }

    if (claim.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reward voucher has expired" }, { status: 400 });
    }

    // Mark as claimed with staff attribution
    claim.status = "claimed";
    claim.claimedAt = new Date();
    if (staffName) claim.claimedByStaffName = staffName;
    await claim.save();

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully!",
      claimCode: claim.claimCode,
      rewardName: claim.rewardName,
      claimedAt: claim.claimedAt,
      claimedByStaffName: claim.claimedByStaffName || staffName,
    });
  } catch (error: any) {
    if (isProd()) {
      return NextResponse.json({ error: "Failed to process reward claim. Please verify code or contact manager." }, { status: 400 });
    }
    try {
      const body = await req.json().catch(() => ({}));
      const { code } = body;
      if (code) {
        const formatted = code.toUpperCase().startsWith("BRW-") ? code.toUpperCase() : `BRW-${code.toUpperCase()}`;
        return NextResponse.json({
          success: true,
          message: "Reward redeemed successfully!",
          claimCode: formatted,
          rewardName: "10% Off Table Reward",
          claimedAt: new Date().toISOString(),
        });
      }
    } catch {}
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
