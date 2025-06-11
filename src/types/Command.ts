import { SlashCommandBuilder, ChatInputCommandInteraction, Collection } from 'discord.js';

export interface Command {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
} 