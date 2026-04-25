import { REST, Routes, PermissionFlagsBits } from 'discord.js';
import { errorEmbed, successEmbed, warnEmbed } from '../utils/embeds.js';

export default {
  name: 'sync',
  aliases: ['resync', 'reload'],
  description: 'Re-register all slash commands so updates show up instantly. (Owner / Admin only)',
  async execute({ message, client }) {
    const isAdmin = message.member?.permissions?.has(PermissionFlagsBits.Administrator);
    const isOwner = message.author.id === message.guild.ownerId;
    if (!isAdmin && !isOwner) {
      return message.reply({ embeds: [errorEmbed('Only **server admins** or the **server owner** can run this.')] });
    }

    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_TOKEN) {
      return message.reply({ embeds: [errorEmbed('Missing `DISCORD_CLIENT_ID` or `DISCORD_TOKEN`.')] });
    }

    const status = await message.reply({ embeds: [warnEmbed('Re-syncing slash commands… please wait.', '🔄 Syncing')] });

    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      // Build payloads from in-memory loaded slash commands (deduped)
      const seen = new Set();
      const payloads = [];
      for (const cmd of new Set(client.slashCommands.values())) {
        if (!cmd?.data) continue;
        const json = cmd.data.toJSON();
        if (seen.has(json.name)) continue;
        seen.add(json.name);
        payloads.push(json);
      }

      // 1) Push to THIS guild for instant update (no 1-hour wait)
      const guildResult = await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, message.guild.id),
        { body: payloads },
      );

      // 2) Also push global (long-term home)
      const globalResult = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: payloads },
      );

      const guildCount = Array.isArray(guildResult) ? guildResult.length : 0;
      const globalCount = Array.isArray(globalResult) ? globalResult.length : 0;

      await status.edit({
        embeds: [successEmbed(
          `Synced **${guildCount}** commands to this server (instant) and **${globalCount}** globally.\n\nServer commands are live **right now**. Global commands may take up to an hour to appear in other servers.`,
          '✅ Slash Commands Synced',
        )],
      });
    } catch (e) {
      console.error('[sync]', e);
      await status.edit({ embeds: [errorEmbed(`Sync failed: \`${e.message ?? e}\``)] });
    }
  },
};
