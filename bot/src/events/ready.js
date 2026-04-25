import { ActivityType, PresenceUpdateStatus } from 'discord.js';

export function startReady(client) {
  let i = 0;
  const tick = async () => {
    try {
      let totalMembers = 0;
      let totalGuilds = client.guilds.cache.size;
      for (const g of client.guilds.cache.values()) {
        totalMembers += g.memberCount ?? 0;
      }
      const statuses = [
        { name: `${totalMembers.toLocaleString()} members & ${totalGuilds} servers`, type: ActivityType.Watching },
        { name: `?setup | ?help`, type: ActivityType.Listening },
        { name: `Made with 💗 by Aditya`, type: ActivityType.Playing },
      ];
      const activity = statuses[i % statuses.length];
      i++;
      await client.user.setPresence({
        status: PresenceUpdateStatus.DoNotDisturb,
        activities: [activity],
      });
    } catch (e) {
      console.error('[presence]', e);
    }
  };
  tick();
  setInterval(tick, 7000);
}
