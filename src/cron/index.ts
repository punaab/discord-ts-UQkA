import { Client } from 'discord.js';
import cron from 'node-cron';
import { logger } from '../utils/logger';

export function setupCronJobs(client: Client) {
  // Daily reset at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    try {
      // Reset daily quests
      // Reset daily cooldowns
      // Process daily rewards
      logger.info('Daily reset completed');
    } catch (error) {
      logger.error('Error during daily reset:', error);
    }
  });

  // Market price updates every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      // Update market prices
      // Trigger market events
      logger.info('Market prices updated');
    } catch (error) {
      logger.error('Error updating market prices:', error);
    }
  });

  // Random fruit storm events (every 4 hours, 30% chance)
  cron.schedule('0 */4 * * *', async () => {
    try {
      if (Math.random() < 0.3) {
        // Trigger fruit storm event
        logger.info('Fruit storm event triggered');
      }
    } catch (error) {
      logger.error('Error during fruit storm check:', error);
    }
  });
} 