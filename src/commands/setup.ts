import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types/Command';
import { logger } from '../utils/logger';
import { GuildModel } from '../models/Guild';
import { join } from 'path';

const FRUIT_BANK_IMAGE = join(__dirname, '..', 'images', 'fruitbank.jpg');

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the bot channel for fruit picking')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel where the bot will operate')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const channel = interaction.options.getChannel('channel', true) as TextChannel;
      
      // Check if user has permission to manage channels
      if (!interaction.memberPermissions?.has('ManageChannels')) {
        await interaction.reply({
          content: 'You need the "Manage Channels" permission to use this command!',
          ephemeral: true
        });
        return;
      }

      // Update or create guild settings
      await GuildModel.findOneAndUpdate(
        { guildId: interaction.guildId },
        { 
          guildId: interaction.guildId,
          channelId: channel.id,
          name: interaction.guild?.name
        },
        { upsert: true }
      );

      // Create button rows
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pick_fruits')
            .setLabel('Pick Fruits')
            .setEmoji('🍎')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('Inventory')
            .setEmoji('🎒')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('sell')
            .setLabel('Sell')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Secondary)
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('shop')
            .setLabel('Shop')
            .setEmoji('🛍️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('quests')
            .setLabel('Quests')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('profile')
            .setLabel('Profile')
            .setEmoji('👤')
            .setStyle(ButtonStyle.Secondary)
        );

      // Send confirmation with fruit bank image
      await interaction.reply({
        content: `✅ Bot channel has been set to ${channel}!`,
        files: [FRUIT_BANK_IMAGE]
      });

      // Send initial message with emoji buttons
      const message = await channel.send({
        content: '🍎 **Fruit Picker Bot** 🍎\nUse the buttons below to play!',
        files: [FRUIT_BANK_IMAGE],
        components: [row1, row2]
      });

    } catch (error) {
      logger.error('Error in setup command:', error);
      await interaction.reply({
        content: 'There was an error while setting up the bot channel!',
        ephemeral: true
      });
    }
  },
}; 