import mongoose, { Document, Schema } from 'mongoose';

interface InventoryItem {
  emoji: string;
  name: string;
  quantity: number;
}

interface Upgrades {
  basketCapacity: number;
  toolQuality: number;
  fruitScanner: number;
  autoPicker: number;
}

interface Stats {
  totalPicked: number;
  totalSold: number;
  totalEarned: number;
  rareFruitsFound: number;
}

interface Achievement {
  achievementId: mongoose.Types.ObjectId;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface Quest {
  type: string;
  target: number;
  progress: number;
  requiredRarity?: string;
  requiredTypes?: string[];
}

interface Quests {
  daily: Quest;
  weekly: Quest;
  lastDaily: Date;
  lastWeekly: Date;
}

export interface IUser extends Document {
  userId: string;
  username: string;
  balance: number;
  coins: number;
  gems: number;
  inventory: InventoryItem[];
  lastPick: Date;
  lastDaily: Date;
  lastSteal: Date;
  level: number;
  xp: number;
  dailyStreak: number;
  roles: string[];
  upgrades: Upgrades;
  stats: Stats;
  achievements: Achievement[];
  quests: Quests;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  balance: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  gems: { type: Number, default: 0 },
  inventory: [{
    emoji: String,
    name: String,
    quantity: Number
  }],
  lastPick: { type: Date, default: new Date(0) },
  lastDaily: { type: Date, default: new Date(0) },
  lastSteal: { type: Date, default: new Date(0) },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  roles: [String],
  upgrades: {
    basketCapacity: { type: Number, default: 1 },
    toolQuality: { type: Number, default: 1 },
    fruitScanner: { type: Number, default: 0 },
    autoPicker: { type: Number, default: 0 }
  },
  stats: {
    totalPicked: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    rareFruitsFound: { type: Number, default: 0 }
  },
  achievements: [{
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    claimed: { type: Boolean, default: false }
  }],
  quests: {
    daily: {
      type: { type: String },
      target: { type: Number },
      progress: { type: Number, default: 0 },
      requiredRarity: { type: String },
      requiredTypes: [String]
    },
    weekly: {
      type: { type: String },
      target: { type: Number },
      progress: { type: Number, default: 0 },
      requiredRarity: { type: String },
      requiredTypes: [String]
    },
    lastDaily: { type: Date },
    lastWeekly: { type: Date }
  }
});

export const UserModel = mongoose.model<IUser>('User', userSchema); 