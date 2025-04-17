import mongoose from 'mongoose';
import { connectToDatabase } from '../connection/connection.manager';
import { modelRegistry } from '../models/model.registry';

export class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<typeof mongoose> {
    const maxRetries = 3;
    let connection: typeof mongoose;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
const dbConnection = await connectToDatabase();
if (!dbConnection) throw new Error('Failed to establish database connection');
connection = dbConnection;
        if (!this.isInitialized) {
          await this.initializeDatabase();
          this.isInitialized = true;
        }
        return connection;
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed: ${error}`);
        if (attempt === maxRetries) throw new Error('Max connection retries reached');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Unexpected error in connection sequence');
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const isValid = await modelRegistry.validateCollections();
      if (!isValid) {
        console.log('Creating missing collections...');
const models = [modelRegistry.getModel('YourModelName')] as mongoose.Model<any>[];
        await Promise.all(models.map(async model => {
          if (mongoose.connection.db && !await mongoose.connection.db.listCollections({ name: model.collection.name }).hasNext()) {
            await model.createCollection();
            console.log(`Created collection: ${model.collection.name}`);
          }
        }));
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(`Failed to initialize database: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('Database connection closed gracefully');
      } else {
        console.warn(`Attempted to disconnect from ${this.getConnectionStateString()} state`);
      }
      this.isInitialized = false;
    } catch (error) {
      console.error('Disconnection error:', error);
      throw new Error(`Failed to disconnect: ${(error as Error).message}`);
    }
  }

  async clearDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      console.log('Clearing test database');
      const collections = mongoose.connection.collections;
      await Promise.all(Object.keys(collections).map(async key => {
        await collections[key].deleteMany({});
        console.log(`Cleared collection: ${key}`);
      }));
    } else {
      console.warn('Database clearance prevented - only allowed in test environment');
    }
  }

  async getCollectionNames(): Promise<string[]> {
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    const collections = await mongoose.connection.db.listCollections().toArray();
    return collections.map(collection => collection.name);
  }

  async ping(): Promise<boolean> {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection not established');
      }
      return true;
    } catch (error) {
      console.error(`Database ping failed (${this.getConnectionStateString()}):`, error);
      return false;
    }
  }

  getConnectionState(): number {
    return mongoose.connection.readyState;
  }

  getConnectionStateString(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      4: 'uninitialized'
    };
    return states[this.getConnectionState() as keyof typeof states] || 'unknown';
  }

  getModel<T>(modelName: string): mongoose.Model<T> {
    const model = modelRegistry.getModel<T>(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found in registry`);
    }
    return model;
  }

  async runSeed(): Promise<boolean> {
    try {
      await this.connect();
      const { seedInitialData } = await import('@/database/seeders/initial-seed');
      const result = await seedInitialData();
      await this.disconnect();
      return result;
    } catch (error) {
      console.error('Data seeding failed:', error);
      await this.disconnect();
      return false;
    }
  }
}

export const databaseService = DatabaseService.getInstance();