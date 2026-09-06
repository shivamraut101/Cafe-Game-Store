/**
 * Player Session Manager
 * Ensures every mobile phone, tablet, and incognito window has a unique, persistent guest identity.
 */

export const PLAYER_COOKIE_NAME = "forstore_player_id";

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
