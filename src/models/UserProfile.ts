import { Schema, model } from 'mongoose';

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  userType: string;
  avatar: string;
  creditScore: number;
  preferences: {
    language: string;
    currency: string;
    theme: string;
  };
  created_at: Date;
}

const userProfileSchema = new Schema<IUserProfile>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userType: { type: String, required: true },
  avatar: { type: String, required: true },
  creditScore: { type: Number, required: true },
  preferences: {
    language: { type: String, required: true },
    currency: { type: String, required: true },
    theme: { type: String, required: true }
  },
  created_at: { type: Date, required: true }
});

export const UserProfile = model<IUserProfile>('UserProfile', userProfileSchema);