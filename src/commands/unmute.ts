import {
    Message,
    GuildMemberRoleManager,
    PermissionFlagsBits
} from "discord.js";
import fs from 'fs';
import path from "path";

export const name = "unmute";

export const execute = async (message: Message): Promise<void> => {
    try {
        const muteDataPath = path.resolve(__dirname, "../muteData.json");

        if (!message.member?.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return;
        }

        if (!fs.existsSync(muteDataPath)) {
            await message.reply("Mute data file not found.");
            return;
        }

        const muteData = JSON.parse(fs.readFileSync(muteDataPath, 'utf8'));
        
        let userIdToUnmute: string | null = null;

        if (message.reference?.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            userIdToUnmute = referencedMessage.author.id;
        } else {
            const args = message.content.split(' ').slice(1);
            if (args.length === 0) {
                await message.reply("Please mention a user or provide their ID to unmute.");
                return;
            }

            const mentionOrId = args[0].replace(/[<@!>]/g, '');
            userIdToUnmute = mentionOrId;
        }

        if (!userIdToUnmute) {
            await message.reply("Unable to determine the user to unmute.");
            return;
        }

        const muteEntry = muteData.find((entry: any) => entry.guildId === message.guild?.id && entry.userId === userIdToUnmute);

        if (!muteEntry) {
            await message.reply("The specified user is not muted.");
            return;
        }

        const roleId = muteEntry.roleId;
        const member = await message.guild?.members.fetch(userIdToUnmute);

        if (!member) {
            await message.reply("User not found in this server.");
            return;
        }

        if (!member.roles.cache.has(roleId)) {
            await message.reply("The user does not have the mute role.");
            return;
        }

        await member.roles.remove(roleId);

        muteEntry.expired = true;
        fs.writeFileSync(muteDataPath, JSON.stringify(muteData, null, 2));

        await message.reply(`Successfully unmuted <@${userIdToUnmute}>.`);
    } catch (error) {
        console.error("Error executing unmute command:", error);
        await message.reply("An error occurred while trying to unmute the user.");
    }
};
