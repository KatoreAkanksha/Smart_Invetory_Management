import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Define a type for our cached connection
type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
  lastError?: Error;
  lastErrorTime?: number;
};

// Create a cached object that works in both Node.js and browser environments
const cached: CachedConnection = {
  conn: null,
  promise: null,
  isConnecting: false
};

// Connection management constants
const MAX_RECONNECT_ATTEMPTS = 5;
const MIN_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const ERROR_THRESHOLD_TIME = 60000; // 1 minute
let reconnectAttempts = 0;

// Enhanced connection options with optimized settings
const CONNECTION_OPTIONS = {
  bufferCommands: false,
  maxPoolSize: 20,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  autoIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

export async function connectToDatabase() {
  try {
    // Return existing connection if available and connected
    if (cached.conn && mongoose.connection.readyState === 1) {
      return cached.conn;
    }

    // Check if we're hitting errors too frequently
    if (cached.lastError && cached.lastErrorTime) {
      const timeSinceLastError = Date.now() - cached.lastErrorTime;
      if (timeSinceLastError < ERROR_THRESHOLD_TIME) {
        console.warn('Too many connection errors recently. Waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, ERROR_THRESHOLD_TIME - timeSinceLastError));
      }
    }

    // Prevent multiple simultaneous connection attempts
    if (cached.isConnecting) {
      return await cached.promise;
    }

    cached.isConnecting = true;

    // Clear existing connection if it's in a bad state
    if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
      await mongoose.connection.close();
      cached.conn = null;
      cached.promise = null;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI!, CONNECTION_OPTIONS);
    }

    cached.conn = await cached.promise;

    // Set up connection event handlers with debouncing
    const setupEventHandlers = () => {
      mongoose.connection.off('error', handleConnectionError);
      mongoose.connection.off('disconnected', handleDisconnection);
      
      mongoose.connection.on('error', handleConnectionError);
      mongoose.connection.on('disconnected', handleDisconnection);
      mongoose.connection.on('connected', async () => {
        console.log('MongoDB connected successfully');
        reconnectAttempts = 0;
        cached.lastError = undefined;
        cached.lastErrorTime = undefined;
        
        const db = mongoose.connection.db;
        console.log(`Connected to database: ${db?.databaseName ?? 'unknown'}`);
        
        try {
          const collections = await db?.listCollections().toArray();
          console.log('Available collections:', collections?.map(c => c.name) ?? []);
        } catch (err) {
          console.error('Error listing collections:', err);
        }
      });
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
        reconnectAttempts = 0;
        cached.lastError = undefined;
        cached.lastErrorTime = undefined;
      });
    };

    setupEventHandlers();
    return cached.conn;
  } catch (error) {
    await handleConnectionFailure(error);
    throw error;
  } finally {
    cached.isConnecting = false;
  }
}

// Enhanced error handling with error tracking
function handleConnectionError(err: Error) {
  console.error('MongoDB connection error:', err);
  cached.lastError = err;
  cached.lastErrorTime = Date.now();
  handleReconnection();
}

// Improved disconnection handling
function handleDisconnection() {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
  if (mongoose.connection.readyState !== 2) { // Not connecting
    handleReconnection();
  }
}

// Enhanced connection failure handling
async function handleConnectionFailure(error: unknown) {
  cached.promise = null;
  cached.conn = null;
  cached.lastError = error instanceof Error ? error : new Error(String(error));
  cached.lastErrorTime = Date.now();
  console.error('MongoDB connection failed:', error);
  handleReconnection();
}

// Improved reconnection logic with exponential backoff
function handleReconnection() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    reconnectAttempts = 0; // Reset for future attempts
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
    if (mongoose.connection.readyState !== 1) { // Not connected
      connectToDatabase().catch(err => {
        console.error('Reconnection attempt failed:', err);
      });
    }
  }, backoffDelay);
}