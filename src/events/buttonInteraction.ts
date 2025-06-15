import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger';
import { UserModel } from '../models/User';
import { join } from 'path';

const FRUIT_BANK_IMAGE = join(__dirname, '..', 'images', 'fruitbank.jpg');

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  try {
    const { customId } = interaction;
    const userId = interaction.user.id;

    // Get or create user
    let user = await UserModel.findOne({ userId });
    if (!user) {
      user = await UserModel.create({
        userId,
        username: interaction.user.username,
        balance: 0,
        inventory: [],
        lastPick: new Date(0),
        level: 1,
        xp: 0
      });
    }

    switch (customId) {
      case 'pick_fruits':
        // Handle pick fruits button
        await interaction.reply({
          content: 'Use `/pick` command to pick fruits!',
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      case 'inventory':
        // Handle inventory button
        const inventoryEmbed = new EmbedBuilder()
          .setTitle('🎒 Your Inventory')
          .setDescription(user.inventory.length > 0 
            ? user.inventory.map(item => `${item.emoji} ${item.name} (${item.quantity})`).join('\n')
            : 'Your inventory is empty!')
          .setColor('#FFD700');

        await interaction.reply({
          embeds: [inventoryEmbed],
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      case 'sell':
        // Handle sell button
        await interaction.reply({
          content: 'Use `/sell` command to sell your fruits!',
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      case 'shop':
        // Handle shop button
        await interaction.reply({
          content: 'Use `/shop` command to view the shop!',
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      case 'quests':
        // Handle quests button
        await interaction.reply({
          content: 'Use `/quests` command to view your quests!',
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      case 'profile':
        // Handle profile button
        const profileEmbed = new EmbedBuilder()
          .setTitle('👤 Your Profile')
          .addFields(
            { name: 'Level', value: user.level.toString(), inline: true },
            { name: 'XP', value: user.xp.toString(), inline: true },
            { name: 'Balance', value: `${user.balance} coins`, inline: true }
          )
          .setColor('#FFD700');

        await interaction.reply({
          embeds: [profileEmbed],
          files: [FRUIT_BANK_IMAGE]
        });
        break;

      default:
        await interaction.reply({
          content: 'Unknown button interaction!',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error handling button interaction:', error);
    await interaction.reply({
      content: 'There was an error processing your request!',
      ephemeral: true
    });
  }
} 