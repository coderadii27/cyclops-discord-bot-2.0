import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';

const SPINNER_FRAMES = ['◴', '◷', '◶', '◵'];

export default {
  name: 'purge',
  aliases: ['clear', 'clean'],
  description: 'Bulk delete messages. Usage: ?purge <1-100> or ?purge @user <count>',
  async execute({ message, args }) {
    if (!canManageMessages(message.member)) {
      const r = await message.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
      setTimeout(() => { r.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
      return;
    }

    let target = message.mentions.users?.first();
    let countArg = target ? args[1] : args[0];
    let count = parseInt(countArg, 10);
    if (Number.isNaN(count)) count = 50;
    if (count < 1 || count > 100) {
      const r = await message.reply({ embeds: [errorEmbed('Count must be between **1** and **100**.')] });
      setTimeout(() => { r.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
      return;
    }

    // Step 1 — show animated processing UI
    const processing = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(COLORS.YELLOW)
        .setDescription(`${SPINNER_FRAMES[0]}  **Purging messages…**`)],
    });

    // Animate the spinner (4 frames = ~1s)
    let frame = 0;
    const spinner = setInterval(() => {
      frame = (frame + 1) % SPINNER_FRAMES.length;
      processing.edit({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.YELLOW)
          .setDescription(`${SPINNER_FRAMES[frame]}  **Purging messages…**`)],
      }).catch(() => {});
    }, 250);

    // Step 2 — fetch & delete
    let messages = await message.channel.messages.fetch({ limit: 100 });
    if (target) messages = messages.filter((m) => m.author.id === target.id);
    messages = Array.from(messages.values()).slice(0, count);

    let num = 0;
    if (messages.length) {
      const deleted = await message.channel.bulkDelete(messages, true).catch(() => null);
      num = deleted?.size ?? 0;
    }

    // Stop the spinner and delete the user's invocation message
    clearInterval(spinner);
    await message.delete().catch(() => {});

    // Step 3 — final result, auto-delete after 5s
    await processing.edit({
      embeds: [new EmbedBuilder()
        .setColor(num > 0 ? COLORS.GREEN : COLORS.RED)
        .setDescription(`${num > 0 ? '🧹' : '⚠️'}  **${num}** message${num === 1 ? '' : 's'} deleted${target ? ` from <@${target.id}>` : ''}.`)],
    }).catch(() => {});
    setTimeout(() => processing.delete().catch(() => {}), 5000);

    if (num > 0) {
      await sendModLog(message.guild, {
        action: 'PURGE',
        target: target ?? { tag: 'channel-wide', id: message.channel.id },
        moderator: message.author,
        reason: `Purged ${num} messages in <#${message.channel.id}>`,
      });
    }
  },
};
