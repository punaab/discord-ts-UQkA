import { Document } from 'mongoose';

export interface IFruit extends Document {
  userId: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  value: number;
  pickedAt: Date;
  sold: boolean;
  soldAt?: Date;
  soldFor?: number;
  createdAt: Date;
  updatedAt: Date;
} 