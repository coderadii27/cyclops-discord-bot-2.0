import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canMute } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'unmute',
  description: 'Remove a timeout from a user.',
  async execute({ message, args }) {
    if (!canMute(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Moderate Members** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a valid user. Usage: `?unmute @user reason`')] });
    if (!target.moderatable) return message.reply({ embeds: [errorEmbed('I cannot unmute that user.')] });
    if (!target.isCommunicationDisabled()) return message.reply({ embeds: [errorEmbed('That user is not muted.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.timeout(null, `${reason} • by ${message.author.tag}`);

    await message.reply({ embeds: [successEmbed(`🔊 **${target.user.tag}** has been unmuted.\n**Reason:** ${reason}`, 'User Unmuted')] });
    await sendModLog(message.guild, { action: 'UNMUTE', target: target.user, moderator: message.author, reason });
  },
};
