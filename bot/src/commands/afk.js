import { successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'afk',
  description: 'Set your AFK status.',
  async execute({ message, args }) {
    const reason = args.join(' ') || 'AFK';
    const data = getGuildData(message.guild.id);
    data.afk[message.author.id] = { reason, since: Date.now() };
    await saveGuildData(message.guild.id);
    return message.reply({ embeds: [successEmbed(`💤 ${message.author}, you are now AFK.\n**Reason:** ${reason}`, 'AFK Set')] });
  },
};
