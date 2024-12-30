import { Client } from 'discord.js';
import { loadSlashCommands } from '../handler/slashHandler';
import { unmuteUser, } from './muteHandler';

const TOKEN = 'MTMxNjQyNDM0NDYwMzE5NzU0MA.G2SM3g._XaBFDCvBGgUV86vL7w38bFqGzcATB75MSvnjw';
const CLIENT_ID = '1316424344603197540';
const GUILD_ID = '1214968410752950322'; // Optional: for guild-specific registration

module.exports = {
  once: true,
  execute(client: Client) {
    setInterval(() => {
        unmuteUser(client);
      }, 3000);
    
    console.log(`Bot is ready! Logged in asss ${client.user?.tag}`);
     loadSlashCommands(client, TOKEN, CLIENT_ID,);

  },
};
