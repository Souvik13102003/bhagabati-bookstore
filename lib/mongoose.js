// lib/mongoose.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Mongoose connection caching for serverless environments.
 * Uses globalThis._mongoose to avoid opening new connections on each invocation.
 */
let cached = globalThis._mongoose;

if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      // Recommended options
      bufferCommands: false,
      // useNewUrlParser & useUnifiedTopology removed in Mongoose v6 (defaults)
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connect;
