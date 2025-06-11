import mongoose from 'mongoose';
import { IFruit } from '../types/Fruit';

const fruitSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  name: { type: String, required: true },
  rarity: { 
    type: String, 
    required: true,
    enum: ['common', 'uncommon', 'rare', 'legendary', 'mythic']
  },
  value: { 
    type: Number, 
    required: true,
    min: [0, 'Value cannot be negative']
  },
  pickedAt: { type: Date, default: Date.now },
  sold: { type: Boolean, default: false },
  soldAt: { type: Date },
  soldFor: { 
    type: Number,
    min: [0, 'Sale value cannot be negative']
  },
}, {
  timestamps: true
});

fruitSchema.index({ userId: 1, sold: 1 });

export const FruitModel = mongoose.model<IFruit>('Fruit', fruitSchema); 