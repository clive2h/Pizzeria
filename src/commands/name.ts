import { Message } from "discord.js";

export const name = 'changename';

export const execute = async (message: Message, args: string[]) => {
  if (args.length === 0) {
    return message.reply("Please provide a new name or a link to the new avatar.");
  }

  // Check if the first argument is a URL for an image (used to change avatar)
  const avatarUrlRegex = /^https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+$/;
  
  // If the first argument is a URL, try to set it as the avatar
  if (avatarUrlRegex.test(args[0])) {
    try {
      await message.client.user?.setAvatar(args[0]);
      message.reply("Bot's avatar has been changed!");
    } catch (error) {
      console.error("Error changing avatar:", error);
      message.reply("There was an error changing the bot's avatar.");
    }
  } else {
    // If the first argument is not a URL, treat it as the new bot name
    const newName = args.join(" ");  // Join multiple words if the new name contains spaces
    try {
      await message.client.user?.setUsername(newName);
      message.reply(`Bot's username has been changed to ${newName}`);
    } catch (error) {
      console.error("Error changing username:", error);
      message.reply("There was an error changing the bot's username.");
    }
  }
};
