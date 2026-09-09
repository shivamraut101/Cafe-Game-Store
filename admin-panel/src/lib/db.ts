import mongoose from "mongoose";
import { getAppEnvironment } from "./appEnv";

export function getResolvedMongoURI(): string {
  const envMode = getAppEnvironment(); // "prod" | "demo" | "dev"

  let targetUri: string | undefined;

  // 1. Environment-Strict Resolution: Guarantee Prod and Demo cannot cross-talk
  if (envMode === "prod") {
    targetUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
  } else if (envMode === "demo") {
    targetUri = process.env.MONGODB_URI_DEMO || process.env.MONGODB_URI;
  } else {
    targetUri = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
  }

  // 2. General Fallbacks if specific env string not provided
  if (!targetUri) {
    targetUri = process.env.MONGO_URI || process.env.DATABASE_URL;
  }

  // 3. Clean accidental prefixes or quotes
  if (targetUri) {
    let clean = targetUri.trim();
    if (clean.startsWith("MONGODB_URI=")) {
      clean = clean.replace(/^MONGODB_URI=/, "").trim();
    }
    targetUri = clean.replace(/^["']|["']$/g, "");
  }

  if (!targetUri) {
    throw new Error(
      `[MongoDB] Missing MongoDB connection string for environment "${envMode}". Please configure MONGODB_URI or MONGODB_URI_${envMode.toUpperCase()} in your environment variables.`
    );
  }

  return targetUri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  connectedUri?: string;
  connectedEnv?: string;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = getResolvedMongoURI();
  const envMode = getAppEnvironment();

  // Deadlock & Cross-Talk Prevention:
  // If connection exists, is ready (1), and points to the EXACT current URI, reuse it!
  if (
    cached.conn &&
    cached.conn.connection.readyState === 1 &&
    cached.connectedUri === mongoUri
  ) {
    return cached.conn;
  }

  // If connection was to a different URI or closed, reset and reconnect cleanly
  if (cached.conn && (cached.conn.connection.readyState !== 1 || cached.connectedUri !== mongoUri)) {
    try {
      await mongoose.disconnect();
    } catch {}
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log(`🔌 [MongoDB] Connecting to ${envMode.toUpperCase()} Database...`);
    cached.connectedUri = mongoUri;
    cached.connectedEnv = envMode;
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ [MongoDB] Connected to ${envMode.toUpperCase()} Database successfully!`);
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
