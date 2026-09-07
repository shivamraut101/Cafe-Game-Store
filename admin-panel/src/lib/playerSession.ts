/**
 * Player Session Manager
 * Ensures every mobile phone, tablet, and incognito window has a unique, persistent guest identity.
 */

export const PLAYER_COOKIE_NAME = "forstore_player_id";
export const PLAYER_NAME_KEY = "forstore_player_name";

export function getOrCreateClientPlayerId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = localStorage.getItem(PLAYER_COOKIE_NAME);
    if (!id) {
      id = localStorage.getItem("forstore_guest_player_id");
    }
    if (!id) {
      // Check existing cookie first
      const match = document.cookie.match(new RegExp(`(^|;\\s*)${PLAYER_COOKIE_NAME}=([^;]+)`));
      if (match && match[2]) {
        id = decodeURIComponent(match[2]);
      }
    }

    if (!id) {
      // Generate clean 10-char unique guest player ID (e.g. ply_7x9k4b)
      id = "ply_" + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
    }

    localStorage.setItem(PLAYER_COOKIE_NAME, id);
    localStorage.setItem("forstore_guest_player_id", id);
    document.cookie = `${PLAYER_COOKIE_NAME}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    return id;
  } catch {
    return "ply_guest";
  }
}

export function setClientPlayerIdentity(guestId: string, name?: string): void {
  if (typeof window === "undefined" || !guestId) return;
  try {
    localStorage.setItem(PLAYER_COOKIE_NAME, guestId);
    localStorage.setItem("forstore_guest_player_id", guestId);
    document.cookie = `${PLAYER_COOKIE_NAME}=${guestId}; path=/; max-age=31536000; SameSite=Lax`;

    if (name && !isDefaultPlayerName(name)) {
      setClientPlayerName(name);
    }
  } catch {}
}

export function getClientPlayerName(): string {
  if (typeof window === "undefined") return "";
  try {
    const local = localStorage.getItem(PLAYER_NAME_KEY);
    if (local) return local;
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${PLAYER_NAME_KEY}=([^;]+)`));
    if (match && match[2]) {
      return decodeURIComponent(match[2]);
    }
    return "";
  } catch {
    return "";
  }
}

export function setClientPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(PLAYER_NAME_KEY, trimmed);
      document.cookie = `${PLAYER_NAME_KEY}=${encodeURIComponent(trimmed)}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem(PLAYER_NAME_KEY);
      document.cookie = `${PLAYER_NAME_KEY}=; path=/; max-age=0`;
    }
  } catch {}
}

export function isDefaultPlayerName(name?: string): boolean {
  if (!name || !name.trim()) return true;
  const n = name.trim();
  return (
    n.startsWith("Player #") ||
    n === "Player" ||
    n === "Arcade Player" ||
    n === "Valued Customer" ||
    n === "Guest"
  );
}

/**
 * Computes a stable, cross-profile/incognito hardware device fingerprint.
 * Normal Chrome tabs and Incognito tabs on the same device compute identical fingerprints.
 */
export function getClientDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    const parts: string[] = [];

    // Screen geometry & color depth
    if (typeof screen !== "undefined") {
      parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio || 1}`);
    }

    // Hardware parameters
    if (typeof navigator !== "undefined") {
      parts.push(`hc:${navigator.hardwareConcurrency || 4}`);
      parts.push(`mp:${navigator.maxTouchPoints || 0}`);
      parts.push(`lang:${navigator.language || ""}`);
    }

    // Timezone
    try {
      parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {}

    // WebGL Unmasked GPU renderer & vendor
    try {
      const glCanvas = document.createElement("canvas");
      const gl = glCanvas.getContext("webgl") || glCanvas.getContext("experimental-webgl");
      if (gl && "getExtension" in gl) {
        const ext = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
        if (ext) {
          const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL);
          const vendor = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL);
          parts.push(`gl:${vendor}~${renderer}`);
        }
      }
    } catch {}

    // Canvas 2D font rasterization signature
    try {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 40;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial', sans-serif";
        ctx.fillStyle = "#F59E0B";
        ctx.fillRect(10, 5, 50, 20);
        ctx.fillStyle = "#FF4C29";
        ctx.fillText("CafeGame🎮☕", 4, 10);
        ctx.strokeStyle = "rgba(0, 150, 255, 0.6)";
        ctx.strokeText("CafeGame🎮☕", 6, 12);
        parts.push(c.toDataURL().slice(-40));
      }
    } catch {}

    const raw = parts.join("|");
    let h1 = 0xdeadbeef;
    let h2 = 0x41c64e6d;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const hashStr = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    return `dfp_${hashStr}`;
  } catch {
    return "dfp_unknown";
  }
}

