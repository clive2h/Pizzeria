import {
  Client,
  VoiceState,
  Interaction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  AuditLogEvent,
  ComponentType,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

module.exports = {
  name: 'voiceStateUpdateAndInteraction',
  once: false,
  async execute(client: Client) {
    console.log('[Event Handler] voiceStateUpdateAndInteraction loaded.');

    const collectors = new Map<string, any>();

    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
      try {
        if (oldState.serverMute === newState.serverMute) {
          return; 
        }

        if (!oldState.serverMute && newState.serverMute) {
          const mutedUser = newState.member?.user;
          if (!mutedUser) {
            return;
          }

          try {
            const auditLogs = await newState.guild.fetchAuditLogs({
              limit: 1,
              type: AuditLogEvent.MemberUpdate,
            });

            const muteLog = auditLogs.entries.first();
            if (!muteLog) {
              console.log('No mute action found in the audit log.');
              return;
            }

            const muteAction = muteLog.changes.find((change) => change.key === 'mute');
            if (!muteAction || muteAction.new !== true) {
              console.log('No valid mute action detected.');
              return;
            }

            const mutedBy = muteLog.executor;
            if (!mutedBy || mutedBy.id === mutedUser.id) {
              console.log('The mute action was self-initiated or no executor found.');
              return;
            }

            const mutedMember = newState.guild.members.cache.get(mutedUser.id);
            const executorMember = newState.guild.members.cache.get(mutedBy.id);
            if (!mutedMember || !executorMember) {
              return;
            }

            if (
              mutedMember.id === newState.guild.ownerId ||
              mutedMember.permissions.has('Administrator')
            ) {
              if (
                executorMember.roles.highest.position <= mutedMember.roles.highest.position
              ) {
                console.log(
                  'Cannot mute a user with an equal or higher role in the role hierarchy.'
                );
                if (newState.serverMute) {
                  await mutedMember.voice.setMute(
                    false,
                    'Cannot mute a user with an equal or higher role.'
                  );
                }
                return;
              }
            }

            const dmChannel = await mutedBy.createDM();
            const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('mute_options')
                .setPlaceholder('Select an option:')
                .addOptions([
                  {
                    label: 'Disruptive Behavior',
                    description: 'Talking over others, yelling, or causing unnecessary noise.',
                    value: 'disruptive_behavior',
                  },
                  {
                    label: 'Off-Topic Conversations',
                    description: 'Not adhering to the purpose of the voice room.',
                    value: 'off_topic',
                  },
                  {
                    label: 'Violation of Rules',
                    description: 'This indicates a rules violation.',
                    value: 'violation_of_rules',
                  },
                  {
                    label: 'Excessive Background Noise',
                    description: 'Poor mic quality or loud background sounds.',
                    value: 'poor_mic',
                  },
                  {
                    label: 'Other',
                    description: 'Specify a custom concern.',
                    value: 'other',
                  },
                ])
            );

            const cancelButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
            );

            const message = await dmChannel.send({
              content: `You have muted <@${mutedUser.id}>. Please confirm your reason within 1 minute, or the user will be unmuted.`,
              components: [menu, cancelButton],
            });

            const collector = message.createMessageComponentCollector({
              componentType: ComponentType.StringSelect,
              time: 60000,
            });

            collectors.set(mutedBy.id, collector);

            let confirmed = false;

            collector.on('collect', async (interaction) => {
              if (interaction.customId === 'mute_options') {
                confirmed = true;
                await interaction.reply({ content: 'Mute reason confirmed.', ephemeral: true });
                collector.stop();
              }
            });

            collector.on('end', async () => {
              try {
                if (!confirmed) {
                  await mutedMember.voice.setMute(false, 'Mute action was not confirmed.');
                }
                if (message.deletable) {
                  await message.delete();
                }
                collectors.delete(mutedBy.id);
              } catch (error) {
                console.error('Error deleting the message after collector end:', error);
              }
            });
          } catch (error) {
            console.error('Error handling mute action:', error);
          }
        }
      } catch (error) {
        console.error('Error in voiceStateUpdate:', error);
      }
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
      try {
        if (interaction.isStringSelectMenu()) {
          const { customId, values } = interaction;

          if (customId === 'mute_options') {
            const selectedOption = values[0];

            let response = '';
            switch (selectedOption) {
              case 'disruptive_behavior':
                response = 'You selected: Disruptive Behavior.';
                break;
              case 'off_topic':
                response = 'You selected: Off-Topic Conversations.';
                break;
              case 'violation_of_rules':
                response = 'You selected: Violation of Rules.';
                break;
              case 'poor_mic':
                response = 'You selected: Excessive Background Noise.';
                break;
              case 'other':
                response = 'You selected: Other. Please specify your concern.';
                break;
              default:
                response = 'Invalid option selected.';
                break;
            }

            await interaction.reply({ content: response, ephemeral: true });
          }
        } else if (interaction.isButton()) {
          const { customId } = interaction;

          if (customId === 'cancel') {
            try {
              const collector = collectors.get(interaction.user.id);
              if (collector) {
                collector.stop();
                const voiceState = interaction.guild?.voiceStates.cache.get(interaction.user.id);
                if (voiceState?.serverMute) {
                  await voiceState.setMute(false, 'Mute action was cancelled.');
                }
                collectors.delete(interaction.user.id);
              }
            } catch (error) {
              console.error('Error handling cancel button:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error in interactionCreate:', error);
      }
    });
  },
};
