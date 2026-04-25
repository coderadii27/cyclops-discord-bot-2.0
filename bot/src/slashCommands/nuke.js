import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { sendModLog } from '../utils/modlog.js';

export default {
  name: 'nuke',
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Clone & delete this channel — wipes all messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('You need **Manage Channels** permission.')], ephemeral: true });
    }
    const ch = interaction.channel;
    if (!ch || !ch.guild) return interaction.reply({ embeds: [errorEmbed('Use this in a guild text channel.')], ephemeral: true });

    await interaction.reply({ embeds: [successEmbed(`💥 Nuking <#${ch.id}>... Channel will be recreated.`)], ephemeral: true });

    const position = ch.position;
    const moderator = interaction.user;
    const guild = ch.guild;

    const cloned = await ch.clone({ reason: `Nuked by ${moderator.tag}` });
    await ch.delete(`Nuked by ${moderator.tag}`);
    await cloned.setPosition(position).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(COLORS.RED)
      .setTitle('💥 Channel Nuked')
      .setDescription(`This channel has been nuked by ${moderator}.\nAll previous messages have been wiped.`)
      .setTimestamp();
    await cloned.send({ embeds: [embed] }).catch(() => {});
    await sendModLog(guild, { action: 'NUKE', target: { tag: `#${cloned.name}`, id: cloned.id }, moderator, reason: 'Channel nuked' });
  },
};
