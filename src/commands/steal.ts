import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { FruitModel } from '../models/Fruit';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('steal')
    .setDescription('Try to steal fruits from another user')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user to steal from')
        .setRequired(true)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const targetUser = interaction.options.getUser('target', true);
      
      // Prevent self-stealing
      if (targetUser.id === interaction.user.id) {
        await interaction.reply({
          content: "You can't steal from yourself!",
          ephemeral: true,
        });
        return;
      }

      // Get both users
      const [user, target] = await Promise.all([
        UserModel.findOne({ userId: interaction.user.id }),
        UserModel.findOne({ userId: targetUser.id }),
      ]);

      if (!user || !target) {
        await interaction.reply({
          content: "One of the users hasn't started picking fruits yet!",
          ephemeral: true,
        });
        return;
      }

      // Check cooldown
      const now = new Date();
      const cooldown = 30 * 60 * 1000; // 30 minutes
      if (user.lastSteal && now.getTime() - user.lastSteal.getTime() < cooldown) {
        const timeLeft = Math.ceil((cooldown - (now.getTime() - user.lastSteal.getTime())) / 1000);
        await interaction.reply({
          content: `⏰ You need to wait ${timeLeft} seconds before trying to steal again!`,
          ephemeral: true,
        });
        return;
      }

      // Get target's fruits
      const targetFruits = await FruitModel.find({
        userId: targetUser.id,
        sold: false,
      });

      if (targetFruits.length === 0) {
        await interaction.reply({
          content: `${targetUser.username} has no fruits to steal!`,
          ephemeral: true,
        });
        return;
      }

      // Calculate success chance based on level difference
      const levelDiff = user.level - target.level;
      const baseChance = 0.3; // 30% base chance
      const levelBonus = levelDiff * 0.05; // 5% per level difference
      const successChance = Math.min(Math.max(baseChance + levelBonus, 0.1), 0.8); // Between 10% and 80%

      // Attempt steal
      const success = Math.random() < successChance;
      const embed = new EmbedBuilder()
        .setColor(success ? '#FF6B6B' : '#4CAF50')
        .setTitle(success ? '🎯 Successful Steal!' : '🛡️ Steal Failed!');

      if (success) {
        // Select random fruit to steal
        const stolenFruit = targetFruits[Math.floor(Math.random() * targetFruits.length)];
        
        // Transfer fruit to stealer
        stolenFruit.userId = interaction.user.id;
        await stolenFruit.save();

        // Update stats
        user.lastSteal = now;
        user.stats.totalPicked += 1;
        target.stats.totalPicked -= 1;
        await Promise.all([user.save(), target.save()]);

        embed.setDescription(`You successfully stole a ${stolenFruit.name} from ${targetUser.username}!`)
          .addFields(
            { name: 'Stolen Fruit', value: `${stolenFruit.name} (${stolenFruit.value} coins)`, inline: true },
            { name: 'Success Chance', value: `${Math.round(successChance * 100)}%`, inline: true }
          );
      } else {
        // Update cooldown even on failure
        user.lastSteal = now;
        await user.save();

        embed.setDescription(`You failed to steal from ${targetUser.username}!`)
          .addFields(
            { name: 'Success Chance', value: `${Math.round(successChance * 100)}%`, inline: true },
            { name: 'Cooldown', value: '30 minutes', inline: true }
          );
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in steal command:', error);
      await interaction.reply({
        content: 'There was an error while attempting to steal!',
        ephemeral: true,
      });
    }
  },
}; 