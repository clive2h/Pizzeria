import { Message, PermissionFlagsBits } from "discord.js";
import { MuteData, GuildsData } from "../database";

export const name = "unmute";

export const execute = async (message: Message): Promise<void> => {
    try {
        if (!message.member?.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return;
        }

        let userIdToUnmute: string | null = null;

        // Check if it's a reply
        if (message.reference?.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            userIdToUnmute = referencedMessage.author.id;
        } else {
            const args = message.content.split(' ').slice(1);
            if (args.length === 0) {
                await message.reply("Please mention a user or provide their ID to unmute.");
                return;
            }
            userIdToUnmute = args[0].replace(/[<@!>]/g, '');
        }

        if (!userIdToUnmute) {
            await message.reply("Unable to determine the user to unmute.");
            return;
        }

        // Find the user in the database
        const muteEntry = await GuildsData.findOne({
            where: {
                guildId: message.guild?.id,
            }
        });

        if (!muteEntry) {
            await message.reply("The specified user is not muted.");
            return;
        }

        const member = await message.guild?.members.fetch(userIdToUnmute);

        if (!member) {
            await message.reply("User not found in this server.");
            return;
        }

        if (!member.roles.cache.has(muteEntry.muteRoleId)) {
            await message.reply("The user does not have the mute role.");
            return;
        }

        // Remove the mute role
        await member.roles.remove(muteEntry.muteRoleId);

        const muteLog = await MuteData.findOne({
            where: {
                guildId: message.guild?.id,
                expired: false
            }
        });
        
        if (muteLog) {
            await muteLog.update({ expired: true });
        } else {
            console.log('لم يتم العثور على سجل لكتم المستخدم.');
        }

        await message.reply(`Successfully unmuted <@${userIdToUnmute}>.`);
    } catch (error) {
        console.error("Error executing unmute command:", error);
        await message.reply("An error occurred while trying to unmute the user.");
    }
};
