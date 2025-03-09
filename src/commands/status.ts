import { Message, ActivityType } from "discord.js";
import { client } from "../index"; // Adjust the path based on your folder structure

export const name = 'status';

export const execute = async (message: Message) => {
    if (!client.user) {
        console.error("Client user is not defined. Ensure the bot is logged in.");
        return;
    }

    try {
        client.user.setPresence({
            activities: [{ name: `Working TypeScript.`, type: ActivityType.Playing }],
            status: 'dnd',
        });
        message.reply("Bot status updated successfully!");
    } catch (error) {
        console.error("Failed to set presence:", error);
        message.reply("An error occurred while updating the bot's status.");
    }
};
