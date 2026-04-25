import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { canManageChannels } from '../utils/permissions.js';
import { sendModLog } from '../utils/modlog.js';
import { PermissionFlagsBits } from 'discord.js';

export default {
  name: 'lock',
  description: 'Lock the current channel for @everyone.',
  async execute({ message }) {
    if (!canManageChannels(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Channels** permission.')] });
    }
    const role = message.guild.roles.everyone;
    await message.channel.permissionOverwrites.edit(role, { SendMessages: false }).catch(() => {});
    await message.delete().catch(() => {});
    const reply = await message.channel.send({ embeds: [successEmbed(`🔒 <#${message.channel.id}> is now **locked**.`, 'Channel Locked')] });
    setTimeout(() => reply.delete().catch(() => {}), 4000);
    await sendModLog(message.guild, { action: 'LOCK', target: { tag: `#${message.channel.name}`, id: message.channel.id }, moderator: message.author, reason: 'Channel locked' });
  },
};
