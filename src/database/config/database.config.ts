import mongoose from 'mongoose';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-app';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Using only essential and supported options
export const CONNECTION_OPTIONS: mongoose.ConnectOptions = {
  bufferCommands: false,
  maxPoolSize: 20,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 30000,
  autoIndex: true
};
