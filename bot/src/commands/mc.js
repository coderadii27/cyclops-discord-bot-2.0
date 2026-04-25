import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { getGuildData } from '../storage.js';

export default {
  name: 'mc',
  aliases: ['msgcount', 'messages'],
  description: 'Show a user\'s total message count in this server.',
  async execute({ message, args }) {
    const target = message.mentions.users?.first() ||
      (args[0] ? await message.client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : message.author);
    const data = getGuildData(message.guild.id);
    const count = data.messageCounts[target.id] ?? 0;
    const embed = new EmbedBuilder()
      .setColor(COLORS.BLUE)
      .setTitle('💬 Message Count')
      .setDescription(`**${target.tag}** has sent **${count.toLocaleString()}** messages tracked since the bot joined.`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
