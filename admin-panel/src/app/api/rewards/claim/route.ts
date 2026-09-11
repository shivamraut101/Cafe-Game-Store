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

    const now = new Date();
    const isLocked = claim.validFrom ? new Date(claim.validFrom) > now : false;
    const isExpired = claim.expiresAt < now;

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
        validFrom: claim.validFrom || null,
        expiresAt: claim.expiresAt,
        timingMode: claim.timingMode || "immediate_upsell",
        minOrderValue: claim.minOrderValue || 0,
        isLocked,
        daysToReturn: claim.daysToReturn,
        returnBillAmount: claim.returnBillAmount,
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
          validFrom: null,
          expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
          timingMode: "immediate_upsell",
          minOrderValue: 0,
          isLocked: false,
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
    const { code, staffName, billAmount } = body;

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

    const now = new Date();

    // RETENTION VOUCHER DEFENSE: Block redemption on today's visit if locked
    if (claim.validFrom && new Date(claim.validFrom) > now) {
      const diffMs = new Date(claim.validFrom).getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return NextResponse.json({
        error: `Next-Visit Retention Voucher Locked! This voucher unlocks on ${new Date(claim.validFrom).toLocaleString()} (in ~${hours > 0 ? `${hours}h ` : ""}${mins}m). It cannot be redeemed on today's visit.`,
        isLocked: true,
        validFrom: claim.validFrom,
      }, { status: 400 });
    }

    if (claim.expiresAt < now) {
      return NextResponse.json({ error: "Reward voucher has expired" }, { status: 400 });
    }

    if (claim.minOrderValue && typeof billAmount === "number" && billAmount > 0 && billAmount < claim.minOrderValue) {
      return NextResponse.json({
        error: `Minimum bill of ₹${claim.minOrderValue} required to redeem this voucher (current bill: ₹${billAmount}).`,
      }, { status: 400 });
    }

    const daysToReturn = claim.earnedAt
      ? Math.max(0, Math.round((now.getTime() - new Date(claim.earnedAt).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Mark as claimed with staff & ROI attribution
    claim.status = "claimed";
    claim.claimedAt = now;
    claim.daysToReturn = daysToReturn;
    if (typeof billAmount === "number" && billAmount > 0) {
      claim.returnBillAmount = billAmount;
    }
    if (staffName) claim.claimedByStaffName = staffName;
    await claim.save();

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully!",
      claimCode: claim.claimCode,
      rewardName: claim.rewardName,
      claimedAt: claim.claimedAt,
      claimedByStaffName: claim.claimedByStaffName || staffName,
      timingMode: claim.timingMode || "immediate_upsell",
      minOrderValue: claim.minOrderValue || 0,
      daysToReturn,
      returnBillAmount: claim.returnBillAmount,
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
          timingMode: "immediate_upsell",
          minOrderValue: 0,
        });
      }
    } catch {}
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
