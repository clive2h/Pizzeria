import { Message } from 'discord.js';

export const name = 'ping';

export const execute = async (message: Message) => {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiLatency = message.client.ws.ping;
  
    sent.edit(`🏓 Pong! Latency is **${latency}ms**. API Latency is **${apiLatency}ms**.`);
  };
