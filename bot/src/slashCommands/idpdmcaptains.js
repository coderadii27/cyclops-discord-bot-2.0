import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData } from '../storage.js';

export default {
  name: 'idpdmcaptains',
  data: new SlashCommandBuilder()
    .setName('idpdmcaptains')
    .setDescription('DM Room ID & Password to all team captains of a tournament.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((o) => o.setName('tournament').setDescription('Tournament name').setRequired(true).setAutocomplete(true))
    .addStringOption((o) => o.setName('room_id').setDescription('Room ID').setRequired(true))
    .addStringOption((o) => o.setName('password').setDescription('Room password').setRequired(true)),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Channels** permission.')], ephemeral: true });
    }
    const data = getGuildData(interaction.guild.id);
    const name = interaction.options.getString('tournament');
    const tournament = Object.values(data.tournaments).find((t) => t.name.toLowerCase() === name.toLowerCase()) ||
      Object.values(data.tournaments).find((t) => t.id === name);
    if (!tournament) return interaction.reply({ embeds: [errorEmbed('Tournament not found.')], ephemeral: true });

    const roomId = interaction.options.getString('room_id');
    const password = interaction.options.getString('password');

    await interaction.deferReply({ ephemeral: true });

    let sent = 0;
    let failed = 0;
    const embed = new EmbedBuilder()
      .setColor(COLORS.GOLD)
      .setTitle(`🎮 ${tournament.name} — Match Details (IDP)`)
      .addFields(
        { name: 'Room ID', value: `\`\`\`${roomId}\`\`\``, inline: false },
        { name: 'Password', value: `\`\`\`${password}\`\`\``, inline: false },
      )
      .setFooter({ text: 'CYCLOPS Tournament System • Do not share' })
      .setTimestamp();

    for (const slot of tournament.slots || []) {
      const cap = await interaction.guild.members.fetch(slot.captainId).catch(() => null);
      if (!cap) { failed++; continue; }
      try {
        await cap.send({ content: `**Team ${slot.teamName}** — match credentials:`, embeds: [embed] });
        sent++;
      } catch {
        failed++;
      }
    }

    return interaction.editReply({ embeds: [successEmbed(`📨 IDP sent to **${sent}** captains. Failed: **${failed}**.`, '✅ IDP DM Sent')] });
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
