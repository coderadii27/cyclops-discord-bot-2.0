import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { getGuildData } from '../storage.js';

export async function handleGuildMemberAdd(member, client) {
  const data = getGuildData(member.guild.id);

  if (data.greet) {
    const ch = member.guild.channels.cache.get(data.greet.channelId);
    if (ch && ch.isTextBased()) {
      const text = (data.greet.message || 'Welcome {user} to **{server}**!')
        .replaceAll('{user}', `<@${member.id}>`)
        .replaceAll('{server}', member.guild.name)
        .replaceAll('{count}', String(member.guild.memberCount));
      const embed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setTitle('👋 New Member')
        .setDescription(text)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      const msg = await ch.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => null);
      if (msg && data.greet.deleteAfter > 0) {
        setTimeout(() => msg.delete().catch(() => {}), data.greet.deleteAfter * 1000);
      }
    }
  }

  if (data.greetDm) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle(data.greetDm.title || `Welcome to ${member.guild.name}!`)
      .setDescription(data.greetDm.description || 'Glad to have you here.')
      .setTimestamp();
    member.send({ embeds: [embed] }).catch(() => {});
  }
}
