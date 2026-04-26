import { warnEmbed, errorEmbed, successEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'warn',
  description: 'Warn a user.',
  async execute({ message, args }) {
    if (!canManageMessages(message.member)) {
      return message.channel.send({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.channel.send({ embeds: [errorEmbed('Mention a valid user. Usage: `?warn @user reason`')] });
    if (target.user.bot) return message.channel.send({ embeds: [errorEmbed('You cannot warn a bot.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const data = getGuildData(message.guild.id);
    if (!data.warnings[target.id]) data.warnings[target.id] = [];
    data.warnings[target.id].push({ reason, moderatorId: message.author.id, time: Date.now() });
    await saveGuildData(message.guild.id);

    const count = data.warnings[target.id].length;
    await message.channel.send({ embeds: [warnEmbed(`⚠️ **${target.user.tag}** has been warned.\n**Reason:** ${reason}\n**Total warnings:** ${count}`, 'User Warned')] });

    target.send({ embeds: [warnEmbed(`You were warned in **${message.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${count}`)] }).catch(() => {});

    await sendModLog(message.guild, { action: 'WARN', target: target.user, moderator: message.author, reason, extra: `Total: ${count}` });
  },
};
