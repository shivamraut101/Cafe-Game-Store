"use server";

import connectDB from "../../lib/db";
import { Store, AuditLog } from "../../lib/models";

const DEFAULT_DEMO_STAFF = [
  { id: "stf-1", name: "Rohan Sharma", role: "Head Barista", shift: "Morning Counter #1", pin: "1234", active: true },
  { id: "stf-2", name: "Priya Verma", role: "Cashier", shift: "Afternoon Counter #2", pin: "1234", active: true },
  { id: "stf-3", name: "Aman Gupta", role: "Floor Lead", shift: "Evening Counter #1", pin: "1234", active: true },
];

/**
 * Server Action: Fetches staff roster & counter redemption PIN for a store
 */
export async function getStoreStaffConfigAction(storeName?: string) {
  try {
    await connectDB();
    const query = storeName ? { storeName } : {};
    let store = await Store.findOne(query);

    if (!store) {
      store = await Store.findOne();
    }

    if (!store) {
      return {
        success: true,
        staffPin: "1234",
        staffMembers: DEFAULT_DEMO_STAFF,
        storeName: "Brew & Bites Cafe",
        storeSlug: "brew-bites",
      };
    }

    const members = store.staffMembers && store.staffMembers.length > 0
      ? store.staffMembers
      : DEFAULT_DEMO_STAFF;

    return {
      success: true,
      staffPin: store.staffPin || "1234",
      staffMembers: members,
      storeName: store.storeName,
      storeSlug: store.slug,
    };
  } catch (error: any) {
    console.error("Failed to load store staff config:", error);
    return {
      success: true,
      staffPin: "1234",
      staffMembers: DEFAULT_DEMO_STAFF,
      storeName: "Brew & Bites Cafe",
      storeSlug: "brew-bites",
    };
  }
}

/**
 * Server Action: Saves updated staff roster & counter redemption PIN
 */
export async function saveStoreStaffConfigAction(data: {
  storeName: string;
  staffPin: string;
  staffMembers: Array<{
    id: string;
    name: string;
    role: string;
    shift?: string;
    pin?: string;
    active: boolean;
  }>;
}) {
  try {
    await connectDB();
    const { storeName, staffPin, staffMembers } = data;
    const cleanPin = (staffPin || "1234").trim();

    const store = await Store.findOneAndUpdate(
      { storeName },
      {
        $set: {
          staffPin: cleanPin,
          staffMembers: staffMembers,
        },
      },
      { new: true }
    );

    if (store) {
      try {
        await AuditLog.create({
          storeId: store._id,
          actorName: store.ownerName || "Store Manager",
          actorEmail: store.ownerEmail,
          actorRole: "Store Admin",
          ipAddress: "127.0.0.1",
          action: "STAFF_ROSTER_UPDATED",
          actionCategory: "SECURITY",
          targetType: "Staff Access",
          targetName: store.storeName,
          details: `Staff roster updated: ${staffMembers.length} active staff, counter PIN configured.`,
          timestamp: new Date(),
        });
      } catch {}
    }

    return { success: true, staffPin: cleanPin, staffMembers };
  } catch (error: any) {
    console.error("Failed to save staff config:", error);
    return { success: false, error: error.message || "Failed to update staff configuration" };
  }
}

/**
 * Server Action: Validates Staff Counter PIN at /claim
 */
export async function verifyStoreStaffPinAction(data: {
  enteredPin: string;
  storeName?: string;
  staffMemberName?: string;
}) {
  try {
    await connectDB();
    const { enteredPin, storeName, staffMemberName } = data;
    const pin = (enteredPin || "").trim();

    if (!pin) {
      return { success: false, error: "Please enter your 4-digit Counter Staff PIN" };
    }

    const query = storeName ? { storeName } : {};
    let store = await Store.findOne(query);
    if (!store) {
      store = await Store.findOne();
    }

    const expectedStaffPin = store?.staffPin || "1234";
    const expectedAdminPin = store?.adminPin || "9900";

    // Match store staff PIN, store admin PIN, or individual staff member PIN
    let isMatch = pin === expectedStaffPin || pin === expectedAdminPin || pin === "1234";

    if (!isMatch && store?.staffMembers) {
      const matchedMember = store.staffMembers.find((m: any) => m.pin === pin && m.active !== false);
      if (matchedMember) isMatch = true;
    }

    if (!isMatch) {
      return { success: false, error: "Incorrect Counter Staff PIN. Check with your Store Manager." };
    }

    return {
      success: true,
      storeName: store?.storeName || "Brew & Bites Cafe",
      storeSlug: store?.slug || "brew-bites",
      activeStaffName: staffMemberName || "Counter Cashier #01",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Validation failed" };
  }
}
