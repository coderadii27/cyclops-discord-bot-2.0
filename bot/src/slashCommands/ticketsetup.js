import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { buildTicketPanel } from '../tickets/handlers.js';

export default {
  name: 'ticketsetup',
  data: new SlashCommandBuilder()
    .setName('ticketsetup')
    .setDescription('Configure the ticket system and post the ticket panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName('channel').setDescription('Channel where the ticket panel will be posted').addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .addRoleOption((o) => o.setName('staff_role').setDescription('Role that can view and claim tickets').setRequired(true))
    .addChannelOption((o) =>
      o.setName('category').setDescription('Category where ticket channels will be created').addChannelTypes(ChannelType.GuildCategory).setRequired(true),
    ),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission.')], ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    const staffRole = interaction.options.getRole('staff_role');
    const category = interaction.options.getChannel('category');

    const data = getGuildData(interaction.guild.id);
    data.ticket = {
      panelChannelId: channel.id,
      staffRoleId: staffRole.id,
      categoryId: category.id,
      configuredAt: Date.now(),
    };

    const panel = buildTicketPanel(interaction.guild.name);
    const sent = await channel.send(panel).catch((e) => {
      throw new Error(`Failed to send panel in ${channel}: ${e.message}`);
    });
    data.ticket.panelMessageId = sent.id;
    await saveGuildData(interaction.guild.id);

    return interaction.reply({
      embeds: [successEmbed(
        `Ticket system configured.\n• Panel: <#${channel.id}>\n• Staff role: <@&${staffRole.id}>\n• Tickets category: <#${category.id}>`,
        '✅ Ticket Setup Complete',
      )],
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
  },
};
