import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { FruitModel } from '../models/Fruit';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your fruit inventory'),

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

      const fruits = await FruitModel.find({
        userId: interaction.user.id,
        sold: false,
      }).sort({ rarity: 1, value: -1 });

      if (fruits.length === 0) {
        await interaction.reply({
          content: "Your inventory is empty! Use `/pick` to collect some fruits.",
          ephemeral: true,
        });
        return;
      }

      // Group fruits by rarity
      const groupedFruits = fruits.reduce((acc, fruit) => {
        if (!acc[fruit.rarity]) {
          acc[fruit.rarity] = [];
        }
        acc[fruit.rarity].push(fruit);
        return acc;
      }, {} as Record<string, typeof fruits>);

      // Create rarity sections
      const raritySections = Object.entries(groupedFruits).map(([rarity, fruits]) => {
        const rarityEmoji = {
          common: '🍎',
          uncommon: '🍇',
          rare: '🥝',
          legendary: '🌟',
          mythic: '🌙',
        }[rarity];

        const fruitList = fruits
          .map(f => `${f.name} (${f.value} coins)`)
          .join('\n');

        return {
          name: `${rarityEmoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`,
          value: fruitList || 'None',
          inline: true,
        };
      });

      // Calculate total value
      const totalValue = fruits.reduce((sum, fruit) => sum + fruit.value, 0);

      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle(`${interaction.user.username}'s Fruit Inventory`)
        .setDescription(`Total Fruits: ${fruits.length}\nTotal Value: ${totalValue} coins`)
        .addFields(raritySections)
        .setFooter({ text: `Use /sell to sell your fruits!` });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in inventory command:', error);
      await interaction.reply({
        content: 'There was an error while fetching your inventory!',
        ephemeral: true,
      });
    }
  },
}; 