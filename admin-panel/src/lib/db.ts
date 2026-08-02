import mongoose from "mongoose";

export function getResolvedMongoURI(): string {
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

  return (
    targetUri ||
    "mongodb+srv://shivamkumarraut12_db_user:XrQ3FmIzz4S7j058@cluster0.5qmwn8w.mongodb.net/cafe-game-store-demo?retryWrites=true&w=majority&appName=Cluster0"
  );
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
