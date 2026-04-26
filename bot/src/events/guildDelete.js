import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, BOT_INFO } from '../config.js';
import { brandedFooter } from '../utils/embeds.js';

export async function handleGuildDelete(guild, client) {
  if (!guild?.available && guild?.available !== undefined) {
    // Guild went unavailable (outage), not actually removed
    return;
  }
  console.log(`[guildDelete] Removed from guild ${guild?.name ?? guild?.id ?? 'unknown'} (${guild?.id ?? 'n/a'})`);

  const owner = await guild.fetchOwner().then((o) => o.user).catch(() => null);
  if (!owner) return;

  const ts = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(COLORS.RED)
    .setTitle('😢 Sorry to see CYCLOPS leave')
    .setDescription(
      `Hey **${owner.username}**, I noticed CYCLOPS was just removed from **${guild.name ?? 'your server'}** on <t:${ts}:F> (<t:${ts}:R>).\n\n` +
      `If something wasn't working right, I'd love to make it better! You can:\n` +
      `• Re-invite CYCLOPS using the button below\n` +
      `• Drop feedback in our **Support Server**\n\n` +
      `Thanks for trying CYCLOPS — hope to see you again soon!`,
    )
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: brandedFooter() })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🔁 Re-invite CYCLOPS').setStyle(ButtonStyle.Link).setURL(BOT_INFO.INVITE_URL),
    new ButtonBuilder().setLabel('🛟 Support Server').setStyle(ButtonStyle.Link).setURL(BOT_INFO.SUPPORT_SERVER_URL),
  );

  await owner.send({ embeds: [embed], components: [row] }).catch(() => {
    console.log(`[guildDelete] Could not DM ${owner.tag} (DMs likely closed).`);
  });
}
