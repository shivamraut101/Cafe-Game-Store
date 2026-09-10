"use server";

import { cookies } from "next/headers";
import connectDB from "../../lib/db";
import { User, Store, AuditLog, StoreBranding } from "../../lib/models";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SessionPayload,
} from "../../lib/auth";
import { getMiniGameConfigsAction } from "./adminActions";
import { sendPinRecoveryEmail, maskEmail } from "../../lib/emailService";
import { isProd, isDemo } from "../../lib/appEnv";

const SESSION_COOKIE_NAME = "forstore_session";

/**
 * Server Action: Authenticates user credentials against MongoDB Atlas User collection.
 */
export async function loginAction(data: {
  email: string;
  password: string;
  role?: "super_admin" | "store_admin";
}) {
  try {
    await connectDB();

    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    // Strictly prohibit super admin in Demo Sandbox
    if (isDemo() && (data.role === "super_admin" || user.role === "super_admin")) {
      return {
        success: false,
        error: "Super Admin access is disabled in the Demo Sandbox environment.",
      };
    }

    // Role check
    if (data.role && user.role !== data.role && user.role !== "super_admin") {
      return {
        success: false,
        error: `This account does not have ${data.role === "super_admin" ? "Super Admin" : "Store Admin"} permissions.`,
      };
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password." };
    }

    // Upgrade legacy password hash in DB if not yet hashed with salt
    if (!user.passwordHash.includes(":")) {
      user.passwordHash = hashPassword(password);
      await user.save();
    }

    // Get assigned store name if store_admin
    let storeName: string | null = null;
    let storeIdStr: string | null = null;

    if (user.storeId) {
      const store = await Store.findById(user.storeId);
      if (store) {
        storeName = store.storeName;
        storeIdStr = store._id.toString();
      }
    } else if (user.role === "store_admin") {
      // Fallback: find any active store if user storeId wasn't linked
      const store = await Store.findOne({
        $or: [{ ownerEmail: user.email }, { status: "Active" }],
      });
      if (store) {
        storeName = store.storeName;
        storeIdStr = store._id.toString();
        user.storeId = store._id;
        await user.save();
      }
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Create signed token
    const token = createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: storeIdStr,
      storeName: storeName,
    });

    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Security Audit Log
    await AuditLog.create({
      storeId: user.storeId || undefined,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role === "super_admin" ? "Super Admin" : "Store Admin",
      ipAddress: "127.0.0.1",
      action: "USER_LOGIN_SUCCESS",
      actionCategory: "SECURITY",
      targetType: "Session",
      targetName: user.email,
      details: `Successful login as ${user.role}. Session established.`,
      timestamp: new Date(),
    });

    return {
      success: true,
      user: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: storeIdStr,
        storeName: storeName,
      },
    };
  } catch (error: any) {
    console.error("Error in loginAction:", error);

    // Demo fallback sessions are strictly prohibited in Production
    if (!isProd()) {
      const email = data.email?.trim().toLowerCase();
      const isDemoSuper = !isDemo() && email === "koushik@forstore.app";
      const isDemoStore = email === "manager@brewbites.com" || email?.includes("demo") || email?.includes("admin");

      if (isDemoSuper || isDemoStore) {
        const demoUser = isDemoSuper
          ? {
              userId: "demo-super-admin-id",
              name: "Koushik (Super Admin)",
              email: "koushik@forstore.app",
              role: "super_admin" as const,
              storeId: null,
              storeName: null,
            }
          : {
              userId: "demo-store-admin-id",
              name: "Brew Bites Manager",
              email: email || "manager@brewbites.com",
              role: "store_admin" as const,
              storeId: "demo-store-id",
              storeName: "Brew & Bites Arcade",
            };

        const token = createSessionToken(demoUser);
        const cookieStore = await cookies();
        cookieStore.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        return {
          success: true,
          user: demoUser,
        };
      }
    }

    return { success: false, error: error.message || "Failed to log in." };
  }
}

/**
 * Server Action: Clears session cookie and logs out.
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (currentToken) {
      const payload = verifySessionToken(currentToken);
      if (payload) {
        await connectDB();
        await AuditLog.create({
          actorName: payload.name,
          actorEmail: payload.email,
          actorRole: payload.role === "super_admin" ? "Super Admin" : "Store Admin",
          ipAddress: "127.0.0.1",
          action: "USER_LOGOUT",
          actionCategory: "SECURITY",
          targetType: "Session",
          targetName: payload.email,
          details: "User logged out. Session terminated.",
          timestamp: new Date(),
        });
      }
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error: any) {
    console.error("Error in logoutAction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Reads and validates the active session cookie.
 */
export async function getSessionAction(): Promise<{
  authenticated: boolean;
  user: SessionPayload | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false, user: null };
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: payload,
    };
  } catch (error: any) {
    console.error("Error in getSessionAction:", error);
    return { authenticated: false, user: null };
  }
}

export interface RegisterMerchantInput {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
}

/**
 * Server Action: Registers a new cafe store, sets up initial 100 trial credits, branding, minigames, and signs in user.
 */
export async function registerMerchantAction(input: RegisterMerchantInput) {
  try {
    await connectDB();

    const storeName = input.storeName.trim();
    const ownerName = input.ownerName.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!storeName || !ownerName || !email || !password) {
      return { success: false, error: "All fields are required." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    // Generate unique slug
    let baseSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!baseSlug) baseSlug = "store";

    let slug = baseSlug;
    let counter = 1;
    while (await Store.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create Store in MongoDB Atlas with Starter Plan & 1,500 Trial Scan Credits
    const store = await Store.create({
      storeName,
      slug,
      ownerEmail: email,
      ownerName,
      plan: "Starter",
      status: "Active",
      walletBalance: 1500, // 1,500 Free Credits credited on sign-up
      totalScans: 0,
      churnRisk: "Low",
      aiCreditsUsed: 0,
      whiteLabelOverride: false,
      watermarkRemoved: false,
      joinedDate: new Date(),
    });

    // Hash password with salted scrypt
    const passwordHash = hashPassword(password);

    // Create User record
    const user = await User.create({
      storeId: store._id,
      email,
      name: ownerName,
      role: "store_admin",
      passwordHash,
      totalCafePoints: 0,
      lastLoginAt: new Date(),
    });

    // Create Default Branding
    await StoreBranding.create({
      storeId: store._id,
      primaryColor: "#FF4C29",
      secondaryColor: "#332FD0",
      fontFamily: "Inter",
      darkMode: false,
      watermarkVisible: true,
    });

    // Provision default mini-games
    await getMiniGameConfigsAction(store._id.toString(), store.storeName);

    // Issue signed session token
    const token = createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: store._id.toString(),
      storeName: store.storeName,
    });

    // Set HttpOnly session cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Audit log
    await AuditLog.create({
      storeId: store._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: "Store Admin",
      ipAddress: "127.0.0.1",
      action: "MERCHANT_SELF_REGISTRATION",
      actionCategory: "SECURITY",
      targetType: "Store Account",
      targetName: store.storeName,
      details: `Self-serve merchant registration. Store "${store.storeName}" created with 100 trial scan credits.`,
      timestamp: new Date(),
    });

    return {
      success: true,
      user: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: store._id.toString(),
        storeName: store.storeName,
      },
    };
  } catch (error: any) {
    console.error("Error in registerMerchantAction:", error);
    return { success: false, error: error.message || "Failed to register store." };
  }
}

/**
 * Server Action: Validates the master admin PIN from URL parameter.
 */
export async function verifyMasterPinAction(pin: string) {
  try {
    const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "9900";
    const cleanPin = (pin || "").trim();

    if (cleanPin && cleanPin === MASTER_PIN) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: "forstore_admin_pin_verified",
        value: "true",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return { success: true };
    }

    return { success: false, error: "Invalid Master PIN." };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to verify PIN." };
  }
}

/**
 * Server Action: Clears the master admin PIN verification and logs out.
 */
export async function lockAdminAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("forstore_admin_pin_verified");
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to lock admin portal." };
  }
}

/**
 * Server Action: Recovers Store Admin PIN by dispatching a secure recovery email
 * directly to the registered store owner's inbox.
 */
export async function recoverStorePinAction(ownerEmail: string) {
  try {
    await connectDB();
    const cleanEmail = (ownerEmail || "").trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: "Please enter your registered store email." };
    }

    // Search store by owner email or fallback to store owner account
    let targetStore = await Store.findOne({ ownerEmail: cleanEmail });

    if (!targetStore) {
      // Check if user exists with store_admin role
      const user = await User.findOne({ email: cleanEmail, role: { $in: ["store_admin", "super_admin"] } });
      if (user && user.storeId) {
        targetStore = await Store.findById(user.storeId);
      }
    }

    if (!targetStore) {
      return {
        success: false,
        error: `No store registered under "${cleanEmail}". Please check your email or contact support.`,
      };
    }

    const pin = targetStore.adminPin;
    if (!pin) {
      return {
        success: false,
        error: "No PIN configured for this store. Please contact your administrator.",
      };
    }
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL || "";
    const accessUrl = appBaseUrl ? `${appBaseUrl}/?pin=${pin}` : `/?pin=${pin}`;

    // Dispatch secure email with the PIN and direct unlock link
    const emailRes = await sendPinRecoveryEmail({
      to: cleanEmail,
      storeName: targetStore.storeName,
      pin,
      accessUrl,
    });

    if (!emailRes.success) {
      return { success: false, error: emailRes.error || "Failed to dispatch recovery email." };
    }

    // Security Audit Log
    await AuditLog.create({
      storeId: targetStore._id,
      actorName: targetStore.ownerName || "Store Owner",
      actorEmail: cleanEmail,
      actorRole: "Store Admin",
      ipAddress: "127.0.0.1",
      action: "PIN_RECOVERY_EMAIL_SENT",
      actionCategory: "SECURITY",
      targetType: "Store Security",
      targetName: targetStore.storeName,
      details: `Recovery PIN email dispatched to ${cleanEmail} for ${targetStore.storeName}.`,
      timestamp: new Date(),
    });

    return {
      success: true,
      storeName: targetStore.storeName,
      maskedEmail: maskEmail(cleanEmail),
      simulated: emailRes.simulated,
      devPreviewUrl: emailRes.simulated ? accessUrl : undefined,
      devPreviewPin: emailRes.simulated ? pin : undefined,
    };
  } catch (error: any) {
    console.error("Error in recoverStorePinAction:", error);
    return { success: false, error: error.message || "Failed to recover PIN." };
  }
}

/**
 * Server Action: Updates a store's custom admin PIN.
 */
export async function updateStoreAdminPinAction(storeName: string, newPin: string) {
  try {
    await connectDB();
    const cleanPin = (newPin || "").trim();

    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: "PIN must be at least 4 characters." };
    }

    const store = await Store.findOneAndUpdate(
      { storeName },
      { $set: { adminPin: cleanPin } },
      { new: true }
    );

    if (!store) {
      return { success: false, error: `Store "${storeName}" not found.` };
    }

    await AuditLog.create({
      storeId: store._id,
      actorName: store.ownerName || "Store Manager",
      actorEmail: store.ownerEmail,
      actorRole: "Store Admin",
      ipAddress: "127.0.0.1",
      action: "STORE_PIN_UPDATED",
      actionCategory: "SECURITY",
      targetType: "Store Security",
      targetName: store.storeName,
      details: `Admin PIN updated for ${store.storeName}.`,
      timestamp: new Date(),
    });

    return { success: true, newPin: cleanPin };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update PIN." };
  }
}

/**
 * Server Action: Fetches a store's current admin PIN.
 */
export async function getStoreAdminPinAction(storeName: string) {
  try {
    await connectDB();
    const store = await Store.findOne({ storeName });
    if (!store) {
      return { success: false, error: "Store not found" };
    }
    if (!store.adminPin && isProd()) {
      return { success: false, error: "No PIN configured for this store." };
    }
    return { success: true, pin: store.adminPin || (isProd() ? "" : "9900") };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

