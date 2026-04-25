import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'stick',
  description: 'Stick a message to this channel (re-posts every 50 messages).',
  async execute({ message, args }) {
    if (!canManageMessages(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
    }
    const text = args.join(' ').trim();
    if (!text) return message.reply({ embeds: [errorEmbed('Provide a message. Usage: `?stick <message>`')] });

    const data = getGuildData(message.guild.id);
    data.sticky[message.channel.id] = {
      text,
      authorId: message.author.id,
      channelName: message.channel.name,
      createdAt: Date.now(),
      lastMessageId: null,
    };
    await saveGuildData(message.guild.id);

    const sent = await message.channel.send({ embeds: [{ title: '📌 Sticky Message', description: text, color: 0x5865F2 }] });
    data.sticky[message.channel.id].lastMessageId = sent.id;
    await saveGuildData(message.guild.id);

    await message.reply({ embeds: [successEmbed(`📌 Message stuck in <#${message.channel.id}>. It will re-post every 50 messages.`, 'Sticky Created')] });
  },
};
