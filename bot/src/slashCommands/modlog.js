import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { MOD_LOG_CHANNEL_NAME } from '../config.js';

export default {
  name: 'modlog',
  data: new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Create the mod-logs channel and bind it for action logs.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute({ interaction }) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [errorEmbed('Administrator only.')], ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const data = getGuildData(guild.id);

    let ch = guild.channels.cache.find((c) => c.name === MOD_LOG_CHANNEL_NAME && c.type === ChannelType.GuildText);
    if (!ch) {
      ch = await guild.channels.create({
        name: MOD_LOG_CHANNEL_NAME,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        ],
        reason: 'CYCLOPS mod-logs channel',
      });
    }
    data.modLogChannelId = ch.id;
    await saveGuildData(guild.id);

    return interaction.editReply({ embeds: [successEmbed(
      `📜 Mod log channel set to <#${ch.id}>.\nLogged actions: bans, kicks, mutes, warnings, purges, locks.`,
      '✅ Mod Log Configured',
    )] });
  },
};
