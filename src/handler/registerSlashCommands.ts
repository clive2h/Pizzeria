import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

const registerSlashCommands = async (clientId: string, guildId: string) => {
  const commands = [];
  const commandsPath = join(__dirname, '../slashCommands');
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  console.log(`Total slash commands: ${commandFiles.length}`);

  for (const file of commandFiles) {
    try {
      const commandModule = await import(join(commandsPath, file));

      if (commandModule.data && typeof commandModule.execute === 'function') {
        commands.push({
          name: commandModule.data.name,
          description: commandModule.data.description || 'No description provided.',
          options: commandModule.data.options || [],
        });
      } else {
        console.warn(`Skipping invalid command file: ${file}`);
      }
    } catch (err) {
      console.error(`Error loading command from file ${file}:`, err);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error while registering slash commands:', error);
  }
};

export { registerSlashCommands };
