import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canKick } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'kick',
  description: 'Kick a user from the server.',
  async execute({ message, args }) {
    if (!canKick(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Kick Members** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a valid user. Usage: `?kick @user reason`')] });
    if (!target.kickable) return message.reply({ embeds: [errorEmbed('I cannot kick that user.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('You cannot kick yourself.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.kick(`${reason} • by ${message.author.tag}`);

    await message.reply({ embeds: [successEmbed(`✅ **${target.user.tag}** has been kicked.\n**Reason:** ${reason}`, 'User Kicked')] });
    await sendModLog(message.guild, { action: 'KICK', target: target.user, moderator: message.author, reason });
  },
};
