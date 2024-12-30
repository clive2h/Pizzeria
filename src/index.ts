import { Client, GatewayIntentBits,Partials } from 'discord.js';
import { loadCommands } from './handler/handler';
import { registerSlashCommands } from './handler/registerSlashCommands';
import { loadSlashCommands } from './handler/slashHandler';
import { connectToMongoDB } from './mongo/mongodb';
import { loadEvents } from './handler/events';
import 'dotenv/config';

export const client = new Client({
  intents: [
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildWebhooks,
  ],
  partials: [Partials.Channel] // Needed to handle partial DM channels
});

const event = require('./events/voicemuteEvent');
event.execute(client);

loadCommands(client);
loadEvents(client);


connectToMongoDB()
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

client.login(process.env.TOKEN);
