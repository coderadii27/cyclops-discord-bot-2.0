import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'greet',
  data: new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Configure greet messages for new members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName('new_channel')
        .setDescription('Set greet channel and message')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel to greet in').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName('message').setDescription('Greet message. Use {user}, {server}, {count}.').setRequired(true))
        .addIntegerOption((o) => o.setName('delete_after_sec').setDescription('Auto-delete after seconds (0 = never)').setMinValue(0)))
    .addSubcommand((s) =>
      s.setName('off').setDescription('Disable greet messages')),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission.')], ephemeral: true });
    }
    const data = getGuildData(interaction.guild.id);
    const sub = interaction.options.getSubcommand();
    if (sub === 'off') {
      data.greet = null;
      await saveGuildData(interaction.guild.id);
      return interaction.reply({ embeds: [successEmbed('Greet messages disabled.', '👋 Greet Off')], ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const deleteAfter = interaction.options.getInteger('delete_after_sec') ?? 0;
    data.greet = { channelId: channel.id, message, deleteAfter };
    await saveGuildData(interaction.guild.id);
    return interaction.reply({ embeds: [successEmbed(
      `Greet configured for <#${channel.id}>.\nMessage: ${message}\nAuto-delete: ${deleteAfter > 0 ? `${deleteAfter}s` : 'off'}`,
      '✅ Greet Set',
    )], ephemeral: true });
  },
};
