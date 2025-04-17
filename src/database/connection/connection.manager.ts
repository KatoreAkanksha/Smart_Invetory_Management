import mongoose from 'mongoose';
import { MONGODB_URI, CONNECTION_OPTIONS } from '../config/database.config';

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
  lastError?: Error;
  lastErrorTime?: number;
};

const cached: CachedConnection = {
  conn: null,
  promise: null,
  isConnecting: false
};

const MAX_RECONNECT_ATTEMPTS = 5;
const MIN_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const ERROR_THRESHOLD_TIME = 60000;
let reconnectAttempts = 0;

export async function connectToDatabase() {
  try {
    if (cached.conn && mongoose.connection.readyState === 1) {
      return cached.conn;
    }

    if (cached.lastError && cached.lastErrorTime) {
      const timeSinceLastError = Date.now() - cached.lastErrorTime;
      if (timeSinceLastError < ERROR_THRESHOLD_TIME) {
        await new Promise(resolve => setTimeout(resolve, ERROR_THRESHOLD_TIME - timeSinceLastError));
      }
    }

    if (cached.isConnecting) {
      return await cached.promise;
    }

    cached.isConnecting = true;

    if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
      await mongoose.connection.close();
      cached.conn = null;
      cached.promise = null;
    }

    if (!cached.promise) {
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined');
      }
      cached.promise = mongoose.connect(MONGODB_URI, CONNECTION_OPTIONS);
    }

    cached.conn = await cached.promise;
    setupEventHandlers();
    return cached.conn;
  } catch (error) {
    await handleConnectionFailure(error);
    throw error;
  } finally {
    cached.isConnecting = false;
  }
}

function setupEventHandlers() {
  mongoose.connection.off('error', handleConnectionError);
  mongoose.connection.off('disconnected', handleDisconnection);
  
  mongoose.connection.on('error', handleConnectionError);
  mongoose.connection.on('disconnected', handleDisconnection);
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
    reconnectAttempts = 0;
    cached.lastError = undefined;
    cached.lastErrorTime = undefined;
  });
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
    reconnectAttempts = 0;
    cached.lastError = undefined;
    cached.lastErrorTime = undefined;
  });
}

function handleConnectionError(err: Error) {
  console.error('MongoDB connection error:', err);
  cached.lastError = err;
  cached.lastErrorTime = Date.now();
  handleReconnection();
}

function handleDisconnection() {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  if (mongoose.connection.readyState !== 2) {
    handleReconnection();
  }
}

async function handleConnectionFailure(error: unknown) {
  cached.promise = null;
  cached.conn = null;
  cached.lastError = error instanceof Error ? error : new Error(String(error));
  cached.lastErrorTime = Date.now();
  console.error('MongoDB connection failed:', error);
  handleReconnection();
}

function handleReconnection() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    reconnectAttempts = 0;
    return;
  }

  reconnectAttempts++;
  const backoffDelay = Math.min(
    MIN_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1),
    MAX_RECONNECT_DELAY
  );
  
  console.log(`Attempting reconnection ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffDelay}ms`);
  
  cached.promise = null;
  setTimeout(() => {
    if (mongoose.connection.readyState !== 1) {
      connectToDatabase().catch(err => {
        console.error('Reconnection attempt failed:', err);
      });
    }
  }, backoffDelay);
}