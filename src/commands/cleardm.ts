import { ChannelType, Message } from "discord.js";

export const name = 'cleardm';

export const execute = async (message: Message) => {
  try {
    // Ensure the command is used in a DM channel
    if (message.channel.type !== ChannelType.DM) {
      await message.reply("This command can only be used in DMs.");
      return;
    }

    let deletedMessages = 0;

    while (true) {
      // Fetch the last 100 messages in the DM channel
      const messages = await message.channel.messages.fetch({ limit: 100 });

      // Filter messages to only include those sent by the bot
      const botMessages = messages.filter(msg => msg.author.bot);

      // If no bot messages are left, break the loop
      if (botMessages.size === 0) {
        break;
      }

      // Loop through and delete bot messages
      for (const [id, msg] of botMessages) {
        await msg.delete().catch((err) =>
          console.error(`Failed to delete message ${id}:`, err)
        );
        deletedMessages++;
      }
    }

    // Notify the user when the operation is complete
    await message.channel.send(`Bot messages (${deletedMessages}) have been cleared!`);
  } catch (error) {
    console.error("Error clearing bot messages in DMs:", error);
  }
};
