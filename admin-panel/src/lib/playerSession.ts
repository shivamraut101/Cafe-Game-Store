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
    document.cookie = `${PLAYER_COOKIE_NAME}=${id}; path=/; max-age=31536000; SameSite=Lax`;
    return id;
  } catch {
    return "ply_guest";
  }
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

