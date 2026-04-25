import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';

export default {
  name: 'ping',
  description: 'Show bot latency.',
  async execute({ message, client }) {
    const sent = Date.now();
    const reply = await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.BLUE).setTitle('🏓 Pinging...').setDescription('Calculating...')] });
    const latency = reply.createdTimestamp - sent;
    const ws = Math.round(client.ws.ping);
    const status = ws < 100 ? '🟢 Excellent' : ws < 200 ? '🟡 Good' : '🔴 High';
    const embed = new EmbedBuilder()
      .setColor(ws < 200 ? COLORS.GREEN : COLORS.YELLOW)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
        { name: 'API Latency', value: `\`${ws}ms\``, inline: true },
        { name: 'Status', value: status, inline: true },
      )
      .setTimestamp();
    await reply.edit({ embeds: [embed] });
  },
};
