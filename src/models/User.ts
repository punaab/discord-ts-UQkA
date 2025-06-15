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

export interface IUser extends Document {
  userId: string;
  username: string;
  balance: number;
  inventory: InventoryItem[];
  lastPick: Date;
  level: number;
  xp: number;
  upgrades: Upgrades;
  stats: Stats;
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  balance: { type: Number, default: 0 },
  inventory: [{
    emoji: String,
    name: String,
    quantity: Number
  }],
  lastPick: { type: Date, default: new Date(0) },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
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
  }
});

export const UserModel = mongoose.model<IUser>('User', userSchema); 