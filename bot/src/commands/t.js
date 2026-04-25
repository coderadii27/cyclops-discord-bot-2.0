import { errorEmbed } from '../utils/embeds.js';
import { getGuildData } from '../storage.js';
import { buildMainPanel } from '../tournament/panel.js';

export default {
  name: 't',
  aliases: ['tourney', 'tournament'],
  description: 'Open the CYCLOPS tournament panel.',
  async execute({ message }) {
    const data = getGuildData(message.guild.id);
    const modRole = data.tournamentModRoleId;
    if (!message.member.permissions.has('Administrator') && (!modRole || !message.member.roles.cache.has(modRole))) {
      return message.reply({ embeds: [errorEmbed('You need administrator permission or the tournament moderator role. Run `?setup` first.')] });
    }

    const { embed, components } = buildMainPanel(message.guild, data);
    return message.reply({ embeds: [embed], components });
  },
};
