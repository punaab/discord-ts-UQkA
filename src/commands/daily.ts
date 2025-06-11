import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const BASE_DAILY_AMOUNT = 50; // Base amount of coins
const LEVEL_BONUS = 10; // +10 coins per level
const STREAK_BONUS = 5; // +5 coins per day in streak
const MAX_STREAK = 7; // Maximum streak bonus

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins reward!'),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      let user = await UserModel.findOne({ userId: interaction.user.id });
      if (!user) {
        user = await UserModel.create({
          userId: interaction.user.id,
          username: interaction.user.username,
          inventory: [],
          coins: 0,
          gems: 0,
          xp: 0,
          level: 1,
          upgrades: {
            basketCapacity: 0,
            toolQuality: 0,
            fruitScanner: 0,
            autoPicker: 0,
          },
          stats: {
            totalPicked: 0,
            totalSold: 0,
            totalEarned: 0,
            rareFruitsFound: 0,
          },
          dailyStreak: 0,
          lastDaily: null,
        });
      }

      const now = new Date();
      if (user.lastDaily && now.getTime() - user.lastDaily.getTime() < DAILY_COOLDOWN) {
        const timeLeft = Math.ceil((DAILY_COOLDOWN - (now.getTime() - user.lastDaily.getTime())) / 1000);
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        
        await interaction.reply({
          content: `⏰ You need to wait ${hours}h ${minutes}m before claiming your daily reward again!`,
          ephemeral: true,
        });
        return;
      }

      // Check if streak should be reset (more than 48 hours since last claim)
      if (user.lastDaily && now.getTime() - user.lastDaily.getTime() > DAILY_COOLDOWN * 2) {
        user.dailyStreak = 0;
      }

      // Calculate rewards
      const levelBonus = Math.floor(user.level * LEVEL_BONUS);
      const streakBonus = Math.min(user.dailyStreak * STREAK_BONUS, MAX_STREAK * STREAK_BONUS);
      const rewardAmount = BASE_DAILY_AMOUNT + levelBonus + streakBonus;

      // Update user
      user.coins += rewardAmount;
      user.lastDaily = now;
      user.dailyStreak = (user.dailyStreak || 0) + 1;
      user.stats.totalEarned += rewardAmount;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💰 Daily Reward Claimed!')
        .setDescription(`You received ${rewardAmount} coins!`)
        .addFields(
          { name: 'Base Amount', value: `${BASE_DAILY_AMOUNT} coins` },
          { name: 'Level Bonus', value: `+${levelBonus} coins` },
          { name: 'Streak Bonus', value: `+${streakBonus} coins (${user.dailyStreak} day streak)` },
          { name: 'Total Balance', value: `${user.coins} coins` }
        )
        .setFooter({ 
          text: `Come back tomorrow to keep your streak! Current streak: ${user.dailyStreak} days` 
        });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in daily command:', error);
      await interaction.reply({
        content: 'There was an error while claiming your daily reward!',
        ephemeral: true,
      });
    }
  },
}; 