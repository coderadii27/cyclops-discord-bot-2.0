import { PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed } from '../utils/embeds.js';
import { isAdmin } from '../utils/permissions.js';
import { getGuildData, saveGuildData } from '../storage.js';
import { TOURNEY_MOD_ROLE, IDP_ACCESS_ROLE } from '../config.js';

export default {
  name: 'setup',
  description: 'Set up CYCLOPS tournament roles & permissions.',
  async execute({ message }) {
    if (!isAdmin(message.member)) {
      return message.reply({ embeds: [errorEmbed('Only **administrators** can run this command.')] });
    }

    const guild = message.guild;
    const data = getGuildData(guild.id);

    let modRole = guild.roles.cache.find((r) => r.name === TOURNEY_MOD_ROLE);
    if (!modRole) {
      modRole = await guild.roles.create({
        name: TOURNEY_MOD_ROLE,
        color: 0xEB459E,
        hoist: true,
        mentionable: true,
        permissions: [
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ModerateMembers,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.MentionEveryone,
        ],
        reason: 'CYCLOPS tournament moderator role',
      });
    }
    data.tournamentModRoleId = modRole.id;

    let idpRole = guild.roles.cache.find((r) => r.name === IDP_ACCESS_ROLE);
    if (!idpRole) {
      idpRole = await guild.roles.create({
        name: IDP_ACCESS_ROLE,
        color: 0xF1C40F,
        hoist: false,
        mentionable: false,
        reason: 'CYCLOPS IDP access role',
      });
    }
    data.idpAccessRoleId = idpRole.id;

    await saveGuildData(guild.id);

    return message.reply({
      embeds: [successEmbed(
        `✅ **CYCLOPS setup complete!**\n\n` +
        `• Created role <@&${modRole.id}> — tournament moderators\n` +
        `• Created role <@&${idpRole.id}> — IDP access for team captains\n\n` +
        `Run \`?t\` to open the tournament panel.`,
        '🏆 Setup Complete',
      )],
    });
  },
};
