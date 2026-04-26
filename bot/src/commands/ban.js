import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canBan } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'ban',
  description: 'Ban a user from the server.',
  async execute({ message, args }) {
    if (!canBan(message.member)) {
      return message.channel.send({ embeds: [errorEmbed('You need **Ban Members** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.channel.send({ embeds: [errorEmbed('Mention a valid user. Usage: `?ban @user reason`')] });
    if (!target.bannable) return message.channel.send({ embeds: [errorEmbed('I cannot ban that user.')] });
    if (target.id === message.author.id) return message.channel.send({ embeds: [errorEmbed('You cannot ban yourself.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({ reason: `${reason} • by ${message.author.tag}` });

    await message.channel.send({ embeds: [successEmbed(`✅ **${target.user.tag}** has been banned.\n**Reason:** ${reason}`, 'User Banned')] });
    await sendModLog(message.guild, { action: 'BAN', target: target.user, moderator: message.author, reason });
  },
};
