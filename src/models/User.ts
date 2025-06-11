import mongoose from 'mongoose';

const questSchema = new mongoose.Schema({
  type: { type: String, required: true },
  target: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  requiredRarity: { type: String },
  requiredTypes: [String],
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fruit' }],
  coins: { type: Number, default: 0 },
  gems: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastPick: { type: Date },
  lastDaily: { type: Date },
  lastSteal: { type: Date },
  roles: [String],
  upgrades: {
    basketCapacity: { type: Number, default: 1 },
    toolQuality: { type: Number, default: 1 },
    fruitScanner: { type: Number, default: 0 },
    autoPicker: { type: Number, default: 0 },
  },
  stats: {
    totalPicked: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    rareFruitsFound: { type: Number, default: 0 },
  },
  quests: {
    daily: questSchema,
    weekly: questSchema,
    lastDaily: { type: Date },
    lastWeekly: { type: Date },
  },
  achievements: [
    {
      achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      claimed: { type: Boolean, default: false },
    }
  ],
});

export const UserModel = mongoose.model('User', userSchema); 