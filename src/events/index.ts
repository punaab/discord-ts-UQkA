import { Client, Events, Interaction } from 'discord.js';
import { logger } from '../utils/logger';

export function setupEventHandlers(client: Client) {
  // Handle interactions (slash commands)
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  });

  // Handle ready event
  client.once(Events.ClientReady, (c) => {
    logger.info(`Ready! Logged in as ${c.user.tag}`);
  });

  // Handle errors
  client.on(Events.Error, (error) => {
    logger.error('Discord client error:', error);
  });
} 