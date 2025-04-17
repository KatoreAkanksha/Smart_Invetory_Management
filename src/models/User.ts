import mongoose, { Model } from 'mongoose';
import { 
  User as IUser, 
  UserRole, 
  UserSettings, 
  NotificationPreferences,
  DEFAULT_USER_SETTINGS,
  isValidEmail,
  isValidPassword
} from '@/types/user';

// Define the model type
type UserModel = Model<IUser> & {
  createUserWithDefaults: (email: string, displayName: string, password: string) => Promise<IUser>;
  findByEmail: (email: string) => Promise<IUser | null>;
  createSafeUser: (user: IUser) => Omit<IUser, 'password'>;
};

// Create notification preferences schema
const notificationPreferencesSchema = new mongoose.Schema<NotificationPreferences>({
  email: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  budgetAlerts: { type: Boolean, default: true },
  expenseReminders: { type: Boolean, default: true },
  groupUpdates: { type: Boolean, default: true }
}, { _id: false });

// Create settings schema
const userSettingsSchema = new mongoose.Schema<UserSettings>({
  language: { type: String, default: 'en' },
  currency: { type: String, default: 'USD' },
  theme: { 
    type: String, 
    enum: ['light', 'dark', 'system'], 
    default: 'system' 
  },
  notifications: { 
    type: notificationPreferencesSchema, 
    default: () => DEFAULT_USER_SETTINGS.notifications 
  }
}, { _id: false });

// Create the user schema
const userSchema = new mongoose.Schema<IUser, UserModel>({
  id: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: (email: string) => isValidEmail(email),
      message: 'Invalid email format'
    }
  },
  password: { 
    type: String, 
    required: true,
    validate: {
      validator: (password: string) => isValidPassword(password),
      message: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
    }
  },
  displayName: { type: String, required: true },
  avatar: String,
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.USER,
    required: true 
  },
  settings: { 
    type: userSettingsSchema, 
    default: () => DEFAULT_USER_SETTINGS 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Add static methods
userSchema.statics.createUserWithDefaults = async function(email: string, displayName: string, password: string) {
  const id = new mongoose.Types.ObjectId().toString();
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
  
  return this.create({
    id,
    email,
    password, // Note: In a real app, this should be hashed
    displayName,
    avatar,
    role: UserRole.USER,
    settings: DEFAULT_USER_SETTINGS,
    isVerified: false
  });
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

userSchema.statics.createSafeUser = function(user: IUser) {
  const { password, ...safeUser } = user.toObject();
  return safeUser;
};

// Create or retrieve the model
export const User = (mongoose.models?.User as UserModel) || 
  mongoose.model<IUser, UserModel>('User', userSchema);

