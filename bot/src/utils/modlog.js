import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { getGuildData } from '../storage.js';

const ACTION_COLORS = {
  BAN: COLORS.RED,
  KICK: COLORS.RED,
  MUTE: COLORS.RED,
  UNMUTE: COLORS.GREEN,
  WARN: COLORS.YELLOW,
  PURGE: COLORS.YELLOW,
  LOCK: COLORS.RED,
  UNLOCK: COLORS.GREEN,
  NUKE: COLORS.RED,
};

export async function sendModLog(guild, { action, target, moderator, reason, extra }) {
  if (!guild) return;
  const data = getGuildData(guild.id);
  if (!data.modLogChannelId) return;
  const channel = guild.channels.cache.get(data.modLogChannelId) || (await guild.channels.fetch(data.modLogChannelId).catch(() => null));
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(ACTION_COLORS[action] ?? COLORS.BLUE)
    .setTitle(`Action: ${action}`)
    .addFields(
      { name: 'User', value: target ? `<@${target.id ?? target}> (${target.tag ?? target})` : 'N/A', inline: true },
      { name: 'Moderator', value: moderator ? `<@${moderator.id}> (${moderator.tag})` : 'System', inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: false },
      { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
    )
    .setTimestamp();

  if (extra) embed.addFields({ name: 'Details', value: extra, inline: false });

  await channel.send({ embeds: [embed] }).catch(() => {});
}
