import { ChannelType, Message } from "discord.js";

export const name = 'cleardm';

export const execute = async (message: Message) => {
  try {
    if (message.channel.type !== ChannelType.DM) {
      await message.reply("This command can only be used in DMs.");
      return;
    }

    let deletedMessages = 0;

    while (true) {
      const messages = await message.channel.messages.fetch({ limit: 100 });

      const botMessages = messages.filter(msg => msg.author.bot);

      if (botMessages.size === 0) {
        break;
      }

      for (const [id, msg] of botMessages) {
        await msg.delete().catch((err) =>
          console.error(`Failed to delete message ${id}:`, err)
        );
        deletedMessages++;
      }
    }

    await message.channel.send(`Bot messages (${deletedMessages}) have been cleared!`);
  } catch (error) {
    console.error("Error clearing bot messages in DMs:", error);
  }
};
