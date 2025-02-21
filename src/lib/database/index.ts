import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const globalWithMongoose = global as unknown as { mongoose?: { conn: Connection | null; promise: Promise<Connection> | null } };
const cached = globalWithMongoose.mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;
    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, { dbName: 'EventLoom', bufferCommands: false }).then(m => m.connection);
    cached.conn = await cached.promise;
    globalWithMongoose.mongoose = cached;
    return cached.conn;
};
