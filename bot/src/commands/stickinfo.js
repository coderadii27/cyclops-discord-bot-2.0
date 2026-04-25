import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { canManageMessages } from '../utils/permissions.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'stickinfo',
  description: 'View sticky messages and remove them.',
  async execute({ message }) {
    if (!canManageMessages(message.member)) {
      return message.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')] });
    }
    const data = getGuildData(message.guild.id);
    const entries = Object.entries(data.sticky);
    if (!entries.length) {
      return message.reply({ embeds: [successEmbed('No sticky messages set.', '📌 Sticky Messages')] });
    }

    const lines = entries.map(([cid, s], i) => `**${i + 1}.** <#${cid}> — ${s.text.length > 80 ? s.text.slice(0, 80) + '...' : s.text}`).join('\n');
    const embed = new EmbedBuilder().setColor(COLORS.BLUE).setTitle('📌 Sticky Messages').setDescription(lines).setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId('stickdel:select')
      .setPlaceholder('Select a sticky message to delete')
      .addOptions(
        entries.slice(0, 25).map(([cid, s]) => ({
          label: `#${s.channelName ?? cid}`,
          description: s.text.length > 90 ? s.text.slice(0, 90) + '...' : s.text,
          value: cid,
        })),
      );

    await message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
  },
};

export async function handleStickyDelete(interaction) {
  if (!canManageMessages(interaction.member)) {
    return interaction.reply({ embeds: [errorEmbed('You need **Manage Messages** permission.')], ephemeral: true });
  }
  const channelId = interaction.values[0];
  const data = getGuildData(interaction.guild.id);
  const sticky = data.sticky[channelId];
  if (!sticky) return interaction.reply({ embeds: [errorEmbed('Not found.')], ephemeral: true });

  if (sticky.lastMessageId) {
    const ch = interaction.guild.channels.cache.get(channelId);
    if (ch) {
      const msg = await ch.messages.fetch(sticky.lastMessageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
    }
  }
  delete data.sticky[channelId];
  await saveGuildData(interaction.guild.id);
  await interaction.update({ embeds: [successEmbed(`Removed sticky message from <#${channelId}>.`, '📌 Sticky Removed')], components: [] });
}
