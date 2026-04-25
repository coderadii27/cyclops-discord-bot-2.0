import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'purge',
  aliases: ['clear', 'clean'],
  description: 'Bulk delete messages. Usage: ?purge <1-100> or ?purge @user <count>',
  async execute({ message, args }) {
    if (!canManageMessages(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
    }

    let target = message.mentions.users?.first();
    let countArg = target ? args[1] : args[0];
    let count = parseInt(countArg, 10);
    if (Number.isNaN(count)) count = 50;
    if (count < 1 || count > 100) {
      return message.reply({ embeds: [errorEmbed('Count must be between 1 and 100.')] });
    }

    await message.delete().catch(() => {});

    let messages = await message.channel.messages.fetch({ limit: 100 });
    if (target) messages = messages.filter((m) => m.author.id === target.id);
    messages = Array.from(messages.values()).slice(0, count);
    if (messages.length === 0) {
      const reply = await message.channel.send({ embeds: [errorEmbed('No messages to delete.')] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return;
    }

    const deleted = await message.channel.bulkDelete(messages, true).catch(() => null);
    const num = deleted?.size ?? 0;

    const reply = await message.channel.send({ embeds: [successEmbed(`🧹 Deleted **${num}** messages${target ? ` from <@${target.id}>` : ''}.`, 'Purged')] });
    setTimeout(() => reply.delete().catch(() => {}), 5000);

    await sendModLog(message.guild, {
      action: 'PURGE',
      target: target ?? { tag: 'channel-wide', id: message.channel.id },
      moderator: message.author,
      reason: `Purged ${num} messages in <#${message.channel.id}>`,
    });
  },
};
