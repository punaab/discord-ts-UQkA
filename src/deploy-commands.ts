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

logger.info(`Found ${commandFiles.length} command files to process`);

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
            const commandData = command.data.toJSON();
            commands.push(commandData);
            logger.info(`Loaded command: ${commandData.name} with description: ${commandData.description}`);
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
logger.info(`Using Client ID: ${clientId}`);

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
        logger.info('Deployed commands:', (data as any[]).map(cmd => `${cmd.name}: ${cmd.description}`));
    } catch (error) {
        logger.error('Error deploying commands:', error);
        process.exit(1);
    }
})(); 