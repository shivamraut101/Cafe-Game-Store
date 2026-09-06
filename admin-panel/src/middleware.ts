import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding-window IP rate limiter
interface AttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}

const ipAttempts = new Map<string, AttemptRecord>();

// Security Configuration
const MAX_ATTEMPTS = 5; // Max 5 failed attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute cooldown
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10-minute sliding window

/**
 * Constant-time string comparison to prevent side-channel timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let dummy = 0;
    for (let i = 0; i < a.length; i++) {
      dummy |= a.charCodeAt(i) ^ a.charCodeAt(i);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Always allow static files, images, icons, Next.js internal bundles, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Always allow public store, player pages, and PIN recovery portal:
  // /arcade, /play/*, /my-rewards, /claim/*, /[storeSlug]/claim, /recover-pin
  if (
    pathname.startsWith("/arcade") ||
    pathname.startsWith("/play") ||
    pathname.startsWith("/my-rewards") ||
    pathname.startsWith("/claim") ||
    pathname.startsWith("/recover-pin") ||
    pathname.endsWith("/claim")
  ) {
    return NextResponse.next();
  }

  // 3. Admin Portal Gatekeeper (Protected route: "/")
  const MASTER_PIN = process.env.ADMIN_MASTER_PIN || "9900";
  const urlPin = searchParams.get("pin");
  const cookiePin = request.cookies.get("forstore_admin_pin_verified")?.value;
  const adminSession = request.cookies.get("forstore_session")?.value;

  // Extract client IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");

  const now = Date.now();
  let clientRecord = ipAttempts.get(clientIp);

  // Clean up record if sliding window expired and not locked
  if (clientRecord && now > clientRecord.lockedUntil && (now - clientRecord.lastAttempt > ATTEMPT_WINDOW_MS)) {
    ipAttempts.delete(clientIp);
    clientRecord = undefined;
  }

  // Check if this IP is currently locked out due to previous brute-force attempts
  if (clientRecord && clientRecord.lockedUntil > now) {
    const remainingSeconds = Math.ceil((clientRecord.lockedUntil - now) / 1000);
    // Return 429 Too Many Requests with stealth redirect header
    return new NextResponse(
      `<html><head><meta http-equiv="refresh" content="3;url=/arcade?store=adda-99"></head><body style="font-family:sans-serif;text-align:center;padding:50px;background:#111;color:#fff;"><h2>🔒 Security Lockout Active</h2><p>Too many invalid PIN attempts from your IP. Access locked for ${remainingSeconds} seconds.</p><p>Redirecting to store arcade...</p></body></html>`,
      {
        status: 429,
        headers: {
          "Content-Type": "text/html",
          "Retry-After": remainingSeconds.toString(),
          "X-Security-Action": "IP_RATE_LIMITED",
        },
      }
    );
  }

  // If a PIN is supplied in the URL, validate it with timing-safe comparison
  if (urlPin) {
    let isPinCorrect = constantTimeCompare(urlPin.trim(), MASTER_PIN);

    // If not master PIN, verify against individual store PINs
    if (!isPinCorrect) {
      try {
        const verifyRes = await fetch(new URL("/api/auth/verify-store-pin", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: urlPin.trim() }),
        });
        if (verifyRes.ok) {
          const data = await verifyRes.json();
          if (data.valid) {
            isPinCorrect = true;
          }
        }
      } catch (err) {
        console.error("Store PIN verification error in middleware", err);
      }
    }

    if (isPinCorrect) {
      // Clear failed attempts counter upon successful verification
      ipAttempts.delete(clientIp);

      const response = NextResponse.next();
      response.cookies.set({
        name: "forstore_admin_pin_verified",
        value: "true",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        sameSite: "lax",
        httpOnly: true,
      });
      return response;
    } else {
      // Failed attempt: update brute-force tracking
      if (!clientRecord) {
        clientRecord = { count: 1, lockedUntil: 0, lastAttempt: now };
      } else {
        clientRecord.count += 1;
        clientRecord.lastAttempt = now;
      }

      if (clientRecord.count >= MAX_ATTEMPTS) {
        clientRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      ipAttempts.set(clientIp, clientRecord);

      // Stealth redirect immediately back to public arcade
      const publicStoreUrl = new URL("/arcade?store=adda-99", request.url);
      return NextResponse.redirect(publicStoreUrl);
    }
  }

  // If already unlocked via verified PIN cookie or active admin session
  if (cookiePin === "true" || adminSession) {
    return NextResponse.next();
  }

  // 4. Unauthorized visitor accessing root "/" without master PIN:
  // Redirect to public store arcade so normal visitors never see the admin portal
  const publicStoreUrl = new URL("/arcade?store=adda-99", request.url);
  return NextResponse.redirect(publicStoreUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files & API
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
