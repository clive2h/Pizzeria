import { Message } from 'discord.js';
import { GuildsData } from '../database';

export const name = 'setprefix';

export const execute = async (message: Message) => {
    try {
        await GuildsData.findOrCreate({
            where: { guildId: message.guild!.id }
        });
    } catch (error) {
        console.error('Error saving guild data:', error);
    }

    if (!message.member?.permissions.has('Administrator')) {
        return message.reply('You do not have permission to set the prefix.');
    }

    const args = message.content.split(' ').slice(1);
    if (args.length !== 1) {
        return message.reply('Usage: setprefix <newPrefix>');
    }

    const newPrefix = args[0];
    if (newPrefix.length !== 1) {
        return message.reply('The prefix must be exactly one character long.');
    }

    try {
        const [guildData] = await GuildsData.findOrCreate({
            where: { guildId: message.guild!.id }
        });

        guildData.set({
            prefix: newPrefix
        });
        await guildData.save();
        
        return message.reply(`Prefix successfully updated to: \`${newPrefix}\``);
    } catch (error: any) {
        console.error('Error updating prefix:', error?.message ?? error);
        return message.reply('An error occurred while updating the prefix.');
    }
};
