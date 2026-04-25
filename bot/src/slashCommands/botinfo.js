import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, BOT_INFO } from '../config.js';

export default {
  name: 'botinfo',
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display information about CYCLOPS.'),
  async execute({ interaction, client }) {
    let totalMembers = 0;
    for (const g of client.guilds.cache.values()) totalMembers += g.memberCount ?? 0;
    const embed = new EmbedBuilder()
      .setColor(COLORS.PURPLE)
      .setTitle('🤖 CYCLOPS — Tournament & Moderation Bot')
      .setDescription('**Automate your tournaments. Moderate with ease.**\n\nReliable. Efficient. Completely free.')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: 'Created by', value: BOT_INFO.CREATOR, inline: true },
        { name: 'Bot created on', value: BOT_INFO.CREATED_ON, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'Total servers', value: client.guilds.cache.size.toLocaleString(), inline: true },
        { name: 'Serving total', value: `${totalMembers.toLocaleString()} members`, inline: true },
        { name: 'Library', value: `discord.js`, inline: true },
        { name: 'Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: 'CYCLOPS • Made with 💗 by Aditya' })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
