import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mutes a user in the server.')
  .addUserOption((option) =>
    option.setName('user').setDescription('The user to mute.').setRequired(true)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    // Acknowledge the interaction immediately
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser('user');

    if (!user) {
      await interaction.editReply({ content: 'User not found!' });
      return;
    }

    const member = await interaction.guild?.members.fetch(user.id);

    if (!member) {
      await interaction.editReply({
        content: 'Member not found in this server!',
      });
      return;
    }

    if (
      !interaction.guild?.members.me?.permissions.has(
        PermissionFlagsBits.MuteMembers
      )
    ) {
      await interaction.editReply({
        content: 'I do not have permission to mute members!',
      });
      return;
    }

    if (
      member.roles.highest.position >=
      interaction.guild.members.me?.roles.highest.position
    ) {
      await interaction.editReply({
        content: 'I cannot mute a user with an equal or higher role than mine!',
      });
      return;
    }

    if (!member.voice.channel) {
      await interaction.editReply({
        content: `${user.tag} is not in a voice channel!`,
      });
      return;
    }

    if (member.voice.serverMute) {
      await interaction.editReply({
        content: `${user.tag} is already muted.`,
      });
      return;
    }

    // Attempt to mute the user
    await member.voice.setMute(true, 'Muted by bot command');
    await interaction.editReply({
      content: `${user.tag} has been muted successfully.`,
    });
  } catch (error) {
    console.error('Error muting user:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      context: {
        userId: interaction.options.getUser('user')?.id || 'Unknown',
        guildId: interaction.guild?.id || 'Unknown',
      },
    });
    await interaction.editReply({
      content:
        'There was an error muting the user. Ensure I have the required permissions and try again.',
    });
  }
};
