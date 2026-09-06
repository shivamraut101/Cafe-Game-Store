import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import { Store } from "../../../../lib/models";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = (body.pin || "").trim();

    if (!pin) {
      return NextResponse.json({ valid: false, error: "PIN is required" }, { status: 400 });
    }

    await connectDB();

    // Check if PIN matches any store's custom adminPin
    const store = await Store.findOne({ adminPin: pin });

    if (store) {
      return NextResponse.json({
        valid: true,
        storeName: store.storeName,
        storeSlug: store.slug,
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error: any) {
    console.error("Error in verify-store-pin route:", error);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
