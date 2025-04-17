import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';
import { Group } from '@/models/Group';

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models: Map<string, mongoose.Model<any>>;

  private constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  private initializeModels(): void {
    // Register all models
    this.models.set('User', User);
    this.models.set('Transaction', Transaction);
    this.models.set('Group', Group);
    // Add a check to ensure models are valid
    for (const [name, model] of this.models.entries()) {
      if (!model || typeof model !== 'function') {
        console.error(`Model for ${name} is invalid or not defined.`);
      }
    }
  }

  getModel<T>(modelName: string): mongoose.Model<T> | undefined {
    return this.models.get(modelName) as mongoose.Model<T>;
  }

  getAllModelNames(): string[] {
    return Array.from(this.models.keys());
  }

  async validateCollections(): Promise<boolean> {
    try {
      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      let allExist = true;
      for (const modelName of this.getAllModelNames()) {
        if (!collectionNames.includes(modelName.toLowerCase())) {
          console.warn(`Collection for model ${modelName} does not exist. Attempting to create...`);
          const model = this.getModel(modelName);
          if (model) {
            try {
              await model.createCollection();
              console.log(`Created collection for model ${modelName}`);
            } catch (err) {
              console.error(`Failed to create collection for model ${modelName}:`, err);
              allExist = false;
            }
          } else {
            console.error(`Model ${modelName} is not registered.`);
            allExist = false;
          }
        }
      }
      return allExist;
    } catch (error) {
      console.error('Error validating collections:', error);
      return false;
    }
  }
}

export const modelRegistry = ModelRegistry.getInstance();