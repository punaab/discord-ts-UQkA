import mongoose, { Document, Schema } from 'mongoose';

export interface IQuest extends Document {
  userId: string;
  type: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  reward: {
    coins: number;
    gems: number;
    xp: number;
  };
  completed: boolean;
  claimed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const questSchema = new Schema<IQuest>({
  userId: { type: String, required: true },
  type: { type: String, required: true }, // 'daily' or 'weekly'
  name: { type: String, required: true },
  description: { type: String, required: true },
  target: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  reward: {
    coins: { type: Number, default: 0 },
    gems: { type: Number, default: 0 },
    xp: { type: Number, default: 0 }
  },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const QuestModel = mongoose.model<IQuest>('Quest', questSchema); 