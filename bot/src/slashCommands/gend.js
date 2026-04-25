import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData } from '../storage.js';
import { endGiveaway } from './gstart.js';

export default {
  name: 'gend',
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('End an active giveaway.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('giveaway_id').setDescription('Message ID of the giveaway').setRequired(true)),
  async execute({ interaction, client }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission.')], ephemeral: true });
    }
    const id = interaction.options.getString('giveaway_id');
    const data = getGuildData(interaction.guild.id);
    if (!data.giveaways[id]) return interaction.reply({ embeds: [errorEmbed('Giveaway not found.')], ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    await endGiveaway(client, interaction.guild.id, id, true);
    return interaction.editReply({ embeds: [successEmbed('Giveaway ended.', '✅ Giveaway Ended')] });
  },
};
