import { Message } from 'discord.js';
import { WordsData } from '../database'; // Adjust the import path as needed

export const name = 'words';

export const execute = async (message: Message) => {
  try {
    const args = message.content.trim().split(/\s+/);
    const words = args.slice(1);

    if (words.length === 0) {
      return message.reply('Please provide at least one word to store.');
    }

    const guildId = message.guild?.id;
    if (!guildId) {
      return message.reply('Guild ID not found.');
    }

    const [wordsData, created] = await WordsData.findOrCreate({
      where: { guildId },
    });

    // Ensure wordsData.words is always an array
    if (!Array.isArray(wordsData.words)) {
      wordsData.words = [];
    }

    let addedWords = [];
    for (const word of words) {
      if (!wordsData.words.includes(word)) {
        wordsData.words.push(word);
        addedWords.push(word);
      }
    }

    if (addedWords.length > 0) {
      await wordsData.update({ words: wordsData.words }, { returning: true });
      console.log('Updated words:', wordsData.words);
      return message.reply(`Words added: ${addedWords.join(', ')}`);
    }
    
    return message.reply('All provided words are already in the list.');
  } catch (error) {
    console.error('Error saving words:', error);
    return message.reply('An error occurred while saving the words.');
  }
};
