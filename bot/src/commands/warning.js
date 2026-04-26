import { infoEmbed, errorEmbed } from '../utils/embeds.js';
import { getGuildData } from '../storage.js';

export default {
  name: 'warning',
  aliases: ['warnings'],
  description: 'View warnings of a user.',
  async execute({ message, args }) {
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : message.member);
    if (!target) return message.channel.send({ embeds: [errorEmbed('Mention a valid user. Usage: `?warning @user`')] });

    const data = getGuildData(message.guild.id);
    const list = data.warnings[target.id] || [];
    if (!list.length) {
      return message.channel.send({ embeds: [infoEmbed(`**${target.user.tag}** has no warnings.`, '📋 Warnings')] });
    }
    const lines = list.slice(-15).map((w, i) => `**${i + 1}.** ${w.reason}\n   • by <@${w.moderatorId}> • <t:${Math.floor(w.time / 1000)}:R>`).join('\n\n');
    return message.channel.send({ embeds: [infoEmbed(`**Total:** ${list.length}\n\n${lines}`, `📋 Warnings — ${target.user.tag}`)] });
  },
};
