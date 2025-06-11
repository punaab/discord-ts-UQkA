import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';
import { readdirSync } from 'fs';
import { logger } from './utils/logger';

// Load environment variables
config();

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    try {
        const filePath = join(commandsPath, file);
        const { command } = require(filePath);
        
        if (!command) {
            logger.warn(`No command export found in ${filePath}`);
            continue;
        }

        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            logger.info(`Loaded command: ${command.data.name}`);
        } else {
            logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        logger.error(`Error loading command from ${file}:`, error);
    }
}

// Construct and prepare an instance of the REST module
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
    logger.error('DISCORD_TOKEN is not set in environment variables');
    process.exit(1);
}

if (!clientId) {
    logger.error('DISCORD_CLIENT_ID is not set in environment variables');
    process.exit(1);
}

logger.info(`Found ${commands.length} commands to deploy`);

const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${(data as any[]).length} application (/) commands.`);
    } catch (error) {
        logger.error('Error deploying commands:', error);
        process.exit(1);
    }
})(); 