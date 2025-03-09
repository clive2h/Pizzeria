import {
    Message,
    PermissionFlagsBits,
    GuildMemberRoleManager,
    ChannelType,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    StringSelectMenuInteraction,
    EmbedBuilder,
    Events,
    Channel

} from "discord.js";
import fs from 'fs';
import path from "path";
const config = require('../config.json');
import { MuteData, GuildsData } from '../database'; // Adjust the import path as necessary


export const eventName = Events.ChannelCreate;
export const eventExecute = async (channel: any) => {




    try {
        if (!channel.guild ||
            (channel.type !== ChannelType.GuildText &&
                channel.type !== ChannelType.GuildVoice)) {
            return;
        }

        const mutedRole = channel.guild.roles.cache.find((role: { name: string; }) => role.name === "Muted");
        if (!mutedRole) return;

        await channel.permissionOverwrites.create(mutedRole, {
            SendMessages: false,
            AttachFiles: false
        });
    } catch (error) {
        console.error("Error setting up mute permissions:", error);
    }
}


export const name = "mute";

export const execute = async (message: Message): Promise<void> => {
    try {
        if (!message.member?.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return;
        }

        const args = message.content.split(/\s+/);
        let target = message.mentions.members?.first() || message.guild?.members.cache.get(args[1]);
        if (!target) {
            const usageEmbed = new EmbedBuilder()
                .setColor(config.embed)
                .setDescription(`${config.prefix}${name} 'mentionUser/id'`);
            await message.reply({ embeds: [usageEmbed] });
            return;
        }

        const mutedRoleId = await fetchMutedRole(message.guild!.id);
        let mutedRole = mutedRoleId ? message.guild?.roles.cache.get(mutedRoleId) : null;

        if (!mutedRole) {
            mutedRole = await message.guild?.roles.create({
                name: "Muted",
                permissions: [],
                reason: "Muted role required for muting functionality",
            });

            if (mutedRole) {

                for (const [, channel] of message.guild!.channels.cache) {
                    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
                        await channel.permissionOverwrites.create(mutedRole, {
                            SendMessages: false,
                            AttachFiles: false
                        });
                    }
                }

            } else {
                await message.react('❌');
                await message.reply("Failed to create the 'Muted' role. Please check my permissions and try again.");
                return;
            }
        }

        const targetRoles = target.roles as GuildMemberRoleManager;
        if (targetRoles.cache.has(mutedRole.id)) {
            await message.reply("The user is already muted.");
            return;
        }

        let muteDuration = 30 * 60;

        const selectReason = new StringSelectMenuBuilder()
            .setCustomId(`reason-${message.author.id}`)
            .setPlaceholder('Please select the reason for mute.')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Spamming')
                    .setValue('spamming')
                    .setDescription(`Mute for 15 minutes due to spamming`),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bad Words')
                    .setValue('bad_words')
                    .setDescription(`Mute for 1 hour due to bad language`),
                new StringSelectMenuOptionBuilder()
                    .setLabel('For Being Jerk')
                    .setValue('being_jerk')
                    .setDescription(`Mute for 2 hours for being rude`),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bothering')
                    .setValue('bothering')
                    .setDescription(`Mute for 3 hours for bothering others`),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Another reason')
                    .setValue('different-reason')
                    .setDescription(`Mute for another reason choose custom duration.`)
            ]);

        const reasonRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectReason);

        const reply = await message.reply({
            content: `<@${message.author.id}>, Choose the reason to mute <@${target.id}>.`,
            components: [reasonRow],
        });

        const collector = reply.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === message.author.id,
            time: 60000, // 60 seconds
        });

        collector.on('collect', async (interaction: StringSelectMenuInteraction) => {
            try {
                const reason = interaction.values[0];
                switch (reason) {
                    case 'spamming':
                        muteDuration = 15 * 60; // 15 minutes
                        break;
                    case 'bad_words':
                        muteDuration = 1 * 60 * 60; // 1 hour
                        break;
                    case 'being_jerk':
                        muteDuration = 2 * 60 * 60; // 2 hours
                        break;
                    case 'bothering':
                        muteDuration = 3 * 60 * 60; // 3 hours
                        break;
                    default:
                        muteDuration = 30 * 60; // Default mute duration (30 minutes)
                        break;
                    case 'different-reason': {
                        const channel = interaction.channel;

                        // Ensure the channel is a valid TextChannel or DMChannel that supports collectors
                        if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.DM)) {
                            await interaction.reply({
                                content: 'Cannot collect custom duration in this type of channel.',
                                ephemeral: true,
                            });
                            return;
                        }

                        await interaction.message.edit({
                            content: 'Please specify the mute reason followed by the duration (e.g., "Being disruptive 10m"):',
                            components: []
                        });

                        const durationCollector = channel.createMessageCollector({
                            filter: (msg) => msg.author.id === interaction.user.id,
                            time: 30000, // 30 seconds
                            max: 1,
                        });

                        durationCollector.on('collect', async (msg) => {
                            const input = msg.content.trim();
                            const durationRegex = /(\d+)([smh])/i; // Matches duration with unit (e.g., 10m, 2h, 30s)
                            const match = durationRegex.exec(input);

                            if (!match) {
                                await msg.reply('Invalid input format. Please provide the reason followed by the duration (e.g., "Being disruptive 10m").');
                                return;
                            }

                            const reason = input.replace(durationRegex, '').trim(); // Extract reason from input
                            const durationValue = parseInt(match[1], 10);
                            const durationUnit = match[2].toLowerCase();

                            if (!reason) {
                                await msg.reply('Please provide a valid reason along with the duration.');
                                return;
                            }

                            // Calculate mute duration in seconds
                            switch (durationUnit) {
                                case 's':
                                    muteDuration = durationValue;
                                    break;
                                case 'm':
                                    muteDuration = durationValue * 60;
                                    break;
                                case 'h':
                                    muteDuration = durationValue * 60 * 60;
                                    break;
                                default:
                                    muteDuration = 30 * 60; // Default to 30 minutes
                                    break;
                            }



                            await interaction.message.delete()
                            await msg.delete();
                            await applyMute(target, reason, message, muteDuration, mutedRole);
                            await logMuteData(message.guild?.id!, target.id, muteDuration, reason, message.author.id, mutedRole);
                        });

                        durationCollector.on('end', async (_, reason) => {
                            if (reason === 'time') {
                                await interaction.followUp({ content: 'Time ran out. Please try again.', ephemeral: true });
                            }
                        });

                        return;
                    }

                }

                // Delete the select menu
                await interaction.message.delete();

                // Apply mute and log data
                await applyMute(target, reason, message, muteDuration, mutedRole);
                await logMuteData(message.guild?.id!, target.id, muteDuration, reason, message.author.id, mutedRole);
            } catch (err) {
                console.error("Error handling interaction:", err);
                await interaction.reply({ content: 'An error occurred while processing your mute request. Please try again.', ephemeral: true });
            }
        });


        collector.on('end', async (_, reason) => {
            if (reason !== 'messageDelete') {
                try {
                    await reply.delete();
                } catch (err) {
                    console.error("Error clearing select menu:", err);
                }
            }
        });

    } catch (error) {
        console.error("Error executing the mute command:", error);
        await message.reply("An error occurred while trying to execute the mute command. Please try again.");
    }
};

const applyMute = async (target: any, reason: string, message: Message, muteDuration: number, mutedRole: any) => {
    if (mutedRole) {
        const targetRoles = target.roles as GuildMemberRoleManager;
        await targetRoles.add(mutedRole);

        for (const [, channel] of message.guild!.channels.cache) {
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildVoice) {
                await channel.permissionOverwrites.create(mutedRole, {
                    SendMessages: false,
                    AttachFiles: false
                });
            }
        }
        await logGuildMuteRole(message.guild!.id, mutedRole.id);

        await message.react('✅');
        // await message.reply(`<@${target.id}> has been muted.`);
    } else {
        await message.reply("Muted role does not exist. Please try again later.");
    }
};


const logMuteData = async (guildId: string, userId: string, muteDuration: number, reason: string, authorId: string, mutedRole: any) => {
    const currentTime = Date.now();

    let readableDuration = "";
    if (muteDuration >= 3600) {
        readableDuration = `${Math.floor(muteDuration / 3600)}h`;  // Hours
    } else if (muteDuration >= 60) {
        readableDuration = `${Math.floor(muteDuration / 60)}m`;  // Minutes
    } else {
        readableDuration = `${muteDuration}s`;  // Seconds
    }

    const currentDate = new Date();
    const date = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;  // Format: DD/MM/YYYY
    const time = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;  // Format: HH:MM:SS

    const muteData = {
        guildId: guildId, // Ensure guildId is a number
        userId: userId,          // Muted user's ID
        mutedBy: authorId,       // Author (moderator) who muted
        roleId: mutedRole.id,    // roleId is now passed correctly
        date: date,              // Date when muted
        time: time,              // Time when muted
        duration: readableDuration, // Human-readable duration
        reason: reason,
        expired: false
    };

    try {
        await MuteData.create(muteData);
    } catch (error) {
        console.error("Error logging mute data:", error);
    }
};




const logGuildMuteRole = async (guildId: string, roleId: string) => {
    try {
        const [guildData, created] = await GuildsData.findOrCreate({
            where: { guildId },
        });
        if (!created) {
            guildData.muteRoleId = roleId;
            await guildData.save();
        }
        // console.log("Guild mute role ID logged successfully.");
    } catch (error) {
        console.error("Error logging guild mute role ID:", error);
    }
};

const fetchMutedRole = async (guildId: string) => {
    try {
        const guildData = await GuildsData.findOne({ where: { guildId } });
        return guildData?.muteRoleId ?? null;
    } catch (error) {
        console.error("Error fetching muted role ID:", error);
        return null;
    }
};
