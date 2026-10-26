import mongoose from "mongoose";

let connectionPromise;

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDatabase() {
  if (!isDatabaseConfigured()) return false;
  if (mongoose.connection.readyState === 1) return true;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  await connectionPromise;
  return true;
}
