import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { FruitModel } from '../models/Fruit';
import { QuestModel } from '../models/Quest';
import { logger } from '../utils/logger';
import { join } from 'path';

const FRUITS = [
  { name: '🍎 Apple', rarity: 'common', baseValue: 10 },
  { name: '🍌 Banana', rarity: 'common', baseValue: 8 },
  { name: '🍊 Orange', rarity: 'common', baseValue: 12 },
  { name: '🍇 Grape', rarity: 'uncommon', baseValue: 15 },
  { name: '🍓 Strawberry', rarity: 'uncommon', baseValue: 18 },
  { name: '🥝 Kiwi', rarity: 'rare', baseValue: 25 },
  { name: '🍍 Pineapple', rarity: 'rare', baseValue: 30 },
  { name: '🌟 Golden Apple', rarity: 'legendary', baseValue: 100 },
  { name: '🌙 Moon Berry', rarity: 'mythic', baseValue: 200 },
];

const RARITY_WEIGHTS = {
  common: 0.6,
  uncommon: 0.3,
  rare: 0.07,
  legendary: 0.025,
  mythic: 0.005,
};

const FRUIT_BANK_IMAGE = join(__dirname, '..', 'images', 'fruitbank.jpg');

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('pick')
    .setDescription('Pick some fruits from the orchard!'),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      // Get or create user
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
            totalValue: 0,
            highestValue: 0,
          },
        });
      }

      // Check cooldown with upgrade reduction
      const now = new Date();
      const baseCooldown = 5 * 60 * 1000; // 5 minutes
      const toolQualityBonus = user.upgrades.toolQuality * 0.1; // 10% reduction per level
      const cooldown = Math.max(baseCooldown * (1 - toolQualityBonus), 60 * 1000); // Minimum 1 minute

      if (user.lastPick && now.getTime() - user.lastPick.getTime() < cooldown) {
        const timeLeft = Math.ceil((cooldown - (now.getTime() - user.lastPick.getTime())) / 1000);
        await interaction.reply({
          content: `⏰ You need to wait ${timeLeft} seconds before picking again!`,
          ephemeral: true,
        });
        return;
      }

      // Calculate number of fruits to pick based on level and upgrades
      const basePickCount = 1;
      const levelBonus = Math.floor(user.level / 5); // +1 fruit every 5 levels
      const basketBonus = user.upgrades.basketCapacity * 2; // +2 fruits per basket upgrade
      const totalPickCount = basePickCount + levelBonus + basketBonus;

      // Pick fruits with scanner upgrade bonus
      const pickedFruits = [];
      const scannerBonus = user.upgrades.fruitScanner * 0.05; // 5% better odds per level

      for (let i = 0; i < totalPickCount; i++) {
        const random = Math.random();
        let fruit;
        let adjustedWeights = { ...RARITY_WEIGHTS };
        
        // Apply scanner bonus to higher rarities
        if (scannerBonus > 0) {
          adjustedWeights.mythic += scannerBonus * 0.5;
          adjustedWeights.legendary += scannerBonus * 0.3;
          adjustedWeights.rare += scannerBonus * 0.2;
          // Reduce common weight to compensate
          adjustedWeights.common -= scannerBonus;
        }

        // Determine fruit rarity based on adjusted weights
        let cumulativeWeight = 0;
        for (const [rarity, weight] of Object.entries(adjustedWeights)) {
          cumulativeWeight += weight;
          if (random < cumulativeWeight) {
            fruit = FRUITS.find(f => f.rarity === rarity);
            break;
          }
        }

        if (fruit) {
          // Scale fruit value with level and tool quality
          const levelMultiplier = 1 + (user.level * 0.05); // 5% more value per level
          const toolMultiplier = 1 + (user.upgrades.toolQuality * 0.1); // 10% more value per tool upgrade
          const finalValue = Math.floor(fruit.baseValue * levelMultiplier * toolMultiplier);

          pickedFruits.push({ ...fruit, value: finalValue });
          await FruitModel.create({
            userId: interaction.user.id,
            name: fruit.name,
            rarity: fruit.rarity,
            value: finalValue,
          });
        }
      }

      // Update user stats and XP
      user.lastPick = now;
      const xpGained = pickedFruits.reduce((total, fruit) => {
        const rarityMultiplier = {
          common: 1,
          uncommon: 1.5,
          rare: 2,
          legendary: 3,
          mythic: 5,
        }[fruit.rarity];
        return total + (10 * rarityMultiplier);
      }, 0);

      user.xp += xpGained;
      user.stats.totalPicked += pickedFruits.length;
      
      // Level up check with improved formula
      const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
      const levelUp = newLevel > user.level;
      if (levelUp) {
        user.level = newLevel;
      }

      // Update quest progress
      const activeQuests = await QuestModel.find({
        userId: interaction.user.id,
        completed: false,
        expiresAt: { $gt: new Date() }
      });

      const questUpdates = activeQuests.map(quest => {
        if (quest.name.includes('Pick') || quest.name.includes('Collect')) {
          quest.progress += pickedFruits.length;
          if (quest.progress >= quest.target) {
            quest.completed = true;
          }
          return quest.save();
        }
        return Promise.resolve();
      });

      await Promise.all([user.save(), ...questUpdates]);

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🍎 Fruit Picking Results')
        .setDescription(`You picked ${pickedFruits.length} fruits!`)
        .addFields(
          { name: 'Fruits Picked', value: pickedFruits.map(f => `${f.name} (${f.value} coins)`).join('\n') },
          { name: 'XP Gained', value: `${xpGained} XP` },
          { name: 'Current Level', value: `Level ${user.level}` }
        );

      // Add quest progress to embed
      const completedQuests = activeQuests.filter(q => q.completed && !q.claimed);
      if (completedQuests.length > 0) {
        embed.addFields({
          name: '🎯 Completed Quests',
          value: completedQuests.map(q => `**${q.name}** - ${q.reward.coins} coins, ${q.reward.gems} gems, ${q.reward.xp} XP`).join('\n')
        });
      }

      if (levelUp) {
        embed.addFields({
          name: '🎉 Level Up!',
          value: `You've reached level ${user.level}!`,
        });
      }

      embed.setFooter({ 
        text: `Next pick available in ${Math.ceil(cooldown / 1000 / 60)} minutes` 
      });

      await interaction.reply({
        embeds: [embed],
        files: [FRUIT_BANK_IMAGE]
      });
    } catch (error) {
      logger.error('Error in pick command:', error);
      await interaction.reply({
        content: 'There was an error while picking fruits!',
        ephemeral: true,
      });
    }
  },
}; 