import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { buildSlotListEmbed, buildSlotListComponents } from '../tournament/panel.js';

export default {
  name: 'slot-list',
  data: new SlashCommandBuilder()
    .setName('slot-list')
    .setDescription('Post / refresh the public slot list for a tournament.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((o) => o.setName('tournament').setDescription('Tournament name').setRequired(true).setAutocomplete(true))
    .addChannelOption((o) => o.setName('channel').setDescription('Override channel (default: tournament slot-list channel)').addChannelTypes(ChannelType.GuildText)),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Channels** permission.')], ephemeral: true });
    }
    const data = getGuildData(interaction.guild.id);
    const name = interaction.options.getString('tournament');
    const tournament = Object.values(data.tournaments).find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!tournament) return interaction.reply({ embeds: [errorEmbed('Tournament not found.')], ephemeral: true });

    const overrideCh = interaction.options.getChannel('channel');
    const channel = overrideCh ?? interaction.guild.channels.cache.get(tournament.slotListChannelId);
    if (!channel) return interaction.reply({ embeds: [errorEmbed('No slot list channel set.')], ephemeral: true });

    const embed = buildSlotListEmbed(tournament);
    const components = buildSlotListComponents();
    const sent = await channel.send({ embeds: [embed], components });
    tournament.slotListChannelId = channel.id;
    tournament.slotListMessageId = sent.id;
    await saveGuildData(interaction.guild.id);

    return interaction.reply({ embeds: [successEmbed(`Slot list posted in <#${channel.id}>.`, '📋 Slot List')], ephemeral: true });
  },
  async autocomplete({ interaction }) {
    const data = getGuildData(interaction.guild.id);
    const focused = interaction.options.getFocused().toLowerCase();
    const options = Object.values(data.tournaments)
      .filter((t) => t.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((t) => ({ name: t.name.slice(0, 100), value: t.name.slice(0, 100) }));
    await interaction.respond(options);
  },
};
