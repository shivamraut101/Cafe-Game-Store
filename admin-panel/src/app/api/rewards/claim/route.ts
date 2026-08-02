import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { RewardClaim, Store, User } from "../../../../lib/models";

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
        expiresAt: claim.expiresAt,
        storeName: store ? store.storeName : "Cafe Store",
        customerName: user ? user.name : "Valued Customer",
        customerEmail: user ? user.email : "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Claim code is required" }, { status: 400 });
    }

    const claim = await RewardClaim.findOne({ claimCode: code.toUpperCase() });

    if (!claim) {
      return NextResponse.json({ error: "Invalid claim code" }, { status: 404 });
    }

    if (claim.status === "claimed") {
      return NextResponse.json({ error: "Reward has already been redeemed" }, { status: 400 });
    }

    if (claim.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reward voucher has expired" }, { status: 400 });
    }

    // Mark as claimed
    claim.status = "claimed";
    claim.claimedAt = new Date();
    await claim.save();

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully!",
      claimCode: claim.claimCode,
      rewardName: claim.rewardName,
      claimedAt: claim.claimedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
