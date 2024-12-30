import { Client, Guild, Role, User, TextChannel } from 'discord.js';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

const muteDataFilePath = path.join(__dirname, '../muteData.json');


function parseDuration(duration: string): number {
  const durationRegex = /(\d+)(h|m|s)/g;
  let totalMilliseconds = 0;
  let match;

  while (match = durationRegex.exec(duration)) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'h') {
      totalMilliseconds += value * 60 * 60 * 1000; 
    } else if (unit === 'm') {
      totalMilliseconds += value * 60 * 1000;
    } else if (unit === 's') {
      totalMilliseconds += value * 1000;
    }
  }
  return totalMilliseconds;
}

async function unmuteUser(client: Client) {
  try {
    const data = await fs.promises.readFile(muteDataFilePath, 'utf8');
    const muteData: any[] = JSON.parse(data);

    for (const mute of muteData) {
      if (mute.expired) {
    //    console.log(`Skipping expired mute for user ${mute.userId} in guild ${mute.guildId}`);
        continue;
      }

      const muteStartTime = moment(`${mute.date} ${mute.time}`, 'DD/MM/YYYY HH:mm:ss');
      const durationInMilliseconds = parseDuration(mute.duration);

      const muteEndTime = muteStartTime.add(durationInMilliseconds, 'milliseconds');
      const currentTime = moment();

      if (currentTime.isAfter(muteEndTime)) {
        try {
          const guild = await client.guilds.fetch(mute.guildId);
          const member = await guild.members.fetch(mute.userId);
          const muteRole = await guild.roles.fetch(mute.roleId);

          if (member && muteRole) {
            await member.roles.remove(muteRole);
          } else {
          //  console.log(`Could not find member or mute role in guild ${guild.name}`);
          }

          mute.expired = true;
        } catch (err) {
          console.error('Error unmuting user:', err);
        }
      }
    }

    await fs.promises.writeFile(muteDataFilePath, JSON.stringify(muteData, null, 2));

  } catch (err) {
    console.error('Error reading mute data:', err);
  }
}

export { unmuteUser };


