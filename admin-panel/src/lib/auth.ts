import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "forstore_super_secret_signing_key_cafe_loyalty_2026_prod_secure";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "super_admin" | "store_admin" | "customer";
  storeId?: string | null;
  storeName?: string | null;
  expiresAt: number;
}

/**
 * Hashes a plaintext password using Node.js native crypto scrypt with a unique random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored salted hash.
 * Handles both new salted hashes and legacy seed strings for smooth backward-compatibility.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // If stored hash contains salt:derivedKey
  if (storedHash.includes(":")) {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  }

  // Fallback for seed accounts (initial development mode)
  // Accepts standard default passwords: super123, admin123, or exact email match
  if (
    storedHash === password ||
    storedHash === "placeholder_or_admin123" ||
    storedHash === "koushik@forstore.app" ||
    storedHash === "manager@brewbites.com" ||
    storedHash === "manager@downtowntacos.com"
  ) {
    return (
      password === "super123" ||
      password === "admin123" ||
      password === "password" ||
      password === storedHash
    );
  }

  return false;
}

/**
 * Creates an HMAC-SHA256 signed session token containing JSON payload.
 */
export function createSessionToken(payload: Omit<SessionPayload, "expiresAt">): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data: SessionPayload = { ...payload, expiresAt };
  const jsonStr = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(jsonStr)
    .digest("base64url");
  return `${jsonStr}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [jsonStr, signature] = token.split(".");
    if (!jsonStr || !signature) return null;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(jsonStr)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "utf-8"),
        Buffer.from(expectedSig, "utf-8")
      )
    ) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(jsonStr, "base64url").toString("utf-8"));
    if (!decoded.expiresAt || decoded.expiresAt < Date.now()) {
      return null;
    }

    return decoded as SessionPayload;
  } catch {
    return null;
  }
}
