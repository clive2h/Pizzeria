import { SlashCommandBuilder } from 'discord.js';
import { CommandInteraction, Message } from 'discord.js';

// Define the slash command
export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! and latency information.');

export async function execute(interaction: CommandInteraction) {
    const sent: Message = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(`Pong! 🏓
Latency: ${latency}ms
API Latency: ${Math.round(interaction.client.ws.ping)}ms`);
}
