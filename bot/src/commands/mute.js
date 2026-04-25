import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canMute } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';
import { parseDuration, formatDuration } from '../utils/parseDuration.js';

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

export default {
  name: 'mute',
  description: 'Timeout a user for a given duration.',
  async execute({ message, args }) {
    if (!canMute(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Moderate Members** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a valid user. Usage: `?mute @user 10m reason`')] });
    if (!target.moderatable) return message.reply({ embeds: [errorEmbed('I cannot mute that user.')] });

    const durStr = args[1];
    const ms = parseDuration(durStr);
    if (!ms || ms <= 0) return message.reply({ embeds: [errorEmbed('Invalid duration. Examples: `30s`, `10m`, `2h`, `1d`')] });
    if (ms > MAX_TIMEOUT_MS) return message.reply({ embeds: [errorEmbed('Duration too long. Maximum is 28 days.')] });

    const reason = args.slice(2).join(' ') || 'No reason provided';
    await target.timeout(ms, `${reason} • by ${message.author.tag}`);

    await message.reply({ embeds: [successEmbed(`🔇 **${target.user.tag}** muted for **${formatDuration(ms)}**.\n**Reason:** ${reason}`, 'User Muted')] });
    await sendModLog(message.guild, { action: 'MUTE', target: target.user, moderator: message.author, reason, extra: `Duration: ${formatDuration(ms)}` });
  },
};
