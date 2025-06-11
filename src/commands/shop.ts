import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

const UPGRADES = {
  basketCapacity: {
    name: '🧺 Basket Capacity',
    description: 'Carry more fruits before needing to sell',
    basePrice: 100,
    maxLevel: 10,
    priceMultiplier: 1.5,
  },
  toolQuality: {
    name: '🔧 Tool Quality',
    description: 'Better tools = faster picking or rarer fruits',
    basePrice: 200,
    maxLevel: 5,
    priceMultiplier: 2,
  },
  fruitScanner: {
    name: '🔍 Fruit Scanner',
    description: 'Increases chance of finding high-value fruit',
    basePrice: 500,
    maxLevel: 3,
    priceMultiplier: 2.5,
  },
  autoPicker: {
    name: '🤖 Auto Picker',
    description: 'Idle-style collector with cooldowns',
    basePrice: 1000,
    maxLevel: 2,
    priceMultiplier: 3,
  },
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Visit the shop to buy upgrades and tools'),

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

      // Create shop embed
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🛍️ Fruit Picker Shop')
        .setDescription(`Your Balance: ${user.coins} coins\n\nSelect an upgrade to purchase:`);

      // Add upgrade fields
      Object.entries(UPGRADES).forEach(([key, upgrade]) => {
        const currentLevel = user.upgrades[key as keyof typeof user.upgrades] || 0;
        const price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
        const status = currentLevel >= upgrade.maxLevel ? 'MAX' : `Level ${currentLevel}/${upgrade.maxLevel}`;
        
        embed.addFields({
          name: `${upgrade.name} (${status})`,
          value: `${upgrade.description}\nPrice: ${price} coins`,
          inline: true,
        });
      });

      // Create buttons for each upgrade
      const rows = [];
      for (let i = 0; i < Object.keys(UPGRADES).length; i += 3) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        const upgrades = Object.entries(UPGRADES).slice(i, i + 3);
        
        upgrades.forEach(([key, upgrade]) => {
          const currentLevel = user.upgrades[key as keyof typeof user.upgrades] || 0;
          const price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
          
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`buy_${key}`)
              .setLabel(`Buy ${upgrade.name}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(currentLevel >= upgrade.maxLevel || user.coins < price)
          );
        });
        
        rows.push(row);
      }

      const message = await interaction.reply({
        embeds: [embed],
        components: rows,
        fetchReply: true,
      });

      // Create button collector
      const collector = message.createMessageComponentCollector({
        time: 60000, // 1 minute
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: "This isn't your shop!", ephemeral: true });
          return;
        }

        const [action, upgradeKey] = i.customId.split('_');
        const upgrade = UPGRADES[upgradeKey as keyof typeof UPGRADES];
        const currentLevel = user.upgrades[upgradeKey as keyof typeof user.upgrades] || 0;
        const price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));

        if (user.coins < price) {
          await i.reply({ content: "You don't have enough coins!", ephemeral: true });
          return;
        }

        // Update user
        user.coins -= price;
        user.upgrades[upgradeKey as keyof typeof user.upgrades] = currentLevel + 1;
        await user.save();

        // Update embed
        embed.setDescription(`Your Balance: ${user.coins} coins\n\nSelect an upgrade to purchase:`);
        Object.entries(UPGRADES).forEach(([key, upgrade]) => {
          const currentLevel = user.upgrades[key as keyof typeof user.upgrades] || 0;
          const price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
          const status = currentLevel >= upgrade.maxLevel ? 'MAX' : `Level ${currentLevel}/${upgrade.maxLevel}`;
          
          embed.spliceFields(
            embed.data.fields.findIndex(f => f.name.startsWith(upgrade.name)),
            1,
            {
              name: `${upgrade.name} (${status})`,
              value: `${upgrade.description}\nPrice: ${price} coins`,
              inline: true,
            }
          );
        });

        // Update buttons
        rows.forEach(row => {
          row.components.forEach(button => {
            const [action, key] = button.data.custom_id.split('_');
            const currentLevel = user.upgrades[key as keyof typeof user.upgrades] || 0;
            const price = Math.floor(UPGRADES[key as keyof typeof UPGRADES].basePrice * 
              Math.pow(UPGRADES[key as keyof typeof UPGRADES].priceMultiplier, currentLevel));
            
            button.setDisabled(currentLevel >= UPGRADES[key as keyof typeof UPGRADES].maxLevel || user.coins < price);
          });
        });

        await i.update({ embeds: [embed], components: rows });
      });

      collector.on('end', () => {
        rows.forEach(row => {
          row.components.forEach(button => button.setDisabled(true));
        });
        interaction.editReply({ components: rows }).catch(logger.error);
      });
    } catch (error) {
      logger.error('Error in shop command:', error);
      await interaction.reply({
        content: 'There was an error while accessing the shop!',
        ephemeral: true,
      });
    }
  },
}; 