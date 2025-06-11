import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { UserModel } from '../models/User';
import { AchievementModel } from '../models/Achievement';
import { logger } from '../utils/logger';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('achievement')
    .setDescription('View and claim your achievements')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List your achievements')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Claim an achievement reward')
        .addStringOption(option =>
          option.setName('name').setDescription('Achievement name').setRequired(true)
        )
    ) as any,

  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      const sub = interaction.options.getSubcommand();
      const user = await UserModel.findOne({ userId: interaction.user.id });
      
      if (!user) {
        await interaction.reply({ 
          content: "You haven't started picking fruits yet! Use `/pick` to get started.", 
          ephemeral: true 
        });
        return;
      }

      if (sub === 'list') {
        const achievements = await AchievementModel.find();
        const userAchievements = user.achievements || [];
        const embed = new EmbedBuilder()
          .setTitle('Your Achievements')
          .setColor('#FFD700');

        for (const ach of achievements) {
          const userAch = userAchievements.find(a => a.achievementId?.toString() === ach._id.toString());
          const status = userAch?.claimed ? '🎉' : userAch?.completed ? '✅' : '❌';
          embed.addFields({
            name: `${status} ${ach.name}`,
            value: `${ach.description}\nReward: ${formatRewards(ach.rewards)}\nProgress: ${userAch ? userAch.progress : 0}/${ach.requirements.target}`,
          });
        }

        await interaction.reply({ embeds: [embed] });
      } else if (sub === 'claim') {
        const name = interaction.options.getString('name', true);
        const achievement = await AchievementModel.findOne({ name });
        
        if (!achievement) {
          await interaction.reply({ 
            content: 'Achievement not found!', 
            ephemeral: true 
          });
          return;
        }

        const userAch = user.achievements.find(a => a.achievementId?.toString() === achievement._id.toString());
        
        if (!userAch || !userAch.completed) {
          await interaction.reply({ 
            content: 'You have not completed this achievement yet!', 
            ephemeral: true 
          });
          return;
        }

        if (userAch.claimed) {
          await interaction.reply({ 
            content: 'You have already claimed this achievement!', 
            ephemeral: true 
          });
          return;
        }

        // Grant rewards
        user.coins += achievement.rewards.coins || 0;
        user.gems += achievement.rewards.gems || 0;
        user.xp += achievement.rewards.xp || 0;
        userAch.claimed = true;
        await user.save();

        await interaction.reply({ 
          content: `You claimed the reward for ${achievement.name}! ${formatRewards(achievement.rewards)}` 
        });
      }
    } catch (error) {
      logger.error('Error in achievement command:', error);
      await interaction.reply({
        content: 'There was an error while managing your achievements!',
        ephemeral: true,
      });
    }
  },
};

function formatRewards(rewards: any): string {
  const arr = [];
  if (rewards.coins) arr.push(`${rewards.coins} coins`);
  if (rewards.gems) arr.push(`${rewards.gems} gems`);
  if (rewards.xp) arr.push(`${rewards.xp} XP`);
  return arr.join(', ');
} 