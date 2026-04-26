import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AuditLogEvent } from 'discord.js';
import { COLORS, BOT_INFO } from '../config.js';
import { brandedFooter } from '../utils/embeds.js';

export async function handleGuildCreate(guild, client) {
  console.log(`[guildCreate] Joined guild ${guild.name} (${guild.id}) — ${guild.memberCount} members`);

  // Try to identify who added the bot via audit logs
  let inviter = null;
  try {
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 5 });
    const entry = logs.entries.find((e) => e.target?.id === client.user.id);
    if (entry?.executor && !entry.executor.bot) inviter = entry.executor;
  } catch (e) {
    // Missing View Audit Log permission — fall back to owner
  }

  // Fallback to guild owner
  if (!inviter) {
    inviter = await guild.fetchOwner().then((o) => o.user).catch(() => null);
  }
  if (!inviter) return;

  const embed = new EmbedBuilder()
    .setColor(COLORS.GREEN)
    .setTitle('👋 Thanks for adding CYCLOPS!')
    .setDescription(
      `Hey **${inviter.username}**! Thank you for adding **CYCLOPS** to **${guild.name}**.\n\n` +
      `Here's a quick start to get going:\n` +
      `• Use \`?help\` to see all commands\n` +
      `• Use \`/ticketsetup\` to create a ticket panel\n` +
      `• Use \`/tournament\` commands to manage tournaments\n` +
      `• Use \`?sync\` (admins) to refresh slash commands instantly\n\n` +
      `Need help or want to suggest a feature? Join our **Support Server** below.`,
    )
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: brandedFooter() })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('➕ Invite CYCLOPS').setStyle(ButtonStyle.Link).setURL(BOT_INFO.INVITE_URL),
    new ButtonBuilder().setLabel('🛟 Support Server').setStyle(ButtonStyle.Link).setURL(BOT_INFO.SUPPORT_SERVER_URL),
  );

  await inviter.send({ embeds: [embed], components: [row] }).catch(() => {
    console.log(`[guildCreate] Could not DM ${inviter.tag} (DMs likely closed).`);
  });
}
