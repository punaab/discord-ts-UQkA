import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
} 