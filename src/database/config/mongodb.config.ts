import mongoose from 'mongoose';
import { env } from '@/config/environment';

// Connection options
const connectionOptions = {
  dbName: env.MONGODB_DB_NAME,
  autoIndex: true,
  connectTimeoutMS: 10000,
  retryWrites: true,
  // Add additional options as needed
};

/**
 * Connect to MongoDB
 * This function handles connection, error handling, and reconnection
 */
export const connectMongoDB = async (): Promise<typeof mongoose | null> => {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      console.log('🔄 Connecting to MongoDB...');
      
      // Set up connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connection established successfully');
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });

      // Handle application termination
      process.on('SIGINT', () => {
        mongoose.connection.close(() => {
          console.log('MongoDB connection closed due to application termination');
          process.exit(0);
        });
      });

      // Connect to MongoDB
      await mongoose.connect(env.MONGODB_URI, connectionOptions);
      return mongoose;
    } else {
      console.log('✅ Using existing MongoDB connection');
      return mongoose;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Allow the application to handle the error instead of exiting immediately
    return null;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
};

// Export mongoose instance for reuse
export const mongooseInstance = mongoose;
