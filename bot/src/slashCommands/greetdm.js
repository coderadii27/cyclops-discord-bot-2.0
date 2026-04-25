import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';

export default {
  name: 'greetdm',
  data: new SlashCommandBuilder()
    .setName('greetdm')
    .setDescription('Configure DM greeting for new members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s.setName('set')
        .setDescription('Set DM greet')
        .addStringOption((o) => o.setName('title').setDescription('DM title').setRequired(true))
        .addStringOption((o) => o.setName('description').setDescription('DM body. Use \\n for new lines.').setRequired(true)))
    .addSubcommand((s) => s.setName('off').setDescription('Disable DM greet')),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission.')], ephemeral: true });
    }
    const data = getGuildData(interaction.guild.id);
    const sub = interaction.options.getSubcommand();
    if (sub === 'off') {
      data.greetDm = null;
      await saveGuildData(interaction.guild.id);
      return interaction.reply({ embeds: [successEmbed('DM greet disabled.')], ephemeral: true });
    }
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description').replace(/\\n/g, '\n');
    data.greetDm = { title, description };
    await saveGuildData(interaction.guild.id);
    return interaction.reply({ embeds: [successEmbed(`DM greet set.\n**Title:** ${title}\n\n${description}`, '✅ Greet DM Configured')], ephemeral: true });
  },
};
