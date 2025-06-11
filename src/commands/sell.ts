import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { FruitModel } from '../models/Fruit';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell your fruits')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Type of fruits to sell')
        .setRequired(true)
        .addChoices(
          { name: '🍎 Common', value: 'common' },
          { name: '🍇 Uncommon', value: 'uncommon' },
          { name: '🥝 Rare', value: 'rare' },
          { name: '🌟 Legendary', value: 'legendary' },
          { name: '🌙 Mythic', value: 'mythic' },
          { name: 'All', value: 'all' }
        )
    ),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const type = interaction.options.getString('type', true);
      const user = await UserModel.findOne({ userId: interaction.user.id });

      if (!user) {
        await interaction.reply({
          content: "You haven't started picking fruits yet! Use `/pick` to get started.",
          ephemeral: true,
        });
        return;
      }

      // Find fruits to sell
      const query = {
        userId: interaction.user.id,
        sold: false,
        ...(type !== 'all' && { rarity: type }),
      };

      const fruits = await FruitModel.find(query);
      if (fruits.length === 0) {
        await interaction.reply({
          content: `You don't have any ${type === 'all' ? '' : type} fruits to sell!`,
          ephemeral: true,
        });
        return;
      }

      // Calculate total value
      const totalValue = fruits.reduce((sum, fruit) => sum + fruit.value, 0);

      // Update fruits as sold
      await FruitModel.updateMany(
        { _id: { $in: fruits.map(f => f._id) } },
        {
          $set: {
            sold: true,
            soldAt: new Date(),
            soldFor: totalValue,
          },
        }
      );

      // Update user's coins
      user.coins += totalValue;
      await user.save();

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('💰 Fruit Sale')
        .setDescription(`You sold ${fruits.length} fruits for ${totalValue} coins!`)
        .addFields(
          {
            name: 'Fruits Sold',
            value: fruits.map(f => f.name).join('\n'),
            inline: true,
          },
          {
            name: 'Total Value',
            value: `${totalValue} coins`,
            inline: true,
          }
        )
        .setFooter({ text: `Use /inventory to check your remaining fruits` });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in sell command:', error);
      await interaction.reply({
        content: 'There was an error while selling your fruits!',
        ephemeral: true,
      });
    }
  },
}; 