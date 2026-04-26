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

    const status = await message.reply({ embeds: [warnEmbed('Re-syncing slash commands across **all servers**… please wait.', '🔄 Syncing')] });

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

      // 1) WIPE global commands so they don't appear duplicated alongside guild commands
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] });

      // 2) Push fresh commands to EVERY guild the bot is in (instant — no 1-hour wait)
      let synced = 0;
      let failed = 0;
      const guilds = [...client.guilds.cache.values()];
      for (const g of guilds) {
        try {
          await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, g.id), { body: payloads });
          synced++;
        } catch (e) {
          console.error(`[sync] guild ${g.id} failed:`, e.message);
          failed++;
        }
      }

      await status.edit({
        embeds: [successEmbed(
          `Synced **${payloads.length}** commands to **${synced}** server(s)${failed ? ` (${failed} failed)` : ''}.\n\nGlobal duplicates have been **cleared**. Commands are live **right now** on every server.`,
          '✅ Slash Commands Synced',
        )],
      });
    } catch (e) {
      console.error('[sync]', e);
      await status.edit({ embeds: [errorEmbed(`Sync failed: \`${e.message ?? e}\``)] });
    }
  },
};
