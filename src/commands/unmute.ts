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

        // Read muteData.json
        if (!fs.existsSync(muteDataPath)) {
            await message.reply("Mute data file not found.");
            return;
        }

        const muteData = JSON.parse(fs.readFileSync(muteDataPath, 'utf8'));
        
        let userIdToUnmute: string | null = null;

        // Check if it's a reply
        if (message.reference?.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
            userIdToUnmute = referencedMessage.author.id;
        } else {
            // Check for mention or ID in command arguments
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

        // Find the user in muteData
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

        // Check if the user has the mute role
        if (!member.roles.cache.has(roleId)) {
            await message.reply("The user does not have the mute role.");
            return;
        }

        // Remove the mute role
        await member.roles.remove(roleId);

        // Update muteData.json
        muteEntry.expired = true;
        fs.writeFileSync(muteDataPath, JSON.stringify(muteData, null, 2));

        await message.reply(`Successfully unmuted <@${userIdToUnmute}>.`);
    } catch (error) {
        console.error("Error executing unmute command:", error);
        await message.reply("An error occurred while trying to unmute the user.");
    }
};
