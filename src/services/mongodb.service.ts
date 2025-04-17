import { connectToDatabase } from '@/lib/mongodb';
import { Transaction } from '@/models/Transaction';
import { Group as GroupModel } from '@/models/Group';
import { User } from '@/models/User';
import type { Group } from '@/types/group';
import type { User as UserType } from '@/types/user';
import type { Transaction as TransactionType } from '@/types/payment';

interface ServiceError extends Error {
  code?: string;
  status?: number;
}

const handleServiceError = (operation: string, error: unknown): never => {
  console.error(`Failed to ${operation}:`, error);
  const serviceError = new Error(`Failed to ${operation}`) as ServiceError;
  serviceError.code = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
  serviceError.status = 500;
  throw serviceError;
};

export const MongoDBService = {
  async initialize() {
    try {
      await connectToDatabase();
      console.log('MongoDB service initialized successfully');
    } catch (error) {
      handleServiceError('initialize MongoDB service', error);
    }
  },
  async getTransactions(userId?: string) {
    try {
      await connectToDatabase();
      const query = userId ? { user_id: userId } : {};
      const transactions = await Transaction.find(query)
        .sort({ created_at: -1 })
        .lean()
        .exec();
      return transactions as TransactionType[];
    } catch (error) {
      return handleServiceError('fetch transactions', error);
    }
  },

  async createTransaction(transactionData: Partial<TransactionType>) {
    try {
      await connectToDatabase();
      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();
      return savedTransaction.toObject() as TransactionType;
    } catch (error) {
      return handleServiceError('create transaction', error);
    }
  },

  async getGroups(userId?: string) {
    try {
      await connectToDatabase();
      const query = userId ? { 'members.id': userId } : {};
      const groups = await GroupModel.find(query)
        .sort({ created_at: -1 })
        .lean()
        .exec();
      return groups as Group[];
    } catch (error) {
      return handleServiceError('fetch groups', error);
    }
  },

  async createGroup(groupData: Partial<Group>) {
    try {
      await connectToDatabase();
      const group = new GroupModel(groupData);
      const savedGroup = await group.save();
      return savedGroup.toObject() as Group;
    } catch (error) {
      return handleServiceError('create group', error);
    }
  },

  async updateGroup(groupId: string, updateData: Partial<Group>) {
    try {
      await connectToDatabase();
      const updatedGroup = await GroupModel.findOneAndUpdate(
        { id: groupId },
        { $set: updateData },
        { new: true, runValidators: true, lean: true }
      );
      if (!updatedGroup) {
        const error = new Error('Group not found') as ServiceError;
        error.status = 404;
        throw error;
      }
      return updatedGroup as Group;
    } catch (error) {
      return handleServiceError('update group', error);
    }
  },

  async getUser(userId: string) {
    try {
      await connectToDatabase();
      const user = await User.findOne({ id: userId }).lean().exec();
      if (!user) {
        const error = new Error('User not found') as ServiceError;
        error.status = 404;
        throw error;
      }
      return user as UserType;
    } catch (error) {
      return handleServiceError('fetch user', error);
    }
  },

  async updateUser(userId: string, updateData: Partial<UserType>) {
    try {
      await connectToDatabase();
      const updatedUser = await User.findOneAndUpdate(
        { id: userId },
        { $set: updateData },
        { new: true, runValidators: true, lean: true }
      );
      if (!updatedUser) {
        const error = new Error('User not found') as ServiceError;
        error.status = 404;
        throw error;
      }
      return updatedUser as UserType;
    } catch (error) {
      return handleServiceError('update user', error);
    }
  }
};