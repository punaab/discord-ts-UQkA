import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { FruitModel } from '../models/Fruit';
import { logger } from '../utils/logger';
import moment from 'moment';

// Market price multipliers that change every 6 hours
const MARKET_MULTIPLIERS = {
  common: { min: 0.8, max: 1.2 },
  uncommon: { min: 0.7, max: 1.3 },
  rare: { min: 0.6, max: 1.4 },
  legendary: { min: 0.5, max: 1.5 },
  mythic: { min: 0.4, max: 1.6 },
};

// Base prices for each rarity
const BASE_PRICES = {
  common: 10,
  uncommon: 20,
  rare: 50,
  legendary: 100,
  mythic: 200,
};

// Calculate current market prices
function calculateMarketPrices() {
  const prices: Record<string, number> = {};
  Object.entries(MARKET_MULTIPLIERS).forEach(([rarity, { min, max }]) => {
    const multiplier = min + Math.random() * (max - min);
    prices[rarity] = Math.floor(BASE_PRICES[rarity as keyof typeof BASE_PRICES] * multiplier);
  });
  return prices;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Check current fruit market prices and trends'),

  execute: async (interaction: CommandInteraction) => {
    try {
      const user = await UserModel.findOne({ userId: interaction.user.id });
      if (!user) {
        await interaction.reply({
          content: "You haven't started picking fruits yet! Use `/pick` to get started.",
          ephemeral: true,
        });
        return;
      }

      // Calculate current market prices
      const currentPrices = calculateMarketPrices();

      // Get market trends (last 24 hours of sales)
      const lastDay = moment().subtract(24, 'hours').toDate();
      const recentSales = await FruitModel.find({
        sold: true,
        soldAt: { $gte: lastDay },
      }).sort({ soldAt: -1 });

      // Calculate average prices for each rarity
      const averagePrices: Record<string, number> = {};
      const salesCount: Record<string, number> = {};
      
      recentSales.forEach(sale => {
        if (!averagePrices[sale.rarity]) {
          averagePrices[sale.rarity] = 0;
          salesCount[sale.rarity] = 0;
        }
        averagePrices[sale.rarity] += sale.soldFor || 0;
        salesCount[sale.rarity] += 1;
      });

      Object.keys(averagePrices).forEach(rarity => {
        averagePrices[rarity] = Math.floor(averagePrices[rarity] / salesCount[rarity]);
      });

      // Create market embed
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('📊 Fruit Market')
        .setDescription(`Current market prices and trends\nLast updated: ${moment().format('HH:mm:ss')}`);

      // Add price fields for each rarity
      Object.entries(currentPrices).forEach(([rarity, price]) => {
        const rarityEmoji = {
          common: '🍎',
          uncommon: '🍇',
          rare: '🥝',
          legendary: '🌟',
          mythic: '🌙',
        }[rarity];

        const avgPrice = averagePrices[rarity] || BASE_PRICES[rarity as keyof typeof BASE_PRICES];
        const trend = price > avgPrice ? '📈' : price < avgPrice ? '📉' : '➡️';
        const priceDiff = Math.abs(price - avgPrice);
        const trendText = price > avgPrice 
          ? `+${priceDiff} coins above average`
          : price < avgPrice 
            ? `${priceDiff} coins below average`
            : 'at average price';

        embed.addFields({
          name: `${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
          value: `Current: ${price} coins\nAverage: ${avgPrice} coins\nTrend: ${trend} ${trendText}`,
          inline: true,
        });
      });

      // Add market tips
      const tips = [
        '💡 Prices change every 6 hours',
        '💡 Higher rarity fruits have more price volatility',
        '💡 Watch for market trends to maximize profits',
      ];

      embed.addFields({
        name: '📝 Market Tips',
        value: tips.join('\n'),
      });

      // Add role-specific information
      if (user.roles.includes('Market Mogul')) {
        embed.addFields({
          name: '👑 Market Mogul Perk',
          value: 'You get a 15% bonus when selling fruits!',
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in market command:', error);
      await interaction.reply({
        content: 'There was an error while checking the market!',
        ephemeral: true,
      });
    }
  },
}; 