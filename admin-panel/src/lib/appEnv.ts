/**
 * Application Environment Manager
 * Strictly separates Production ("prod") and Demo ("demo") environments.
 * Prevents database cross-talk, demo test credential leaks, and session deadlocks.
 */

export type AppEnvironment = "prod" | "demo" | "dev";

export function getAppEnvironment(): AppEnvironment {
  // Server-side & build-time environment resolution
  const raw = (
    process.env.APP_ENV ||
    process.env.NEXT_PUBLIC_APP_ENV ||
    process.env.MONGODB_ENV ||
    process.env.NODE_ENV ||
    "demo"
  )
    .toLowerCase()
    .trim();

  if (raw === "prod" || raw === "production") return "prod";
  if (raw === "demo") return "demo";
  if (raw === "dev" || raw === "development") return "dev";
  return "demo";
}

export function isProd(): boolean {
  return getAppEnvironment() === "prod";
}

export function isDemo(): boolean {
  return getAppEnvironment() === "demo";
}

export function isDev(): boolean {
  return getAppEnvironment() === "dev";
}

/**
 * Client-side environment check using public environment variable
 */
export function getClientAppEnvironment(): AppEnvironment {
  if (typeof window === "undefined") return getAppEnvironment();
  
  const raw = (
    process.env.NEXT_PUBLIC_APP_ENV ||
    "demo"
  )
    .toLowerCase()
    .trim();

  if (raw === "prod" || raw === "production") return "prod";
  if (raw === "dev" || raw === "development") return "dev";
  return "demo";
}
