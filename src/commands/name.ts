import { Message } from "discord.js";

export const name = 'changename';

export const execute = async (message: Message, args: string[]) => {
  if (args.length === 0) {
    return message.reply("Please provide a new name or a link to the new avatar.");
  }

  const avatarUrlRegex = /^https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+$/;
  
  if (avatarUrlRegex.test(args[0])) {
    try {
      await message.client.user?.setAvatar(args[0]);
      message.reply("Bot's avatar has been changed!");
    } catch (error) {
      console.error("Error changing avatar:", error);
      message.reply("There was an error changing the bot's avatar.");
    }
  } else {
    const newName = args.join(" ");  
    try {
      await message.client.user?.setUsername(newName);
      message.reply(`Bot's username has been changed to ${newName}`);
    } catch (error) {
      console.error("Error changing username:", error);
      message.reply("There was an error changing the bot's username.");
    }
  }
};
