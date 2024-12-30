import { Client, Collection, REST, Routes, Interaction } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

type SlashCommand = {
  data: { name: string; toJSON: () => any };
  execute: (interaction: Interaction) => Promise<void>;
};

export const loadSlashCommands = async (
  client: Client,
  token: string,
  clientId: string,
  guildId?: string
) => {
  const slashCommands: Collection<string, SlashCommand> = new Collection();
  const slashCommandData = [];

  const slashCommandsPath = join(__dirname, '../slashCommands');
  const commandFiles = readdirSync(slashCommandsPath).filter((file) =>
    file.endsWith('.ts') || file.endsWith('.js')
  );

  for (const file of commandFiles) {
    const commandModule = await import(join(slashCommandsPath, file));
    
    // Validate the module export
    if (
      typeof commandModule.data?.name === 'string' &&
      typeof commandModule.execute === 'function'
    ) {
      const command: SlashCommand = {
        data: commandModule.data,
        execute: commandModule.execute,
      };
      slashCommands.set(command.data.name, command);
      slashCommandData.push(command.data.toJSON());
      console.log(`Loaded slash command: ${command.data.name}`);
    } else {
      console.warn(`Skipping invalid slash command file: ${file}`);
    }
  }
  
  // Register commands with Discord
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Registering slash commands...');

    if (guildId) {
      // Register for a specific guild
      await rest.put(Routes.applicationCommands(clientId,), {
        body: slashCommandData,
      });
      console.log(`Successfully registered commands for guild ${guildId}`);
    } else {
      // Register globally
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommandData,
      });
      console.log('Successfully registered global commands.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  // Handle interactions
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const commandName = interaction.commandName;
    const command = slashCommands.get(commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing slash command "${commandName}":`, error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: `There was an error executing the command: ${commandName}. Please try again later.`,
          ephemeral: true,
        });
      }
    }
  });
};
