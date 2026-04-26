import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canBan } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'unban',
  description: 'Unban a previously banned user. Usage: ?unban <userID> [reason]',
  async execute({ message, args }) {
    if (!canBan(message.member)) {
      return message.channel.send({ embeds: [errorEmbed('You need **Ban Members** permission.')] });
    }
    const id = (args[0] || '').replace(/[<@!>]/g, '').trim();
    if (!id || !/^\d{15,25}$/.test(id)) {
      return message.channel.send({ embeds: [errorEmbed('Provide a valid **user ID**. Usage: `?unban <userID> [reason]`')] });
    }

    const ban = await message.guild.bans.fetch(id).catch(() => null);
    if (!ban) {
      return message.channel.send({ embeds: [errorEmbed('That user is **not banned** from this server.')] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      await message.guild.bans.remove(id, `${reason} • by ${message.author.tag}`);
    } catch (e) {
      return message.channel.send({ embeds: [errorEmbed(`Failed to unban: \`${e.message}\``)] });
    }

    await message.channel.send({
      embeds: [successEmbed(`✅ **${ban.user.tag}** (\`${id}\`) has been **unbanned**.\n**Reason:** ${reason}`, 'User Unbanned')],
    });
    await sendModLog(message.guild, { action: 'UNBAN', target: ban.user, moderator: message.author, reason });
  },
};
