import { errorEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';

export default {
  name: 'say',
  description: 'Make the bot say something.',
  async execute({ message, args }) {
    if (!canManageMessages(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
    }
    const text = args.join(' ').trim();
    if (!text) return message.reply({ embeds: [errorEmbed('Provide some text. Usage: `?say <message>`')] });
    await message.delete().catch(() => {});
    await message.channel.send({ content: text, allowedMentions: { parse: [] } });
  },
};
