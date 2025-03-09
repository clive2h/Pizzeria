import { Client, GatewayIntentBits,Partials } from 'discord.js';
import { loadCommands } from './handler/handler';
import { loadEvents } from './handler/events';
const event = require('./events/voicemuteEvent');

import 'dotenv/config';
import { initializeDatabase } from './database';

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

event.execute(client);

initializeDatabase(client).then(async () => {
  loadCommands(client);
  loadEvents(client);
  client.login(process.env.TOKEN);
  
  // Initialize music clients

}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});