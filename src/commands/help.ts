import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands and their descriptions'),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🍎 Fruit Picker Bot Commands')
        .setDescription('Here are all the available commands:')
        .addFields(
          { 
            name: '🎮 Core Commands',
            value: 
              '`/pick` - Pick fruits from the orchard\n' +
              '`/inventory` - View your fruit inventory\n' +
              '`/sell` - Sell your fruits for coins\n' +
              '`/daily` - Claim your daily reward\n' +
              '`/profile` - View your profile and stats'
          },
          {
            name: '💰 Economy Commands',
            value:
              '`/shop` - View and buy upgrades\n' +
              '`/balance` - Check your coins and gems\n' +
              '`/leaderboard` - View top players'
          },
          {
            name: '📊 Quest Commands',
            value:
              '`/quests` - View your active quests\n' +
              '`/achievements` - View your achievements'
          },
          {
            name: '⚙️ Utility Commands',
            value:
              '`/help` - Show this help message\n' +
              '`/ping` - Check bot latency'
          }
        )
        .setFooter({ text: 'Use / before each command to execute it' });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in help command:', error);
      await interaction.reply({
        content: 'There was an error while fetching the help information!',
        ephemeral: true,
      });
    }
  },
}; 