import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top players')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of leaderboard to view')
        .setRequired(true)
        .addChoices(
          { name: '💰 Richest', value: 'coins' },
          { name: '🍎 Most Fruits Picked', value: 'picked' },
          { name: '💎 Most Gems', value: 'gems' },
          { name: '⭐ Highest Level', value: 'level' }
        )
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const type = interaction.options.getString('type', true);
      const valueField = type === 'picked' ? 'stats.totalPicked' : type;
      
      // Get all users and sort by the selected field
      const users = await UserModel.find().sort({ [valueField]: -1 }).limit(10);
      
      if (users.length === 0) {
        await interaction.reply({
          content: 'No players found!',
          ephemeral: true,
        });
        return;
      }

      // Get user's rank
      const userRank = await UserModel.countDocuments({
        [valueField]: { $gt: users[users.length - 1][valueField] }
      }) + 1;

      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle(`🏆 ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard`)
        .setDescription(`Top players sorted by ${type}`)
        .setTimestamp();

      // Add top 10 players
      users.forEach((user, index) => {
        const value = valueField.includes('.') 
          ? valueField.split('.').reduce((obj, key) => obj[key], user)
          : user[valueField];

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        embed.addFields({
          name: `${medal} ${user.username}`,
          value: `${value.toLocaleString()} ${type === 'coins' ? 'coins' : type === 'picked' ? 'fruits picked' : type === 'gems' ? 'gems' : 'level'}`,
          inline: false,
        });
      });

      // Add user's rank if they're not in top 10
      if (userRank > 10) {
        const user = await UserModel.findOne({ userId: interaction.user.id });
        if (user) {
          const value = valueField.includes('.')
            ? valueField.split('.').reduce((obj, key) => obj[key], user)
            : user[valueField];

          embed.addFields({
            name: '...',
            value: `...`,
            inline: false,
          });

          embed.addFields({
            name: `#${userRank} ${user.username} (You)`,
            value: `${value.toLocaleString()} ${type === 'coins' ? 'coins' : type === 'picked' ? 'fruits picked' : type === 'gems' ? 'gems' : 'level'}`,
            inline: false,
          });
        }
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in leaderboard command:', error);
      await interaction.reply({
        content: 'There was an error while fetching the leaderboard!',
        ephemeral: true,
      });
    }
  },
}; 