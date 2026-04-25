import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { canManageNicknames } from '../utils/permissions.js';

export default {
  name: 'setnick',
  description: 'Change a user nickname.',
  async execute({ message, args }) {
    if (!canManageNicknames(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Nicknames** permission.')] });
    }
    const target = message.mentions.members?.first() ||
      (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [errorEmbed('Mention a valid user. Usage: `?setnick @user New Name`')] });
    if (!target.manageable) return message.reply({ embeds: [errorEmbed('I cannot change that user\'s nickname.')] });

    const nick = args.slice(1).join(' ').slice(0, 32);
    await target.setNickname(nick || null, `Changed by ${message.author.tag}`).catch(() => null);
    return message.reply({ embeds: [successEmbed(`✏️ Nickname updated for **${target.user.tag}** → **${nick || 'reset'}**.`, 'Nickname Changed')] });
  },
};
