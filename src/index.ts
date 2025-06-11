import {
    Client,
    Events,
    GatewayIntentBits,
    Partials,
    Collection
} from "discord.js";
import { join } from "path";
import { readdirSync } from "fs";
import { config } from 'dotenv';
import { Command } from './types/Command';
import { connectDatabase } from './database/connection';
import { setupEventHandlers } from './events';
import { setupCronJobs } from './cron';
import { logger } from './utils/logger';

// Load environment variables
config();

const token = process.env.DISCORD_TOKEN;
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

// Command collection
client.commands = new Collection<string, Command>();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Initialize bot
async function initialize() {
    try {
        // Connect to database
        await connectDatabase();
        logger.info('Connected to database');

        // Setup event handlers
        setupEventHandlers(client);
        logger.info('Event handlers setup complete');

        // Setup cron jobs
        setupCronJobs(client);
        logger.info('Cron jobs setup complete');

        // Login to Discord
        await client.login(token);
        logger.info('Bot logged in successfully');
    } catch (error) {
        logger.error('Error during initialization:', error);
        process.exit(1);
    }
}

// Start the bot
initialize();