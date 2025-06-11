import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  requirements: {
    target: { type: Number, required: true },
    stat: { type: String, required: true }, // e.g., 'totalPicked', 'totalSold', etc.
  },
  rewards: {
    coins: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
  },
  icon: { type: String },
  rarity: { type: String, default: 'common' },
  createdAt: { type: Date, default: Date.now },
});

const userAchievementSchema = new mongoose.Schema({
  achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
});

export const AchievementModel = mongoose.model('Achievement', achievementSchema);
export const UserAchievementModel = mongoose.model('UserAchievement', userAchievementSchema); 