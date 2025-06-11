import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { logger } from '../utils/logger';

const QUEST_TYPES = {
  daily: [
    {
      name: 'Fruit Collector',
      description: 'Pick 10 fruits',
      reward: { coins: 50, gems: 1 },
      target: 10,
    },
    {
      name: 'Rare Hunter',
      description: 'Pick 3 rare or better fruits',
      reward: { coins: 100, gems: 2 },
      target: 3,
      requiredRarity: 'rare',
    },
    {
      name: 'Variety Seeker',
      description: 'Pick 5 different types of fruits',
      reward: { coins: 75, gems: 1 },
      target: 5,
      requiredTypes: ['🍎', '🍌', '🍊', '🍇', '🍓'],
    },
  ],
  weekly: [
    {
      name: 'Master Collector',
      description: 'Pick 50 fruits',
      reward: { coins: 300, gems: 5 },
      target: 50,
    },
    {
      name: 'Legendary Hunter',
      description: 'Pick 5 legendary or mythic fruits',
      reward: { coins: 500, gems: 10 },
      target: 5,
      requiredRarity: 'legendary',
    },
    {
      name: 'Fruit Expert',
      description: 'Pick 20 different types of fruits',
      reward: { coins: 400, gems: 8 },
      target: 20,
      requiredTypes: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍍', '🌟', '🌙'],
    },
  ],
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('View and manage your daily and weekly quests'),

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      // Get or create user
      let user = await UserModel.findOne({ userId: interaction.user.id });
      if (!user) {
        await interaction.reply({
          content: "You haven't started picking fruits yet! Use `/pick` to get started.",
          ephemeral: true,
        });
        return;
      }

      // Initialize quests if they don't exist
      if (!user.quests) {
        user.quests = {
          daily: null,
          weekly: null,
          lastDaily: null,
          lastWeekly: null,
        };
      }

      // Reset daily quest if needed
      const now = new Date();
      if (!user.quests.lastDaily || now.getTime() - user.quests.lastDaily.getTime() > 24 * 60 * 60 * 1000) {
        const dailyQuest = QUEST_TYPES.daily[Math.floor(Math.random() * QUEST_TYPES.daily.length)];
        user.quests.daily = {
          type: dailyQuest.name,
          target: dailyQuest.target,
          progress: 0,
          requiredRarity: dailyQuest.requiredRarity,
          requiredTypes: dailyQuest.requiredTypes,
        };
        user.quests.lastDaily = now;
      }

      // Reset weekly quest if needed
      if (!user.quests.lastWeekly || now.getTime() - user.quests.lastWeekly.getTime() > 7 * 24 * 60 * 60 * 1000) {
        const weeklyQuest = QUEST_TYPES.weekly[Math.floor(Math.random() * QUEST_TYPES.weekly.length)];
        user.quests.weekly = {
          type: weeklyQuest.name,
          target: weeklyQuest.target,
          progress: 0,
          requiredRarity: weeklyQuest.requiredRarity,
          requiredTypes: weeklyQuest.requiredTypes,
        };
        user.quests.lastWeekly = now;
      }

      await user.save();

      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎯 Your Quests')
        .setDescription('Complete quests to earn coins and gems!')
        .addFields(
          {
            name: '📅 Daily Quest',
            value: user.quests.daily
              ? `${user.quests.daily.type}\n${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.description}\nProgress: ${user.quests.daily.progress}/${user.quests.daily.target}\nReward: ${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.reward.coins} coins, ${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.reward.gems} gems`
              : 'No active daily quest',
          },
          {
            name: '📆 Weekly Quest',
            value: user.quests.weekly
              ? `${user.quests.weekly.type}\n${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.description}\nProgress: ${user.quests.weekly.progress}/${user.quests.weekly.target}\nReward: ${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.reward.coins} coins, ${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.reward.gems} gems`
              : 'No active weekly quest',
          }
        )
        .setFooter({ text: 'Daily quests reset at midnight UTC, weekly quests reset every Monday' });

      // Add tips
      embed.addFields({
        name: '💡 Tips',
        value: '• Use `/pick` to make progress on your quests\n• Complete quests to earn bonus rewards\n• Higher level quests give better rewards',
      });

      // Create buttons
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('claim_daily')
            .setLabel('Claim Daily Reward')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!user.quests.daily || user.quests.daily.progress < user.quests.daily.target),
          new ButtonBuilder()
            .setCustomId('claim_weekly')
            .setLabel('Claim Weekly Reward')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!user.quests.weekly || user.quests.weekly.progress < user.quests.weekly.target)
        );

      const message = await interaction.reply({ embeds: [embed], components: [row] });

      // Create collector for button interactions
      const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: 'This is not your quest!', ephemeral: true });
          return;
        }

        const questType = i.customId === 'claim_daily' ? 'daily' : 'weekly';
        const quest = user.quests[questType];
        const questTemplate = QUEST_TYPES[questType].find(q => q.name === quest.type);

        if (!quest || quest.progress < quest.target) {
          await i.reply({ content: 'You haven\'t completed this quest yet!', ephemeral: true });
          return;
        }

        // Give rewards
        user.coins += questTemplate.reward.coins;
        user.gems += questTemplate.reward.gems;

        // Reset quest
        if (questType === 'daily') {
          const newDailyQuest = QUEST_TYPES.daily[Math.floor(Math.random() * QUEST_TYPES.daily.length)];
          user.quests.daily = {
            type: newDailyQuest.name,
            target: newDailyQuest.target,
            progress: 0,
            requiredRarity: newDailyQuest.requiredRarity,
            requiredTypes: newDailyQuest.requiredTypes,
          };
          user.quests.lastDaily = now;
        } else {
          const newWeeklyQuest = QUEST_TYPES.weekly[Math.floor(Math.random() * QUEST_TYPES.weekly.length)];
          user.quests.weekly = {
            type: newWeeklyQuest.name,
            target: newWeeklyQuest.target,
            progress: 0,
            requiredRarity: newWeeklyQuest.requiredRarity,
            requiredTypes: newWeeklyQuest.requiredTypes,
          };
          user.quests.lastWeekly = now;
        }

        await user.save();

        await i.reply({
          content: `🎉 Quest completed! You received ${questTemplate.reward.coins} coins and ${questTemplate.reward.gems} gems!`,
          ephemeral: true,
        });

        // Update the original message
        const updatedEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('🎯 Your Quests')
          .setDescription('Complete quests to earn coins and gems!')
          .addFields(
            {
              name: '📅 Daily Quest',
              value: user.quests.daily
                ? `${user.quests.daily.type}\n${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.description}\nProgress: ${user.quests.daily.progress}/${user.quests.daily.target}\nReward: ${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.reward.coins} coins, ${QUEST_TYPES.daily.find(q => q.name === user.quests.daily.type)?.reward.gems} gems`
                : 'No active daily quest',
            },
            {
              name: '📆 Weekly Quest',
              value: user.quests.weekly
                ? `${user.quests.weekly.type}\n${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.description}\nProgress: ${user.quests.weekly.progress}/${user.quests.weekly.target}\nReward: ${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.reward.coins} coins, ${QUEST_TYPES.weekly.find(q => q.name === user.quests.weekly.type)?.reward.gems} gems`
                : 'No active weekly quest',
            }
          )
          .setFooter({ text: 'Daily quests reset at midnight UTC, weekly quests reset every Monday' });

        const updatedRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('claim_daily')
              .setLabel('Claim Daily Reward')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!user.quests.daily || user.quests.daily.progress < user.quests.daily.target),
            new ButtonBuilder()
              .setCustomId('claim_weekly')
              .setLabel('Claim Weekly Reward')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!user.quests.weekly || user.quests.weekly.progress < user.quests.weekly.target)
          );

        await interaction.editReply({ embeds: [updatedEmbed], components: [updatedRow] });
      });
    } catch (error) {
      logger.error('Error in quest command:', error);
      await interaction.reply({
        content: 'There was an error while managing your quests!',
        ephemeral: true,
      });
    }
  },
}; 