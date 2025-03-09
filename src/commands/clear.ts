import { ChannelType, Message, PermissionFlagsBits } from "discord.js";

export const name = 'clear';

export const execute = async (message: Message) => {
    const args = message.content.trim().split(/ +/).slice(1); // Extract arguments after the command name

    if (!message.guild) {
        return message.reply({ content: '❌ This command can only be used in a server.' });
    }

    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply({ content: '❌ You need the `Manage Messages` permission to use this command.' });
    }

    if (
        message.channel.type !== ChannelType.GuildText && // Standard text channel
        message.channel.type !== ChannelType.GuildVoice && // Voice text channel
        message.channel.type !== ChannelType.GuildAnnouncement && // Announcement channel
        message.channel.type !== ChannelType.PublicThread && // Public thread
        message.channel.type !== ChannelType.PrivateThread && // Private thread
        message.channel.type !== ChannelType.AnnouncementThread // Announcement thread
      ) {
        return message.reply({ content: '❌ This command can only be used in text-compatible channels.' });
      }

    let amount = parseInt(args[0], 10);

    if (!amount || isNaN(amount)) {
        amount = 100; 
    }

    if (amount < 1 || amount > 100) {
        return message.reply({ content: '❌ Please provide a number between 1 and 100.' });
    }

    try {
        // Bulk delete messages
        const deletedMessages = await message.channel.bulkDelete(amount, true);
        const confirmation = await message.channel.send({ content: `✅ Deleted ${deletedMessages.size} messages!` });

        setTimeout(() => confirmation.delete().catch(console.error), 5000);
    } catch (err) {
        console.error(err);
        message.reply({ content: '❌ There was an error trying to delete messages in this channel.' });
    }
};
