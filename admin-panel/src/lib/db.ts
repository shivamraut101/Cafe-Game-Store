import mongoose from "mongoose";

export function getResolvedMongoURI(): string {
  // 1. Direct MONGODB_URI check (strip accidental 'MONGODB_URI=' prefix or quotes if pasted)
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    let uri = process.env.MONGODB_URI.trim();
    if (uri.startsWith("MONGODB_URI=")) {
      uri = uri.replace(/^MONGODB_URI=/, "").trim();
    }
    return uri.replace(/^["']|["']$/g, "");
  }

  // 2. Handle cases where the whole URI was accidentally pasted into MONGODB_ENV
  const rawEnv = (process.env.MONGODB_ENV || "").trim();
  if (rawEnv.includes("mongodb://") || rawEnv.includes("mongodb+srv://")) {
    const match = rawEnv.match(/mongodb(?:\+srv)?:\/\/[^\s"']+/);
    if (match) {
      return match[0].replace(/^["']|["']$/g, "");
    }
  }

  // 3. Multi-Environment Mode Resolution
  const envMode = (process.env.MONGODB_ENV || "demo").toLowerCase();

  let targetUri: string | undefined;

  if (envMode === "prod") {
    targetUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
  } else if (envMode === "dev") {
    targetUri = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
  } else {
    // "demo" mode default
    targetUri = process.env.MONGODB_URI_DEMO || process.env.MONGODB_URI;
  }

  if (!targetUri) {
    targetUri = process.env.MONGO_URI || process.env.DATABASE_URL;
  }

  if (!targetUri) {
    throw new Error(
      `[MongoDB] Missing MongoDB connection string for environment "${envMode}". Please configure MONGODB_URI in your Vercel Environment Variables.`
    );
  }

  return targetUri.trim().replace(/^["']|["']$/g, "");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const mongoUri = getResolvedMongoURI();
  const envMode = (process.env.MONGODB_ENV || "demo").toUpperCase();

  if (!cached.promise) {
    console.log(`🔌 [MongoDB] Connecting to ${envMode} Database...`);
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ [MongoDB] Connected to ${envMode} Database successfully!`);
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
