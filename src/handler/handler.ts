import { Client, Message } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
const config = require('../config.json'); 

type Command = {
  name: string;
  execute: (message: Message, args: string[]) => void;
};

export const loadCommands = (client: Client) => {
  const commands: Map<string, Command> = new Map();

  const commandsPath = join(__dirname, '../commands');
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  console.log(`Total commands found: ${commandFiles.length}`)

  for (const file of commandFiles) {
    const command = require(join(commandsPath, file)) as Command;
    if (command.name && typeof command.execute === 'function') {
      commands.set(command.name, command);
    } else {
      console.warn(`Skipping invalid command file: ${file}`);
    }
  }

  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(1).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName || !commands.has(commandName)) return;

    try {
      const command = commands.get(commandName);
      if (command) await command.execute(message, args);
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error);
      message.reply('There was an error executing that command.');
    }
  });
};
