/**
 * 3-Hour Rolling In-Store Access Key System
 * Regulates in-store access without GPS.
 * The secret key rotates every 3 hours.
 * Only customers scanning the fresh table QR code in the cafe receive an authorized session.
 */

const SECRET_SALT = "forstore_3hr_rotating_arcade_salt_2026";
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

// Simple deterministic hash for universal client/server support without heavy external deps
function simpleHash(input: string): string {
  let hash = 5381;
  let hash2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ (char * 33);
  }
  const combined = (Math.abs(hash) * 1000000007 + Math.abs(hash2)).toString(36).toUpperCase();
  return combined.slice(-6).padStart(6, "X");
}

export function getCurrentTimeWindow(date = Date.now()): number {
  return Math.floor(date / THREE_HOURS_MS);
}

export function getNextRotationMs(date = Date.now()): number {
  const currentWindow = getCurrentTimeWindow(date);
  const nextWindowStart = (currentWindow + 1) * THREE_HOURS_MS;
  return Math.max(0, nextWindowStart - date);
}

/**
 * Generates the deterministic 3-hour key for a given store.
 * windowOffset: 0 for current window, -1 for previous window (grace period), 1 for next.
 */
export function generateStoreKey(storeSlug: string, windowOffset = 0): string {
  const normalizedSlug = (storeSlug || "default-store").toLowerCase().trim();
  const timeWindow = getCurrentTimeWindow() + windowOffset;
  const raw = `${normalizedSlug}:${SECRET_SALT}:${timeWindow}`;
  const code = simpleHash(raw);
  return `CAFE-${code}`;
}

/**
 * Validates a submitted key against current 3-hour window and previous window (grace period).
 */
export function verifyStoreKey(
  storeSlug: string,
  keyToTest?: string
): { valid: boolean; activeKey: string; nextRotationInMs: number } {
  const activeKey = generateStoreKey(storeSlug, 0);
  const graceKey = generateStoreKey(storeSlug, -1);
  const nextRotationInMs = getNextRotationMs();

  if (!keyToTest) {
    return { valid: false, activeKey, nextRotationInMs };
  }

  const cleanInput = keyToTest.trim().toUpperCase();
  const valid = cleanInput === activeKey || cleanInput === graceKey;

  return { valid, activeKey, nextRotationInMs };
}

export const IN_STORE_SESSION_PREFIX = "forstore_instore_pass_";

export interface InStoreSessionData {
  storeSlug: string;
  key: string;
  verifiedAt: number;
  expiresAt: number;
}

/**
 * Check if the browser currently holds an active, non-expired in-store pass for this store.
 */
export function getClientInStoreSession(storeSlug: string): InStoreSessionData | null {
  if (typeof window === "undefined") return null;

  try {
    const slugKey = (storeSlug || "default-store").toLowerCase().trim();
    const raw = localStorage.getItem(`${IN_STORE_SESSION_PREFIX}${slugKey}`);
    if (!raw) return null;

    const data: InStoreSessionData = JSON.parse(raw);
    if (!data || !data.expiresAt) return null;

    // Check if session has expired past 3 hours
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(`${IN_STORE_SESSION_PREFIX}${slugKey}`);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Save an authorized in-store session on the customer's device for 3 hours.
 */
export function saveClientInStoreSession(storeSlug: string, key: string): InStoreSessionData {
  const slugKey = (storeSlug || "default-store").toLowerCase().trim();
  const now = Date.now();
  const session: InStoreSessionData = {
    storeSlug: slugKey,
    key,
    verifiedAt: now,
    expiresAt: now + THREE_HOURS_MS,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${IN_STORE_SESSION_PREFIX}${slugKey}`, JSON.stringify(session));
      document.cookie = `${IN_STORE_SESSION_PREFIX}${slugKey}=${encodeURIComponent(key)}; path=/; max-age=10800; SameSite=Lax`;
    } catch {}
  }

  return session;
}

/**
 * Clears the in-store session when expired.
 */
export function clearClientInStoreSession(storeSlug: string): void {
  if (typeof window === "undefined") return;
  const slugKey = (storeSlug || "default-store").toLowerCase().trim();
  try {
    localStorage.removeItem(`${IN_STORE_SESSION_PREFIX}${slugKey}`);
    document.cookie = `${IN_STORE_SESSION_PREFIX}${slugKey}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}
