import { PREFIX } from '../config.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { errorEmbed, infoEmbed } from '../utils/embeds.js';
import { formatDuration } from '../utils/parseDuration.js';
import { processRegistration } from '../tournament/handlers.js';

const stickyCounter = new Map();

export async function handleMessage(message, client) {
  if (message.author.bot || !message.guild) return;

  const data = getGuildData(message.guild.id);

  data.messageCounts[message.author.id] = (data.messageCounts[message.author.id] ?? 0) + 1;
  if ((data.messageCounts[message.author.id] % 10) === 0) saveGuildData(message.guild.id);

  const myAfk = data.afk[message.author.id];
  if (myAfk) {
    delete data.afk[message.author.id];
    await saveGuildData(message.guild.id);
    const dur = formatDuration(Date.now() - myAfk.since);
    message.reply({ embeds: [infoEmbed(`Welcome back ${message.author}! You were AFK for **${dur}**.`)] }).catch(() => {});
  }

  if (message.mentions.users.size > 0) {
    const mentioned = [];
    for (const [id] of message.mentions.users) {
      const afk = data.afk[id];
      if (afk) mentioned.push(`<@${id}> is AFK: **${afk.reason}** — <t:${Math.floor(afk.since / 1000)}:R>`);
    }
    if (mentioned.length) {
      message.reply({ embeds: [infoEmbed(mentioned.join('\n'))] }).catch(() => {});
    }
  }

  await processRegistration(message, data).catch((e) => console.error('[register]', e));

  const sticky = data.sticky[message.channel.id];
  if (sticky) {
    const key = `${message.guild.id}:${message.channel.id}`;
    const count = (stickyCounter.get(key) ?? 0) + 1;
    if (count >= 50) {
      stickyCounter.set(key, 0);
      try {
        if (sticky.lastMessageId) {
          const old = await message.channel.messages.fetch(sticky.lastMessageId).catch(() => null);
          if (old) await old.delete().catch(() => {});
        }
        const sent = await message.channel.send({ embeds: [infoEmbed(sticky.text, '📌 Sticky Message')] });
        sticky.lastMessageId = sent.id;
        await saveGuildData(message.guild.id);
      } catch {}
    } else {
      stickyCounter.set(key, count);
    }
  }

  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmdName = args.shift()?.toLowerCase();
  if (!cmdName) return;

  const cmd = client.prefixCommands.get(cmdName);
  if (!cmd) return;

  try {
    await cmd.execute({ message, args, client });
  } catch (e) {
    console.error(`[cmd:${cmdName}]`, e);
    message.reply({ embeds: [errorEmbed(`Something went wrong: \`${e.message ?? 'unknown error'}\``)] }).catch(() => {});
  }
}
