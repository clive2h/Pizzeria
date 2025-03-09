import { 
    ChannelType, 
    Message, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } from 'discord.js';
  
  export const name = 'bots';
  
  export const execute = async (message: Message) => {
    if (!message.guild) return;
  
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ content: '❌ You need the `Manage Messages` permission to use this command.' });
    }
  
    if (
      message.channel.type !== ChannelType.GuildText && 
      message.channel.type !== ChannelType.GuildVoice && 
      message.channel.type !== ChannelType.GuildAnnouncement && 
      message.channel.type !== ChannelType.PublicThread && 
      message.channel.type !== ChannelType.PrivateThread && 
      message.channel.type !== ChannelType.AnnouncementThread
    ) {
      return message.reply({ content: '❌ This command can only be used in text-compatible channels.' });
    }
  
    const bots = message.guild.members.cache.filter(member => member.user.bot);
  
    if (bots.size === 0) {
      return message.channel.send('🤖 No bots found in this server.');
    }
  
    // Pagination setup
    const itemsPerPage = 25;
    const botArray = Array.from(bots.values());
    let currentPage = 0;
  
    const generateEmbed = (page: number) => {
      const start = page * itemsPerPage;
      const end = start + itemsPerPage;
      const currentBots = botArray.slice(start, end);
  
      const botList = currentBots
        .map(bot => `${bot}`)
        .join('\n') || 'No bots on this page.';
  
      return new EmbedBuilder()
        .setDescription(botList)
        .setColor('Orange')
        .setFooter({ text: `Total Bots: ${bots.size}` })
    };
  
    if (botArray.length <= itemsPerPage) {
      return message.channel.send({
        embeds: [generateEmbed(0)]
      });
    }
  
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(botArray.length <= itemsPerPage)
    );
  
    const messageComponent = await message.channel.send({
      embeds: [generateEmbed(currentPage)],
      components: [row]
    });
  
    const collector = messageComponent.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === message.author.id,
      time: 60000
    });
  
    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'next') {
        currentPage++;
      } else if (interaction.customId === 'previous') {
        currentPage--;
      }
  
      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage >= Math.ceil(botArray.length / itemsPerPage) - 1);
  
      await interaction.update({
        embeds: [generateEmbed(currentPage)],
        components: [row]
      });
    });
  
    collector.on('end', async () => {
      row.components.forEach(button => button.setDisabled(true));
      await messageComponent.edit({
        components: [row]
      });
    });
  };
  